---
title: "Liskov Substitution Principle (LSP): Invariants, Contracts & Substitutability"
category: "LLD"
sub_category: "SOLID - LSP"
type: "concept"
tags:
  - "lld"
  - "solid"
  - "lsp"
  - "liskov-substitution"
  - "preconditions"
  - "postconditions"
  - "behavioral-subtyping"
updated: "2026-09-21"
---

# 01 — Liskov Substitution Principle (LSP): Layman Analogies, Detection Smell Tests & Production Architecture

> **Track:** Core Backend Foundations & Runtime Systems  
> **Target Level:** SDE-2 $\rightarrow$ Senior Engineer / Tech Lead  
> **Location:** `01-FOUNDATIONS-AND-DATABASE/oops/lsp/`  
> **Focus:** First-Principles Behavioral Subtyping, Real-World Smells, Invariant Protection, and Eliminating `instanceof` Downcasting

---

## 1. Executive Summary: The Plain English Definition

The textbook definition of LSP sounds academic:
> *"If $S$ is a subtype of $T$, then objects of type $T$ may be replaced with objects of type $S$ without altering any of the desirable properties of the program."*

### 🔌 The Real-World Layman Analogy: The Standard Electric Wall Socket
* When a wall socket is installed in a house, it defines a **Contract**: *"Provide 220V AC power to any standard 2-pin plug."*
* You can plug in a **Lamp**, a **Laptop Charger**, or a **Toaster**. They are all valid "subtypes" of electric appliances.
* **The LSP Violation:** Imagine you buy a new blender. When you plug it into the wall socket, **it explodes and trips the entire building's master circuit breaker** because it secretly demanded *DC power with water cooling*.
* **The Software Lesson:** If replacing a parent class with a child class causes the caller to break, crash, or behave unexpectedly, **your abstraction is a lie.**

```
                                  [ THE CALLER CONTRACT ]
                                             │
                        ┌────────────────────┴────────────────────┐
                        ▼                                         ▼
            ✅ HONORS LSP (Subtype A)                   ❌ VIOLATES LSP (Subtype B)
            Laptop Charger plugged into socket.        Blender that trips the master breaker.
            Works transparently without surprise.      Throws UnexpectedException / Corrupts state.
```

> **The Golden Rule:**  
> *"A Subclass must satisfy the **behavioral expectations** of the caller, not just the compiler's type-checker."*

---

## 2. Where Should You Consider LSP in System Design?

Apply LSP whenever you design:
1. **Repository & Storage Layers:** (e.g. `PostgresUserRepository` vs `InMemoryUserRepository` for tests vs `RedisCachedUserRepository`). Callers must not care which one is active.
2. **Payment & Notification Gateways:** (e.g. `StripeGateway` vs `RazorpayGateway`).
3. **Caching & Queue Adapters:** (e.g. `RabbitMQMessageBus` vs `KafkaMessageBus`).
4. **Third-Party Integrations:** Multi-tenant partner integrations where each tenant connects to a different backend provider.

---

## 3. How to Detect LSP Violations (The 4 Code Smells)

When doing code reviews or debugging production outages, look for these **4 Major Warning Signals**:

```
                                   [ LSP SMELL DETECTION ]
                                              │
          ┌──────────────────┬────────────────┴─────────────────┬──────────────────┐
          ▼                  ▼                                  ▼                  ▼
   1. instanceof / Downcast  2. UnsupportedOperationException  3. Empty / No-Op   4. Returning null
   (Caller checks exact type) (Child refuses parent method)     (Silent failure)   (Parent promised data)
```

---

### 🚨 Smell 1: `instanceof` Checks and Explicit Downcasting in Callers
If a caller holds a reference to a base interface/class, but must check `if (repo instanceof PostgresRepo)` before calling a method, **LSP is completely broken**.

```java
// ❌ CRITICAL CODE SMELL: Caller does not trust the abstraction!
public void exportUserData(UserRepository repo, String userId) {
    if (repo instanceof PostgresUserRepository postgresRepo) {
        postgresRepo.flushTransaction(); // Why does only Postgres need this?
    }
    User user = repo.findById(userId);
}
```
**The Senior Fix:** If `flushTransaction()` is required for persistence, encapsulate it inside `repo.findById()` or design a clean lifecycle contract.

---

### 🚨 Smell 2: Throwing `UnsupportedOperationException`
If a child class overrides a parent method only to throw an exception saying *"I don't support this"*, the class hierarchy is defective.

```java
public interface ReadOnlyRepository<T> {
    T findById(String id);
}

public interface ReadWriteRepository<T> extends ReadOnlyRepository<T> {
    void save(T entity);
    void delete(String id);
}

// ❌ DISASTROUS DESIGN:
public class AuditLogRepository implements ReadWriteRepository<AuditLog> {
    @Override public AuditLog findById(String id) { return db.find(id); }
    @Override public void save(AuditLog log) { db.insert(log); }

    // 💥 VIOLATES LSP: Audit logs can NEVER be deleted!
    @Override
    public void delete(String id) {
        throw new UnsupportedOperationException("Audit logs are append-only!");
    }
}
```
**The Senior Fix:** Segregate the interfaces (ISP). `AuditLogRepository` should only implement `ReadOnlyRepository` and an `AppendableRepository`, not `DeletableRepository`.

---

### 🚨 Smell 3: Empty / No-Op Method Overrides (The Silent Bug)
A subclass overrides a parent method with `{ /* do nothing */ }` because the parent method does not apply to it.

```java
public class Bird {
    public void fly() { /* Flap wings, gain altitude */ }
}

public class Ostrich extends Bird {
    // ❌ VIOLATION: An Ostrich cannot fly, so developer leaves method empty
    @Override
    public void fly() {
        // Do nothing...
    }
}
```
**Why this breaks production:**
```java
// In FlightSimulatorService:
public void migrateFlock(List<Bird> flock) {
    for (Bird b : flock) {
        b.fly(); // Caller expects all birds to move across the map!
        assert b.getAltitude() > 1000; // 💥 Ostrich fails assertion or walks off a cliff!
    }
}
```

---

### 🚨 Smell 4: Returning `null` or Bogus Status When Parent Guaranteed Data
If `PaymentGateway.charge()` promises a valid `PaymentReceipt` or throws a typed `PaymentFailedException`, a child implementation cannot return `null` or a dummy placeholder receipt.

---

## 4. The 3 Formal Rules Made Crystal Clear

---

### 1. Preconditions Cannot Be Strengthened (The Airport Luggage Gate)

* **Analogy:** An airline ticket says: *"Carry-on bag limit: 10 kg"*. When you arrive at Gate A, the attendant says: *"At this specific gate, bags must be under 3 kg or you cannot board."* (Precondition strengthened $\rightarrow$ Angry passengers $\rightarrow$ Production outage).
* **Code Meaning:** A subclass cannot require stricter inputs, shorter strings, or narrower ranges than the parent allowed.

```java
// PARENT CONTRACT: Accepts any non-null username up to 50 chars
public class AccountService {
    public void register(String username) {
        if (username == null || username.length() > 50) throw new IllegalArgumentException();
        // ...
    }
}

// ❌ SUBCLASS VIOLATION: Requires strictly alphanumeric without underscores
public class CorporateAccountService extends AccountService {
    @Override
    public void register(String username) {
        super.register(username);
        if (username.contains("_")) { // 💥 Strengthened precondition!
            throw new IllegalArgumentException("Corporate accounts forbid underscores!");
        }
    }
}
```

---

### 2. Postconditions Cannot Be Weakened (The Amazon Prime Guarantee)

* **Analogy:** Amazon Prime promises: *"Guaranteed 1-day delivery"*. A third-party delivery partner says: *"We will deliver sometime this month, or maybe not at all"*. (Postcondition weakened $\rightarrow$ Contract broken).
* **Code Meaning:** A subclass must deliver equal or stronger guarantees (e.g. narrower return types, fewer or more specific exceptions).

```java
// PARENT: Guarantees a validated, connected DatabaseConnection
public class ConnectionPool {
    public DatabaseConnection getConnection() {
        DatabaseConnection conn = allocate();
        conn.ping(); // Verified alive
        return conn; // Guaranteed OPEN
    }
}

// ❌ SUBCLASS: Returns connection without verifying state (Lazy connection)
public class FastConnectionPool extends ConnectionPool {
    @Override
    public DatabaseConnection getConnection() {
        return allocate(); // 💥 Weakened postcondition: connection might be dead!
    }
}
```

---

### 3. The History Constraint (Immutability Violation)

* **Analogy:** You buy a government Savings Bond with a fixed maturity date. If a secondary market issuer introduces a button to change the bond's maturity date retroactively, the security guarantees collapse.
* **Code Meaning:** If a parent class is immutable, no subclass is allowed to introduce mutator methods.

```java
// PARENT: Immutable Value Object
public class Money {
    private final BigDecimal amount;
    public Money(BigDecimal amount) { this.amount = amount; }
    public BigDecimal getAmount() { return amount; }
}

// ❌ SUBCLASS: Introduces a setter, corrupting HashMaps and concurrent caches!
public class MutableMoney extends Money {
    private BigDecimal modifiedAmount;
    public void setAmount(BigDecimal newAmount) { this.modifiedAmount = newAmount; }
}
```

---

## 5. Production Case Study: The Read-Only Collection Trap in Java

Look at how standard Java historically wrestled with LSP in the Collection Framework:

```java
List<String> list = Collections.unmodifiableList(new ArrayList<>());

// What does the List interface guarantee?
// List.add(E element) promises to insert an element.

list.add("Hello"); // 💥 Throws UnsupportedOperationException at runtime!
```

### Why this is an architectural trade-off:
In Java 1.2, rather than creating separate `ReadableList` and `WritableList` interfaces, designers placed `add()` on `List` and documented that implementations could throw `UnsupportedOperationException`.  
**Modern Tech Lead Standard:** In your modern domain design, prefer **Interface Segregation** (`ImmutableList` / `Sequence` vs `MutableList`) so that unsupported operations fail at **compile-time**, not at runtime.

---

## 6. SDE-2 $\rightarrow$ Senior LSP Review Checklist

When reviewing any Pull Request:

- [ ] **Are there any `instanceof` or downcasts in business logic?** If yes, refactor to polymorphic methods.
- [ ] **Does any overridden method throw `UnsupportedOperationException`?** If yes, split the interface into role-based contracts (ISP).
- [ ] **Are validation rules in child methods equal to or looser than the parent?** Never reject inputs that the parent would have accepted.
- [ ] **Does the child return valid data for all inputs supported by the parent?** Never return `null` where parent returned non-null.
- [ ] **Are immutable classes protected from mutable subclasses?** Mark immutable classes `final`.
