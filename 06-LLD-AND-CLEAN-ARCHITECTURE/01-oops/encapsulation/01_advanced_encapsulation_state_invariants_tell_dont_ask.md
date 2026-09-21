---
title: "Advanced Encapsulation: State Invariants & Tell Don't Ask"
category: "LLD"
sub_category: "OOP - Encapsulation"
type: "concept"
tags:
  - "lld"
  - "oops"
  - "encapsulation"
  - "state-invariants"
  - "tell-dont-ask"
  - "rich-domain-models"
  - "immutability"
updated: "2026-09-21"
---

# 01 — Advanced Encapsulation, State Invariants & "Tell, Don't Ask"

> **Track:** Core Backend Foundations & Runtime Systems  
> **Target Level:** SDE-2 $\rightarrow$ Senior Engineer / Tech Lead  
> **Focus:** Rich Domain Modeling, Invariant Protection, Value Objects, and Eliminating Anemic Models

---

## 1. Executive Summary & The Master 4-Week Roadmap

Before designing patterns (Factory, Strategy, State) or building Low-Level Design (LLD) systems, backend engineers must master **Domain Modeling, Operating System Execution, Concurrency, and Queue Architecture**.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  WEEK 1: ADVANCED OOP & DOMAIN MODELING (THE SDE-3 MENTAL MODEL)             │
│  Encapsulation Invariants • Polymorphism vs Conditionals • DIP & Contracts   │
├──────────────────────────────────────────────────────────────────────────────┤
│  WEEK 2: OS, MEMORY, PROCESSES, THREADS & HARDWARE REALITY                   │
│  Stack vs Heap • Context Switching • CPU Cache Coherency • BIO vs NIO (epoll)│
├──────────────────────────────────────────────────────────────────────────────┤
│  WEEK 3: CONCURRENCY, SYNCHRONIZATION & MULTI-THREADING PRIMITIVES           │
│  Race Conditions • Locks vs Atomics/CAS • Memory Visibility • Thread Pools   │
├──────────────────────────────────────────────────────────────────────────────┤
│  WEEK 4: RUNTIMES (JAVA vs NODE vs PYTHON) & ASYNC QUEUE ARCHITECTURES       │
│  Virtual Threads • Python GIL • Node Event Loop/libuv • In-Process to Kafka  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The Great Industry Misconception of Encapsulation

If you ask a junior/mid-level engineer to explain encapsulation, the textbook answer is:
> *"Making instance variables `private` and generating getters and setters (`@Data`, `@Getter`, `@Setter`)."*

### Why this is an Anti-Pattern (Anemic Domain Model)
Generating public getters and setters for every field **destroys encapsulation** and reduces domain models to dumb bags of data.

```
❌ The Illusion of Encapsulation (Procedural code in disguise):
┌─────────────────────────────────────────┐
│              Order Entity               │
│  private String status;                 │
│  public String getStatus() { ... }      │  <── Anyone from the outside can read
│  public void setStatus(String status) { │  <── Anyone from the outside can overwrite
│      this.status = status;              │      with ANY invalid state at any time!
│  }                                      │
└─────────────────────────────────────────┘
```

When setters are exposed:
1. **Broken State Invariants:** Any service, controller, or test can mutate the internal state without validation.
2. **Leaky Business Logic:** Business rules leak into external service classes, leading to massive code duplication across services.
3. **Audit Impossibility:** It is impossible to track *why* or *how* a state transition occurred.

---

## 3. What Encapsulation Actually Means (The Senior Definition)

In production software, encapsulation has two mandatory responsibilities:

1. **Protecting State Invariants:**
   An **Invariant** is a business rule that **must NEVER be violated** at any point during an object's lifecycle (from construction to destruction).
   - *Example:* A bank account balance can never drop below zero.
   - *Example:* An order cannot transition to `SHIPPED` unless payment is `CAPTURED`.
2. **Hiding Internal Representation:**
   Callers must only know **what business capabilities** the object provides, never **how internal state is structured or stored**.

---

## 4. The Architectural Principle: "Tell, Don't Ask" (TDA)

### ❌ Anti-Pattern: "Ask and Manipulate"
An external service asks the object for its internal data, makes decisions outside, and pushes the mutated data back.

```java
// IN SOME EXTERNAL SERVICE CLASS (BAD)
if (order.getStatus().equals("PAID") && order.getItems().size() > 0) {
    if (!order.isCancelled()) {
        order.setStatus("SHIPPED"); // <── External service forces state change
        order.setShippedAt(Instant.now());
    }
}
```

### ✅ Production Pattern: "Tell, Don't Ask"
The caller tells the entity to perform a business action. The entity enforces its own rules and updates its own private state.

```java
// IN APPLICATION USE-CASE (CLEAN)
order.ship(trackingNumber); // <── Tell the entity to perform a business operation
```

---

## 5. First-Principles Domain Modeling: Value Objects vs. Entities

| Dimension | **Entity** | **Value Object (VO)** |
| :--- | :--- | :--- |
| **Identity** | Has a unique identity (`UUID`, `id`). Two entities with different IDs are distinct even if all other fields match. | **No identity.** Two Value Objects are equal if their internal attribute values are identical. |
| **Mutability** | **Mutable** exclusively via controlled domain methods. | **100% Immutable.** Any modification yields a new instance. |
| **Examples** | `User`, `BankAccount`, `Order`, `Product` | `Money(amount, currency)`, `EmailAddress`, `GeoCoordinate(lat, lon)` |

---

## 6. Comprehensive Case Study: Junior Code vs. Production-Grade Senior Code

### 🔴 The Junior PR Submission (Full of Production Traps)

```java
public class BankAccount {
    private String accountNumber;
    private double balance;
    private boolean isFrozen;

    // Standard getters and setters for all fields generated by IDE
    public double getBalance() { return balance; }
    public void setBalance(double balance) { this.balance = balance; }

    public boolean isFrozen() { return isFrozen; }
    public void setFrozen(boolean frozen) { isFrozen = frozen; }
}

// In BankingService.java:
public class BankingService {
    public void withdraw(BankAccount account, double amount) {
        if (!account.isFrozen()) {
            if (account.getBalance() >= amount) {
                double newBalance = account.getBalance() - amount;
                account.setBalance(newBalance);
            } else {
                throw new RuntimeException("Insufficient funds");
            }
        } else {
            throw new RuntimeException("Account is frozen");
        }
    }
}
```

### 🚨 Tech Lead Code Review: The 5 Critical Flaws
1. **The `double` Precision Trap (Financial Drift):** Binary floating-point arithmetic (IEEE 754) cannot represent fractions like `0.1` or `0.01` accurately (`0.1 + 0.2 = 0.30000000000000004`). Over millions of transactions, ledgers drift.
2. **Broken Invariants via `setBalance()`:** Any caller can invoke `account.setBalance(-50000)` and bypass all validation.
3. **Violation of "Tell, Don't Ask":** `BankingService` queries state, performs calculations, and forces updates back. If 10 services perform withdrawals, all 10 duplicate `if (!isFrozen)`.
4. **Vague `RuntimeException`:** Calling layers cannot differentiate business exceptions (e.g. mapping `AccountFrozenException` to HTTP 403 vs `InsufficientFundsException` to HTTP 422).
5. **Race Condition Hazard:** If two concurrent threads execute `withdraw()` on the same instance, both read the old balance and overwrite each other (Lost Update Anomaly).

---

### 🟢 The Senior / Tech Lead Production Implementation

#### Step 1: Self-Validating Immutable Value Object (`Money.java`)
```java
package com.techvault.domain.model;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Currency;
import java.util.Objects;

public final class Money {
    private final BigDecimal amount;
    private final Currency currency;

    public Money(BigDecimal amount, Currency currency) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Money amount must be non-null and non-negative");
        }
        if (currency == null) {
            throw new IllegalArgumentException("Currency cannot be null");
        }
        // Strict financial scaling (2 decimal places, Banker's Rounding)
        this.amount = amount.setScale(2, RoundingMode.HALF_EVEN);
        this.currency = currency;
    }

    public static Money of(String amountStr, Currency currency) {
        return new Money(new BigDecimal(amountStr), currency);
    }

    public static Money zero(Currency currency) {
        return new Money(BigDecimal.ZERO, currency);
    }

    public Money subtract(Money debit) {
        ensureSameCurrency(debit);
        if (this.isLessThan(debit)) {
            throw new IllegalArgumentException("Cannot subtract larger amount from smaller balance");
        }
        return new Money(this.amount.subtract(debit.amount), this.currency);
    }

    public Money add(Money credit) {
        ensureSameCurrency(credit);
        return new Money(this.amount.add(credit.amount), this.currency);
    }

    public boolean isLessThan(Money other) {
        ensureSameCurrency(other);
        return this.amount.compareTo(other.amount) < 0;
    }

    private void ensureSameCurrency(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("Currency mismatch: " + this.currency + " vs " + other.currency);
        }
    }

    public BigDecimal getAmount() { return amount; }
    public Currency getCurrency() { return currency; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Money money)) return false;
        return amount.equals(money.amount) && currency.equals(money.currency);
    }

    @Override
    public int hashCode() {
        return Objects.hash(amount, currency);
    }
}
```

---

#### Step 2: Specific Domain Exceptions
```java
package com.techvault.domain.exception;

import com.techvault.domain.model.Money;

public class AccountFrozenException extends RuntimeException {
    public AccountFrozenException(String accountNumber) {
        super("Operation rejected: Bank account " + accountNumber + " is frozen.");
    }
}

public class InsufficientFundsException extends RuntimeException {
    public InsufficientFundsException(String accountNumber, Money available, Money requested) {
        super(String.format("Insufficient funds in account %s. Available: %s %s, Requested: %s %s",
                accountNumber, available.getAmount(), available.getCurrency(),
                requested.getAmount(), requested.getCurrency()));
    }
}
```

---

#### Step 3: Rich Domain Entity (`BankAccount.java`)
```java
package com.techvault.domain.model;

import com.techvault.domain.exception.AccountFrozenException;
import com.techvault.domain.exception.InsufficientFundsException;
import java.time.Instant;

public class BankAccount {
    private final String accountNumber;
    private Money balance;
    private boolean isFrozen;
    private final Instant createdAt;

    // Constructor enforces invariant that account starts in a valid state
    public BankAccount(String accountNumber, Currency currency) {
        if (accountNumber == null || accountNumber.isBlank()) {
            throw new IllegalArgumentException("Account number cannot be null or blank");
        }
        this.accountNumber = accountNumber;
        this.balance = Money.zero(currency);
        this.isFrozen = false;
        this.createdAt = Instant.now();
    }

    // BUSINESS METHOD: Protects withdrawal invariants
    public void withdraw(Money debitAmount) {
        if (this.isFrozen) {
            throw new AccountFrozenException(this.accountNumber);
        }
        if (this.balance.isLessThan(debitAmount)) {
            throw new InsufficientFundsException(this.accountNumber, this.balance, debitAmount);
        }

        // State mutation is strictly internal
        this.balance = this.balance.subtract(debitAmount);
    }

    // BUSINESS METHOD: Protects deposit invariants
    public void deposit(Money creditAmount) {
        if (this.isFrozen) {
            throw new AccountFrozenException(this.accountNumber);
        }
        this.balance = this.balance.add(creditAmount);
    }

    public void freeze() {
        this.isFrozen = true;
    }

    public void unfreeze() {
        this.isFrozen = false;
    }

    // READ-ONLY GETTERS (Zero public setters!)
    public String getAccountNumber() { return accountNumber; }
    public Money getBalance() { return balance; }
    public boolean isFrozen() { return isFrozen; }
    public Instant getCreatedAt() { return createdAt; }
}
```

---

#### Step 4: Outbound Persistence Contract (`AccountRepository.java`)
```java
package com.techvault.domain.repository;

import com.techvault.domain.model.BankAccount;
import java.util.Optional;

public interface AccountRepository {
    Optional<BankAccount> findByAccountNumber(String accountNumber);
    void save(BankAccount account);
}
```

---

#### Step 5: Application Service / Orchestrator (`BankingService.java`)
```java
package com.techvault.application.usecase;

import com.techvault.domain.model.BankAccount;
import com.techvault.domain.model.Money;
import com.techvault.domain.repository.AccountRepository;

public class BankingService {
    private final AccountRepository accountRepository;

    public BankingService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public void withdraw(String accountNumber, Money amount) {
        // 1. Fetch Aggregate Root
        BankAccount account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new IllegalArgumentException("Account not found: " + accountNumber));

        // 2. TELL, DON'T ASK: Entity self-validates invariants & executes
        account.withdraw(amount);

        // 3. Persist mutated state
        accountRepository.save(account);
    }
}
```

---

## 7. Comparative Architectural Review

| Attribute | Junior / Anemic Approach | Senior / Rich Domain Approach |
| :--- | :--- | :--- |
| **State Invariants** | Unprotected. Anyone can call `setBalance(-1000)`. | **Unbreakable.** Zero setters. Mutations only happen through business methods (`withdraw`, `deposit`). |
| **Numeric Precision** | IEEE 754 `double` introduces floating-point errors. | Exact decimal arithmetic using immutable `Money` Value Object. |
| **Coupling & Cohesion** | Logic scattered across 10 service files. | Highly cohesive. All account invariants live in `BankAccount`. |
| **Unit Testability** | Must mock DB and services to test basic arithmetic. | Pure Java domain tests run in sub-milliseconds with zero mocks. |
