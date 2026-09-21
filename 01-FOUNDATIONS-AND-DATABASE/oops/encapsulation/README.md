# Encapsulation & State Invariants Mastery

> **Track:** Core Backend Foundations & Runtime Systems  
> **Target Level:** SDE-2 $\rightarrow$ Senior Engineer / Tech Lead  

This module provides a complete first-principles curriculum on Encapsulation, State Invariants, Value Objects, Domain Integrity, and Production Edge Cases.

---

## 🧭 Topic Breakdown

1. [01_advanced_encapsulation_state_invariants_tell_dont_ask.md](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/oops/encapsulation/01_advanced_encapsulation_state_invariants_tell_dont_ask.md)
   - The Great Industry Misconception (Anemic Domain Models).
   - "Tell, Don't Ask" Principle.
   - Value Objects vs Entities.
   - BankAccount Production Case Study (Junior vs Senior Implementation).

2. [02_encapsulation_deep_dive_code_smells_and_interview_analogy.md](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/oops/encapsulation/02_encapsulation_deep_dive_code_smells_and_interview_analogy.md)
   - Code Smells: Feature Envy, Repeated `if`s, Temporal Coupling, Primitive Obsession.
   - Production Use-Cases: State Machine Transitions, Thread-Safe Concurrency Boundaries.
   - The Out-of-the-Box Interview Analogy: Bank Vault vs ATM.

3. [03_senior_production_nuances_defensive_copying_orm_ddd_domain_events.md](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/oops/encapsulation/03_senior_production_nuances_defensive_copying_orm_ddd_domain_events.md)
   - Leaky References & Defensive Copying (`Collections.unmodifiableList`, copy constructors).
   - The ORM & Serialization Impedance Mismatch (Hibernate reflection, protected constructors, boundary DTOs).
   - Aggregate Boundaries (DDD consistency boundaries, Aggregate Root controlling child entities).
   - Safe Publication & JMM Memory Fences (`final` freeze semantics).
   - Pure Domain Models with Domain Events vs Infrastructure Injection.
