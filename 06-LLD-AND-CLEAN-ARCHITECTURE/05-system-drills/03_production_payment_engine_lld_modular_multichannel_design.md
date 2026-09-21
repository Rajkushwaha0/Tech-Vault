---
title: "Production Payment Engine LLD: Modular Multi-Channel Architecture"
category: "LLD"
sub_category: "System Drills"
type: "drill"
tags:
  - "lld"
  - "system-design"
  - "payment-engine"
  - "strategy-pattern"
  - "idempotency"
  - "retry-mechanism"
  - "drill"
updated: "2026-09-21"
---

# 02 — Production-Grade Payment Gateway Orchestrator (Low-Level Design)

> **Track:** Core Backend Foundations & Runtime Systems  
> **Target Level:** SDE-2 $\rightarrow$ Senior Engineer / Tech Lead  
> **Scope:** Multi-Channel Gateway Architecture (Stripe, Razorpay, PayPal, NPCI Direct UPI, In-House Coupons, Dynamic QR & Split Payments)

---

## 1. System Requirements & Domain Complexity

### Supported Providers & Capabilities
Modern high-scale platforms must support multiple providers with varying instrument capabilities:

| Provider / Channel | Cards | UPI (Collect/Intent) | Dynamic QR | Payment Link | Subscriptions | Internal Coupon |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Stripe** | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Razorpay** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **PayPal** | ✅ (Wallet) | ❌ | ❌ | ✅ | ✅ | ❌ |
| **NPCI Direct Switch**| ❌ | ✅ (Direct) | ✅ | ❌ | ❌ | ❌ |
| **In-House Coupon/Wallet**| ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (Ledger) |

### Key Architectural Challenges
1. **The 2D Matrix (Channel vs Gateway):** A user selects an *Instrument* (e.g. UPI QR), and the engine dynamically routes it to an active *Gateway Adapter* (e.g. Razorpay or NPCI).
2. **Split Payments:** An order worth \$100 can be paid with a **\$30 In-House Coupon** + **\$70 Razorpay UPI QR**.
3. **Idempotency & Concurrency:** Zero double-debits across distributed retries.
4. **Interface Segregation (ISP):** Adapters implement only the protocols they support.

---

## 2. High-Level Class & Component Architecture

```
                                  ┌───────────────────────────────┐
                                  │      Checkout Controller      │
                                  └──────────────┬────────────────┘
                                                 │ creates intent / process
                                                 ▼
                                  ┌───────────────────────────────┐
                                  │   PaymentOrchestratorService  │
                                  └──────┬──────────────┬─────────┘
                                         │              │
                   ┌─────────────────────┘              └─────────────────────┐
                   ▼                                                          ▼
     ┌───────────────────────────┐                              ┌───────────────────────────┐
     │   CouponLedgerService     │ (In-House Split)             │   GatewayRoutingEngine    │
     │   - applyCoupon()         │                              │   - resolveBestGateway()  │
     │   - releaseCoupon()       │                              └─────────────┬─────────────┘
     └───────────────────────────┘                                            │
                                                                              ▼
                                                                ┌───────────────────────────┐
                                                                │  GatewayAdapterRegistry   │
                                                                └─────────────┬─────────────┘
                                                                              │
             ┌────────────────────────┬────────────────────────┬──────────────┴────────────────────────┐
             ▼                        ▼                        ▼                                       ▼
  ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐               ┌──────────────────────┐
  │    StripeAdapter     │ │   RazorpayAdapter    │ │    PaypalAdapter     │               │   NpciDirectAdapter  │
  │                      │ │                      │ │                      │               │                      │
  │ implements:          │ │ implements:          │ │ implements:          │               │ implements:          │
  │ - CardGateway        │ │ - CardGateway        │ │ - PaypalWalletGateway│               │ - UpiGateway         │
  │ - PaymentLinkGateway │ │ - UpiGateway         │ │ - PaymentLinkGateway │               │ - QrCodeGateway      │
  │ - RefundableGateway  │ │ - QrCodeGateway      │ │ - RefundableGateway  │               │ - WebhookVerifiable  │
  │ - WebhookVerifiable  │ │ - PaymentLinkGateway │ │ - WebhookVerifiable  │               └──────────────────────┘
  └──────────────────────┘ │ - RefundableGateway  │ └──────────────────────┘
                           │ - WebhookVerifiable  │
                           └──────────────────────┘
```

---

## 3. Core Domain Models & Invariants

### 1. Value Objects: Money & Payment Instruments

```java
package com.techvault.payment.domain.model;

import java.math.BigDecimal;
import java.util.Currency;
import java.util.Objects;

public enum PaymentMethodType {
    CREDIT_DEBIT_CARD,
    UPI_COLLECT,
    UPI_INTENT,
    DYNAMIC_QR,
    PAYMENT_LINK,
    PAYPAL_WALLET,
    IN_HOUSE_COUPON
}

public enum GatewayProvider {
    STRIPE,
    RAZORPAY,
    PAYPAL,
    NPCI_DIRECT,
    INTERNAL_LEDGER
}

public enum PaymentStatus {
    INITIATED,
    PENDING_CUSTOMER_ACTION, // E.g., Dynamic QR generated, waiting for scan
    AUTHORIZED,
    CAPTURED,
    FAILED,
    REFUNDED
}
```

---

### 2. Sealed Polymorphic Payment Requests

```java
package com.techvault.payment.domain.model.request;

import com.techvault.payment.domain.model.PaymentMethodType;

public sealed interface PaymentDetails {
    PaymentMethodType getMethodType();
}

public record CardDetails(
    String cardNumber,
    String cvv,
    int expiryMonth,
    int expiryYear,
    String cardHolderName
) implements PaymentDetails {
    public CardDetails {
        if (cardNumber == null || cardNumber.length() < 15) {
            throw new IllegalArgumentException("Invalid card number");
        }
    }
    @Override public PaymentMethodType getMethodType() { return PaymentMethodType.CREDIT_DEBIT_CARD; }
}

public record UpiCollectDetails(
    String virtualPaymentAddress // e.g. user@oksbi
) implements PaymentDetails {
    @Override public PaymentMethodType getMethodType() { return PaymentMethodType.UPI_COLLECT; }
}

public record DynamicQrRequestDetails(
    long ttlSeconds
) implements PaymentDetails {
    @Override public PaymentMethodType getMethodType() { return PaymentMethodType.DYNAMIC_QR; }
}

public record CouponDetails(
    String couponCode,
    String customerId
) implements PaymentDetails {
    @Override public PaymentMethodType getMethodType() { return PaymentMethodType.IN_HOUSE_COUPON; }
}
```

---

## 4. Role-Based Gateway Interfaces (ISP)

```java
package com.techvault.payment.domain.gateway;

import com.techvault.payment.domain.model.*;
import com.techvault.payment.domain.model.request.*;

public interface PaymentGatewayAdapter {
    GatewayProvider getProviderName();
    boolean isHealthy();
}

// 1. For Direct Synchronous / 3DS Card Charges
public interface CardChargeableGateway extends PaymentGatewayAdapter {
    PaymentTransactionResult chargeCard(String transactionId, Money amount, CardDetails details);
}

// 2. For UPI Collect & Intent
public interface UpiPaymentGateway extends PaymentGatewayAdapter {
    PaymentTransactionResult initiateUpiCollect(String transactionId, Money amount, UpiCollectDetails details);
}

// 3. For Dynamic QR Generation (Razorpay / NPCI)
public interface QrCodeGeneratableGateway extends PaymentGatewayAdapter {
    QrCodeResult generateDynamicQr(String transactionId, Money amount, DynamicQrRequestDetails details);
}

// 4. For Hosted Payment Links (Stripe / Razorpay / PayPal)
public interface PaymentLinkGeneratableGateway extends PaymentGatewayAdapter {
    PaymentLinkResult createPaymentLink(String transactionId, Money amount, String customerEmail, String callbackUrl);
}

// 5. For Refunds
public interface RefundableGateway extends PaymentGatewayAdapter {
    RefundResult processRefund(String gatewayReferenceId, Money amount, String reason);
}

// 6. For Webhook Signature Verification
public interface WebhookVerifiableGateway extends PaymentGatewayAdapter {
    WebhookValidationResult verifyAndParseWebhook(String payload, String signatureHeader);
}
```

---

## 5. Gateway Adapters Implementation

### 1. Stripe Adapter (Card + Payment Link + Webhooks)
```java
package com.techvault.payment.infrastructure.adapter;

import com.techvault.payment.domain.gateway.*;
import com.techvault.payment.domain.model.*;
import com.techvault.payment.domain.model.request.*;
import org.springframework.stereotype.Component;

@Component
public class StripeGatewayAdapter implements 
    CardChargeableGateway, 
    PaymentLinkGeneratableGateway, 
    RefundableGateway, 
    WebhookVerifiableGateway {

    @Override
    public GatewayProvider getProviderName() {
        return GatewayProvider.STRIPE;
    }

    @Override
    public boolean isHealthy() {
        return true; // Health check ping
    }

    @Override
    public PaymentTransactionResult chargeCard(String transactionId, Money amount, CardDetails details) {
        // Execute Stripe SDK PaymentIntent create & confirm
        return new PaymentTransactionResult(
            transactionId, 
            "pi_stripe_987654321", 
            PaymentStatus.CAPTURED, 
            "Stripe direct card charge successful"
        );
    }

    @Override
    public PaymentLinkResult createPaymentLink(String transactionId, Money amount, String customerEmail, String callbackUrl) {
        // Call Stripe Checkout Sessions API
        return new PaymentLinkResult(
            transactionId, 
            "https://checkout.stripe.com/pay/cs_live_123456", 
            Instant.now().plus(Duration.ofMinutes(30))
        );
    }

    @Override
    public RefundResult processRefund(String gatewayRefId, Money amount, String reason) {
        // Call Stripe Refund API
        return new RefundResult("re_stripe_123", RefundStatus.SUCCESS);
    }

    @Override
    public WebhookValidationResult verifyAndParseWebhook(String payload, String signature) {
        // Stripe Signature verification using Webhook.constructEvent()
        return new WebhookValidationResult(true, "evt_123", PaymentStatus.CAPTURED);
    }
}
```

---

### 2. Razorpay Adapter (Card + UPI + Dynamic QR + Payment Links)
```java
package com.techvault.payment.infrastructure.adapter;

import com.techvault.payment.domain.gateway.*;
import com.techvault.payment.domain.model.*;
import com.techvault.payment.domain.model.request.*;
import org.springframework.stereotype.Component;

@Component
public class RazorpayGatewayAdapter implements 
    CardChargeableGateway, 
    UpiPaymentGateway, 
    QrCodeGeneratableGateway, 
    PaymentLinkGeneratableGateway, 
    RefundableGateway, 
    WebhookVerifiableGateway {

    @Override
    public GatewayProvider getProviderName() {
        return GatewayProvider.RAZORPAY;
    }

    @Override
    public boolean isHealthy() {
        return true;
    }

    @Override
    public PaymentTransactionResult chargeCard(String transactionId, Money amount, CardDetails details) {
        // Call Razorpay Payments API
        return new PaymentTransactionResult(transactionId, "pay_rzp_111", PaymentStatus.CAPTURED, "Authorized");
    }

    @Override
    public PaymentTransactionResult initiateUpiCollect(String transactionId, Money amount, UpiCollectDetails details) {
        // Call Razorpay UPI Collect API
        return new PaymentTransactionResult(transactionId, "pay_rzp_upi_222", PaymentStatus.PENDING_CUSTOMER_ACTION, "UPI collect request pushed");
    }

    @Override
    public QrCodeResult generateDynamicQr(String transactionId, Money amount, DynamicQrRequestDetails details) {
        // Razorpay BharatQR / UPI QR generation API
        String qrString = "upi://pay?pa=razorpay@icici&pn=Merchant&am=" + amount.getAmount() + "&tr=" + transactionId;
        return new QrCodeResult(transactionId, qrString, "data:image/png;base64,iVBORw0KGgo...", Instant.now().plusSeconds(details.ttlSeconds()));
    }

    @Override
    public PaymentLinkResult createPaymentLink(String transactionId, Money amount, String email, String callback) {
        return new PaymentLinkResult(transactionId, "https://rzp.io/i/abcdef", Instant.now().plus(Duration.ofMinutes(15)));
    }

    @Override
    public RefundResult processRefund(String gatewayRefId, Money amount, String reason) {
        return new RefundResult("rfnd_rzp_333", RefundStatus.SUCCESS);
    }

    @Override
    public WebhookValidationResult verifyAndParseWebhook(String payload, String signature) {
        // HMAC SHA256 Signature verification
        return new WebhookValidationResult(true, "rzp_event_999", PaymentStatus.CAPTURED);
    }
}
```

---

### 3. NPCI Direct UPI Switch Adapter (Direct UPI & Dynamic QR)
```java
package com.techvault.payment.infrastructure.adapter;

import com.techvault.payment.domain.gateway.*;
import com.techvault.payment.domain.model.*;
import com.techvault.payment.domain.model.request.*;
import org.springframework.stereotype.Component;

@Component
public class NpciDirectUpiAdapter implements 
    UpiPaymentGateway, 
    QrCodeGeneratableGateway, 
    WebhookVerifiableGateway {

    @Override
    public GatewayProvider getProviderName() {
        return GatewayProvider.NPCI_DIRECT;
    }

    @Override
    public boolean isHealthy() {
        return true;
    }

    @Override
    public PaymentTransactionResult initiateUpiCollect(String transactionId, Money amount, UpiCollectDetails details) {
        // ISO 8583 / XML Direct Banking Switch API Call
        return new PaymentTransactionResult(transactionId, "npci_rrn_444555", PaymentStatus.PENDING_CUSTOMER_ACTION, "Pushed to NPCI Common PSP Switch");
    }

    @Override
    public QrCodeResult generateDynamicQr(String transactionId, Money amount, DynamicQrRequestDetails details) {
        String upiUri = "upi://pay?pa=platform@bank&pn=TechVault&am=" + amount.getAmount() + "&tr=" + transactionId + "&cu=INR";
        return new QrCodeResult(transactionId, upiUri, "data:image/png;base64,...", Instant.now().plusSeconds(details.ttlSeconds()));
    }

    @Override
    public WebhookValidationResult verifyAndParseWebhook(String payload, String signature) {
        // Public key RSA verification for NPCI switch callbacks
        return new WebhookValidationResult(true, "npci_ack_001", PaymentStatus.CAPTURED);
    }
}
```

---

## 6. In-House Coupon & Internal Ledger Service

For promotional discounts and in-house gift cards, we do not call external banks. We debit the internal ledger within the transaction boundary.

```java
package com.techvault.payment.domain.service;

import com.techvault.payment.domain.model.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InHouseCouponLedgerService {

    @Transactional
    public CouponDiscountResult applyAndLockCoupon(String couponCode, String customerId, Money orderTotal) {
        // 1. Validate coupon validity, usage limits, and user eligibility
        // 2. Lock coupon in DB (SELECT ... FOR UPDATE) to prevent double-redemption
        Money discountAmount = Money.of("20.00", orderTotal.getCurrency());
        
        return new CouponDiscountResult(
            couponCode, 
            discountAmount, 
            orderTotal.subtract(discountAmount) // Remaining balance for external gateway
        );
    }

    @Transactional
    public void rollbackCouponLock(String couponCode, String customerId) {
        // If external payment gateway fails, release coupon lock
    }
}
```

---

## 7. Dynamic Gateway Routing Engine

How does the platform select between **Razorpay**, **Stripe**, and **NPCI** dynamically without code changes?

```java
package com.techvault.payment.domain.router;

import com.techvault.payment.domain.gateway.PaymentGatewayAdapter;
import com.techvault.payment.domain.model.GatewayProvider;
import com.techvault.payment.domain.model.PaymentMethodType;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class GatewayRoutingEngine {
    private final List<PaymentGatewayAdapter> allAdapters;

    public GatewayRoutingEngine(List<PaymentGatewayAdapter> allAdapters) {
        this.allAdapters = allAdapters;
    }

    public <T extends PaymentGatewayAdapter> T resolveBestGateway(PaymentMethodType method, Class<T> gatewayInterface) {
        return allAdapters.stream()
            .filter(gatewayInterface::isInstance)
            .filter(PaymentGatewayAdapter::isHealthy)
            .map(gatewayInterface::cast)
            // Senior Logic: Dynamic rule (e.g. NPCI first for INR UPI if healthy, fallback to Razorpay)
            .findFirst()
            .orElseThrow(() -> new IllegalStateException("No healthy gateway found for method: " + method));
    }
}
```

---

## 8. The Complete Payment Orchestrator (With Split Payment Support)

```java
package com.techvault.payment.application;

import com.techvault.payment.domain.gateway.*;
import com.techvault.payment.domain.model.*;
import com.techvault.payment.domain.model.request.*;
import com.techvault.payment.domain.router.GatewayRoutingEngine;
import com.techvault.payment.domain.service.InHouseCouponLedgerService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentOrchestratorService {

    private final InHouseCouponLedgerService couponService;
    private final GatewayRoutingEngine routingEngine;
    private final PaymentTransactionRepository transactionRepository;

    public PaymentOrchestratorService(
        InHouseCouponLedgerService couponService,
        GatewayRoutingEngine routingEngine,
        PaymentTransactionRepository transactionRepository
    ) {
        this.couponService = couponService;
        this.routingEngine = routingEngine;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public PaymentExecutionResponse processPayment(
        Order order, 
        Optional<CouponDetails> optionalCoupon, 
        PaymentDetails externalPaymentDetails
    ) {
        Money totalAmount = order.getTotalAmount();
        Money payableAmount = totalAmount;
        String couponCodeApplied = null;

        // 1. STEP 1: SPLIT PAYMENT — In-House Coupon Deduction
        if (optionalCoupon.isPresent()) {
            CouponDetails coupon = optionalCoupon.get();
            CouponDiscountResult couponResult = couponService.applyAndLockCoupon(
                coupon.couponCode(), 
                coupon.customerId(), 
                totalAmount
            );
            payableAmount = couponResult.remainingAmount();
            couponCodeApplied = coupon.couponCode();
        }

        // If coupon fully covers 100% of order total, complete immediately
        if (payableAmount.getAmount().compareTo(BigDecimal.ZERO) == 0) {
            order.markPaid("COUPON_100_PERCENT");
            return new PaymentExecutionResponse(PaymentStatus.CAPTURED, "Order fully settled with In-House Coupon");
        }

        // 2. STEP 2: ROUTE TO EXTERNAL GATEWAY BASED ON INTERFACE
        String transactionId = UUID.randomUUID().toString();

        try {
            return switch (externalPaymentDetails) {
                case CardDetails card -> {
                    CardChargeableGateway gateway = routingEngine.resolveBestGateway(
                        card.getMethodType(), 
                        CardChargeableGateway.class
                    );
                    PaymentTransactionResult result = gateway.chargeCard(transactionId, payableAmount, card);
                    yield handleResult(order, result);
                }
                case UpiCollectDetails upi -> {
                    UpiPaymentGateway gateway = routingEngine.resolveBestGateway(
                        upi.getMethodType(), 
                        UpiPaymentGateway.class
                    );
                    PaymentTransactionResult result = gateway.initiateUpiCollect(transactionId, payableAmount, upi);
                    yield handleResult(order, result);
                }
                case DynamicQrRequestDetails qr -> {
                    QrCodeGeneratableGateway gateway = routingEngine.resolveBestGateway(
                        qr.getMethodType(), 
                        QrCodeGeneratableGateway.class
                    );
                    QrCodeResult qrResult = gateway.generateDynamicQr(transactionId, payableAmount, qr);
                    yield new PaymentExecutionResponse(PaymentStatus.PENDING_CUSTOMER_ACTION, qrResult.qrDataUrl());
                }
                default -> throw new UnsupportedOperationException("Unsupported payment instrument: " + externalPaymentDetails);
            };
        } catch (Exception ex) {
            // Rollback locked coupon if external call fails
            if (couponCodeApplied != null) {
                couponService.rollbackCouponLock(couponCodeApplied, optionalCoupon.get().customerId());
            }
            throw new PaymentProcessingException("Payment initiation failed", ex);
        }
    }

    private PaymentExecutionResponse handleResult(Order order, PaymentTransactionResult result) {
        if (result.status() == PaymentStatus.CAPTURED) {
            order.markPaid(result.gatewayReferenceId());
        }
        return new PaymentExecutionResponse(result.status(), result.message());
    }
}
```

---

## 9. Architectural Takeaways for Senior Engineers & Tech Leads

1. **True Polymorphism:** Adding a new gateway (e.g. `AdyenGatewayAdapter`) or a new channel (e.g. `CryptoGatewayAdapter`) is as simple as creating 1 new class implementing the relevant segregated interfaces.
2. **Split Payment Cleanliness:** The orchestrator handles in-house ledgers first, calculates the remaining balance, and routes the delta to third parties.
3. **High Availability (HA):** `GatewayRoutingEngine` filters by `isHealthy()`, giving automated failover if Razorpay or Stripe experiences an outage.
4. **Zero Untyped Maps:** Strong compile-time validation prevents malformed requests before touching external payment networks.
