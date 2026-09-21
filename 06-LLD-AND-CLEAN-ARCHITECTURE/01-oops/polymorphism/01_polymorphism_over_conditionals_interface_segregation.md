---
title: "Polymorphism Over Conditionals & Dynamic Dispatch"
category: "LLD"
sub_category: "OOP - Polymorphism"
type: "concept"
tags:
  - "lld"
  - "oops"
  - "polymorphism"
  - "conditionals"
  - "strategy-pattern"
  - "dynamic-dispatch"
  - "interface-segregation"
updated: "2026-09-21"
---

# 01 — Polymorphism Over Conditionals & Interface Segregation (ISP)

> **Track:** Core Backend Foundations & Runtime Systems  
> **Target Level:** SDE-2 $\rightarrow$ Senior Engineer / Tech Lead  
> **Focus:** Eliminating Cyclomatic Complexity, Dynamic Dispatch vs Switch Trees, Strongly-Typed Polymorphic Payloads, and Role-Based Interfaces

---

## 1. The Procedural Trap: The Growing `switch` / `if-else` Nightmare

In early-stage codebases, handling multiple business variants (e.g. payment types, notification channels, discount rules, user permissions) starts with a simple `if-else` or `switch`:

```java
// ❌ JUNIOR CODE: The Procedural Anti-Pattern
public class PaymentService {
    public void processPayment(Order order, String type, Map<String, Object> metadata) {
        if ("CREDIT_CARD".equalsIgnoreCase(type)) {
            String cardNumber = (String) metadata.get("cardNumber");
            String cvv = (String) metadata.get("cvv");
            // Call Stripe API
        } else if ("PAYPAL".equalsIgnoreCase(type)) {
            String email = (String) metadata.get("email");
            // Call PayPal OAuth API
        } else if ("CRYPTO".equalsIgnoreCase(type)) {
            String wallet = (String) metadata.get("wallet");
            // Verify blockchain tx
        } else {
            throw new IllegalArgumentException("Unsupported: " + type);
        }
    }
}
```

---

## 2. The 4 Production Failure Modes

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 THE 4 FAILURE MODES                                     │
├───────────────────────────────┬─────────────────────────────────────────────────────────┤
│ 1. Shotgun Surgery            │ Adding 1 new type forces edits across 10 service files. │
│ 2. Untyped Runtime Crashes    │ Map<String, Object> causes ClassCastException & nulls.  │
│ 3. OCP Violation              │ Core orchestrator is open for modification, not closed. │
│ 4. Single Responsibility Loss │ PaymentService knows the private API details of Stripe, │
│                               │ PayPal, and Blockchain RPCs all in one massive file.    │
└───────────────────────────────┴─────────────────────────────────────────────────────────┘
```

---

## 3. The Senior Architectural Solution: Strategy + Registry Pattern

Instead of hardcoding a switch tree, we convert variants into **independent polymorphic plugins** that register themselves into a lookup registry.

```
                                    ┌───────────────────────┐
                                    │    PaymentRegistry    │ (O(1) Map Lookup)
                                    └───────────┬───────────┘
                                                │ resolves strategy
                                                ▼
                                    ┌───────────────────────┐
                                    │  PaymentStrategy<T>   │ (Interface)
                                    └───────────▲───────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 │                              │                              │
     ┌───────────────────────┐      ┌───────────────────────┐      ┌───────────────────────┐
     │  StripeCardStrategy   │      │    PaypalStrategy     │      │  RazorpayUpiStrategy  │
     │  implements           │      │  implements           │      │  implements           │
     │  PaymentStrategy<Card>│      │  PaymentStrategy<Mail>│      │  PaymentStrategy<Upi> │
     │  + RefundableGateway  │      │  + RefundableGateway  │      │  + QrCodeGeneratable  │
     └───────────────────────┘      └───────────────────────┘      └───────────────────────┘
```

---

## 4. Eliminating Untyped `Map<String, Object>` (Type Safety)

Replace generic hash maps with **Strongly-Typed Polymorphic Payloads** (using Sealed Interfaces / Records in Java 17+):

```java
// 1. Sealed Hierarchy: Closed set of valid payment requests
public sealed interface PaymentDetails 
    permits CardPaymentDetails, PaypalPaymentDetails, UpiPaymentDetails, CouponPaymentDetails {}

public record CardPaymentDetails(
    CardNumber cardNumber,
    Cvv cvv,
    ExpiryDate expiry
) implements PaymentDetails {}

public record PaypalPaymentDetails(
    EmailAddress email
) implements PaymentDetails {}

public record UpiPaymentDetails(
    VpaAddress vpaAddress
) implements PaymentDetails {}

public record CouponPaymentDetails(
    CouponCode couponCode
) implements PaymentDetails {}
```

---

## 5. Interface Segregation Principle (ISP): Role-Based Contracts

Never create a "God Gateway" interface that forces all providers to implement unsupported methods with `throw new UnsupportedOperationException()`.

```java
// ❌ FAT GOD INTERFACE (Violates ISP)
public interface PaymentGateway {
    PaymentReceipt charge(Money amount);
    RefundReceipt refund(String txId, Money amount);
    void setupRecurring(SubscriptionPlan plan); // UPI does not support recurring!
    String generateQrCode();                   // Credit Cards do not generate QR!
}
```

```java
// ✅ SEGREGATED ROLE-BASED CONTRACTS (Follows ISP)
public interface PaymentGateway {
    GatewayId getId();
}

public interface DirectChargeableGateway extends PaymentGateway {
    PaymentReceipt charge(Order order, PaymentDetails details);
}

public interface RefundableGateway extends PaymentGateway {
    RefundReceipt refund(String gatewayTransactionId, Money amount);
}

public interface QrCodeGeneratableGateway extends PaymentGateway {
    DynamicQrReceipt generateDynamicQr(Order order, Duration ttl);
}

public interface PaymentLinkGeneratableGateway extends PaymentGateway {
    PaymentLinkReceipt createPaymentLink(Order order, CustomerContact contact);
}
```

---

## 6. Runtime Performance & JIT Inline Caching (Hardware Reality)

When writing clean polymorphic code like `gateway.charge(order, details)`, how does the CPU / JVM execute dynamic dispatch under the hood?

```
                       HOW THE RUNTIME DISPATCHES CALLS
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
1. Monomorphic (1 Type)      2. Bimorphic (2 Types)      3. Megamorphic (3+ Types)
JIT inlines machine code.    JIT emits simple if/else.   JIT falls back to vtable lookup.
[ FASTEST: 0ns Overhead ]    [ ~1ns branch predictor ]   [ ~5-10ns indirect jump ]
```

### 1. Monomorphic Call Site (1 Implementation Active)
* **Devirtualization / Inlining:** If HotSpot or V8 observes only 1 class active at runtime (e.g. `StripeGatewayAdapter`), the JIT compiler eliminates the virtual call and copies the machine code directly into the caller. Zero pointer hops.

### 2. Bimorphic Call Site (2 Implementations Active)
* The JIT compiles the call into a simple conditional branch (`if class == Stripe ... else ...`), which hardware branch predictors predict with >99% accuracy.

### 3. Megamorphic Call Site (3+ Implementations Active)
* When 3+ implementations hit the same line of code, the JIT uses a **vtable / itable indirect pointer jump**.
* **Tech Lead Trade-Off:** A vtable lookup costs **$\sim 5\text{ to }10\text{ nanoseconds}$**, while a database query or network HTTP call costs **$50,000,000\text{ nanoseconds}$ ($50\text{ ms}$)**. Never sacrifice clean architecture for premature micro-optimization.

---

## 7. SDE-2 $\rightarrow$ Senior Summary Checklist

- [ ] **No `switch (type)` or `if (type == ...)` chains** for business logic variants. Use Strategy + Registry.
- [ ] **No `Map<String, Object>` metadata passing.** Use strongly-typed DTO records with constructor invariants.
- [ ] **Thin, role-based interfaces.** Gateways implement only the capabilities they physically support.
- [ ] **Open for Extension, Closed for Modification.** Adding a new payment partner requires creating 1 new class, touching zero existing files.
- [ ] **Understand dispatch realities.** Rely on JIT monomorphic/bimorphic inlining without fearing polymorphic vtable dispatch overhead.

