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

## 6. SDE-2 $\rightarrow$ Senior Summary Checklist

- [ ] **No `switch (type)` or `if (type == ...)` chains** for business logic variants. Use Strategy + Registry.
- [ ] **No `Map<String, Object>` metadata passing.** Use strongly-typed DTO records with constructor invariants.
- [ ] **Thin, role-based interfaces.** Gateways implement only the capabilities they physically support.
- [ ] **Open for Extension, Closed for Modification.** Adding a new payment partner requires creating 1 new class, touching zero existing files.
