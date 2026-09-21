---
title: "Inheritance vs Composition: The Fragile Base-Class Problem"
category: "LLD"
sub_category: "OOP - Inheritance"
type: "concept"
tags:
  - "lld"
  - "oops"
  - "inheritance"
  - "composition"
  - "fragile-base-class"
  - "coupling"
  - "java"
  - "typescript"
updated: "2026-09-21"
---

# 01 — Inheritance vs. Composition: The Fragile Base-Class Problem & Production Decision Matrix

> **Track:** Core Backend Foundations & Runtime Systems  
> **Target Level:** SDE-2 $\rightarrow$ Senior Engineer / Tech Lead  
> **Focus:** White-Box vs Black-Box Reuse, The Fragile Base-Class Problem, Decorator/Forwarding Architecture, and SDE-2 Decision Heuristics

---

## 1. The First-Principles Foundation: Welding vs. Plugging In

In traditional textbook OOP, inheritance is taught as the default mechanism for code reuse (*"A Dog is an Animal"*). In production-grade backend engineering, **Inheritance is the tightest form of coupling available in the language.**

```
INHERITANCE ("IS-A")                       COMPOSITION ("HAS-A")
[ White-Box Coupling ]                     [ Black-Box Independence ]

┌────────────────────────────┐             ┌──────────────┐      ┌──────────────┐
│        Base Class          │             │  Host Class  │──has─►  Component   │
│  (Internal implementation  │             │   (Holder)   │      │  (Interface) │
│   details leak to child)   │             └──────────────┘      └──────────────┘
└──────────────┬─────────────┘             • Clean interface boundary.
               │ extends (welded)          • Subcomponents swapped at runtime.
               ▼                           • Zero access to private plumbing.
┌────────────────────────────┐
│        Child Class         │
└────────────────────────────┘
```

### The Fundamental Architectural Distinction

| Dimension | **Inheritance (`extends`)** | **Composition (`has-a`)** |
| :--- | :--- | :--- |
| **Relationship** | **"IS-A"** (The child *is* a subtype of the parent). | **"HAS-A"** (The host *holds* a reference to a tool). |
| **Coupling Level** | **White-Box Reuse:** The child depends on the parent’s private execution paths and internal method interactions. | **Black-Box Reuse:** The host only depends on the public interface contract. Internals are 100% shielded. |
| **Binding Time** | **Static (Compile-Time):** Cannot change behavior dynamically once instantiated. | **Dynamic (Runtime):** Can swap strategies, engines, or delegates on the fly. |
| **Change Impact** | Modifying 1 line in the parent class can silently break 10 child classes across different repositories. | Changing internal implementation of a component has zero ripple effects on the host. |

---

## 2. Case Study 1: The Electric Car vs. Gasoline Engine Trap

### ❌ The Junior Inheritance Approach ("Is-A")
A junior developer reasons: *"A Tesla is a Car, so let's inherit from `GasolineCar` to reuse wheels, chassis, and steering!"*

```java
// BASE CLASS
public class GasolineCar {
    public void start() {
        injectFuel();
        igniteSparkPlugs(); // 💥 Internal combustion engine mechanics
        turnWheels();
    }

    protected void injectFuel() { /* ... */ }
    protected void igniteSparkPlugs() { /* ... */ }
    protected void turnWheels() { /* ... */ }
}

// CHILD CLASS
public class TeslaElectricCar extends GasolineCar {
    @Override
    public void start() {
        // PROBLEM: We inherited injectFuel() and igniteSparkPlugs()
        // What do we do with them? Throw UnsupportedOperationException?
        turnWheels();
    }
}
```

#### Why This Breaks:
1. **LSP (Liskov Substitution Principle) Violation:** A caller expecting a `GasolineCar` will call `injectFuel()` or check spark status on a `TeslaElectricCar`, causing runtime crashes.
2. **Permanent Architectural Baggage:** `Tesla` is forever welded to internal methods that have nothing to do with electric vehicles.

---

### ✅ The Senior Composition Approach ("Has-A")
Instead of welding the vehicle body to a specific engine, the `Car` **has an `Engine`** as a pluggable component.

```java
// 1. Contract
public interface Engine {
    void accelerate();
}

// 2. Independent Implementations
public class V8GasEngine implements Engine {
    @Override
    public void accelerate() {
        injectFuel();
        igniteSparkPlugs();
        System.out.println("V8 combustion generating torque.");
    }
    private void injectFuel() { /* ... */ }
    private void igniteSparkPlugs() { /* ... */ }
}

public class ElectricBatteryEngine implements Engine {
    @Override
    public void accelerate() {
        System.out.println("Inverter drawing DC power to drive electric motor.");
    }
}

// 3. Host Class (Pure Composition)
public class Car {
    private final Engine engine; // <── HAS-A (Composition)

    public Car(Engine engine) {
        this.engine = Objects.requireNonNull(engine, "Engine cannot be null");
    }

    public void drive() {
        engine.accelerate(); // Delegates execution cleanly
    }
}
```

```java
// USAGE:
Car gasSedan = new Car(new V8GasEngine());
Car teslaModelS = new Car(new ElectricBatteryEngine());
Car futureCar = new Car(new HydrogenFuelCellEngine()); // Zero modifications to Car!
```

---

## 3. Case Study 2: The Fragile Base-Class Problem (`CountingSet`)

The **Fragile Base-Class Problem** is an industry-standard failure mode:  
> *A non-breaking, optimized internal change made to a parent class silently corrupts subclasses in production without any compiler error.*

### The Trap Code Walkthrough

```java
// BASE CLASS (In a 3rd-party library / framework core)
public class CustomHashSet<E> {
    public boolean add(E element) {
        // Base insertion logic
        return true;
    }

    public boolean addAll(Collection<? extends E> c) {
        for (E e : c) {
            add(e); // Calls internal add() method
        }
        return true;
    }
}
```

```java
// SUBCLASS (Written by Developer A to count total elements added)
public class CountingHashSet<E> extends CustomHashSet<E> {
    private int addCount = 0;

    @Override
    public boolean add(E element) {
        addCount++;
        return super.add(element);
    }

    @Override
    public boolean addAll(Collection<? extends E> c) {
        addCount += c.size();
        return super.addAll(c);
    }

    public int getAddCount() {
        return addCount;
    }
}
```

---

### 🚨 Production Anomaly 1: The Double-Counting Bug

```java
CountingHashSet<String> set = new CountingHashSet<>();
set.addAll(List.of("Apple", "Banana", "Cherry")); // 3 items
System.out.println(set.getAddCount()); // Prints 6! Why?
```

```
Runtime Execution Trace:
1. set.addAll(3 items) runs:
   └── addCount += 3                   ──► [addCount is 3]
   └── super.addAll(c) is invoked

2. CustomHashSet.addAll() runs its loop:
   └── for each item: calls this.add(e)
       └── Dynamic Dispatch redirects this.add() to CountingHashSet.add()!

3. CountingHashSet.add() runs 3 times:
   └── Item 1: addCount++              ──► [addCount is 4]
   └── Item 2: addCount++              ──► [addCount is 5]
   └── Item 3: addCount++              ──► [addCount is 6]
```

---

### 🚨 Production Anomaly 2: The Version 2.0 Silent Regression

Developer A notices the bug and removes `addCount += c.size()` from `CountingHashSet.addAll()`. It works!

Six months later, the library maintainer releases **Version 2.0 of `CustomHashSet`**:
- To optimize performance, the maintainer rewrites `addAll()` to insert directly into internal hash buckets without calling `add()`.

**The Result:**
- `CustomHashSet.addAll()` no longer calls `add()`.
- Because Developer A removed `addCount += c.size()`, `set.getAddCount()` now returns **`0`** in production!
- **Zero compiler warnings. Zero runtime exceptions. Total business data corruption.**

---

### ✅ The Production Solution: Composition & Forwarding (Decorator Pattern)

Instead of *extending* `CustomHashSet`, wrap an instance of the `Set<E>` interface.

```
┌─────────────────────────────────────────────────────────────┐
│                 CountingSet (Decorator)                     │
│  - Set<E> delegate;    (Composition: Has-A)                 │
│  - int addCount;                                            │
│                                                             │
│  public boolean add(E e) {                                  │
│      addCount++;                                            │
│      return delegate.add(e); // Forward call                │
│  }                                                          │
│                                                             │
│  public boolean addAll(Collection c) {                      │
│      addCount += c.size();                                  │
│      return delegate.addAll(c); // Forward call             │
│  }                                                          │
└──────────────────────────────┬──────────────────────────────┘
                               │ delegates via interface
                               ▼
                    ┌─────────────────────┐
                    │    Any Set<E>       │
                    │ (HashSet, TreeSet)  │
                    └─────────────────────┘
```

#### Production Implementation:
```java
public class CountingSet<E> implements Set<E> {
    private final Set<E> delegate; // Composition target
    private int addCount = 0;

    public CountingSet(Set<E> delegate) {
        this.delegate = Objects.requireNonNull(delegate, "Delegate set cannot be null");
    }

    @Override
    public boolean add(E element) {
        addCount++;
        return delegate.add(element);
    }

    @Override
    public boolean addAll(Collection<? extends E> c) {
        addCount += c.size();
        return delegate.addAll(c);
    }

    public int getAddCount() {
        return addCount;
    }

    // Standard Forwarding Methods (Zero reliance on internal mechanics)
    @Override public int size() { return delegate.size(); }
    @Override public boolean isEmpty() { return delegate.isEmpty(); }
    @Override public boolean contains(Object o) { return delegate.contains(o); }
    @Override public Iterator<E> iterator() { return delegate.iterator(); }
    @Override public Object[] toArray() { return delegate.toArray(); }
    @Override public <T> T[] toArray(T[] a) { return delegate.toArray(a); }
    @Override public boolean remove(Object o) { return delegate.remove(o); }
    @Override public boolean containsAll(Collection<?> c) { return delegate.containsAll(c); }
    @Override public boolean retainAll(Collection<?> c) { return delegate.retainAll(c); }
    @Override public boolean removeAll(Collection<?> c) { return delegate.removeAll(c); }
    @Override public void clear() { delegate.clear(); }
    @Override public boolean equals(Object o) { return delegate.equals(o); }
    @Override public int hashCode() { return delegate.hashCode(); }
}
```

### Why Composition is 100% Resilient:
1. **Zero Internal Dependency:** It does not matter whether `delegate.addAll()` calls `delegate.add()` or not.
2. **Polymorphic Adaptability:** Can wrap `HashSet`, `TreeSet`, `ConcurrentSkipListSet`, or any custom set.
3. **No Hidden State Invariants:** The parent library can rewrite its entire internal algorithm without breaking `CountingSet`.

---

## 4. The SDE-2 $\rightarrow$ Senior Decision Heuristic

```
                                  [ NEED CODE REUSE OR EXTENSION ]
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        ▼                                                 ▼
             Different Packages / Repos /                     Same Package & Same Team
             3rd-Party Frameworks                             (Unified Lifecycle Control)
                        │                                                 │
                        ▼                                                 ▼
            STRICTLY USE COMPOSITION                         Does B pass strict LSP test?
                                                             (Can B replace A anywhere with
                                                              ZERO surprise/violation?)
                                                                          │
                                                             ┌────────────┴────────────┐
                                                             ▼                         ▼
                                                            NO                        YES
                                                             │                         │
                                                        COMPOSITION               INHERITANCE
                                                                            (e.g., Template Method)
```

---

## 5. The Two Golden Rules of Inheritance

> ### 🔒 Rule 1 (The Strict Inheritance Boundary)
> **Use Inheritance ONLY when you are 100% sure Class B is truly a strict, permanent subtype of Class A and you control both classes.**
> * Both classes live in the exact same package/module under the same team's ownership.
> * The base class was **explicitly designed and documented for extension** (e.g., Template Method pattern with `final` orchestrator methods and `protected abstract` step hooks).

> ### ⚡ Rule 2 (The Composition Default)
> **Use Composition whenever you want flexibility, easy testing, and the ability to swap behaviors at runtime without bugs.**
> * Adding capabilities (Logging, Rate Limiting, Metrics, Retries, Caching).
> * Decoupling business logic from external drivers, storage, or algorithms.
> * Testing without complex class hierarchies—simply mock or fake the injected interface.
