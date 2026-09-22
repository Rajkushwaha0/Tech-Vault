# 01 — Object-Oriented Programming (OOP) From First Principles

> **Track:** LLD & Clean Architecture  
> **Target Level:** SDE-1 $\rightarrow$ SDE-2 $\rightarrow$ Senior Engineer / Tech Lead  

This module covers the core mental models of OOP: moving away from procedural code disguised as classes into true state invariant protection, behavioral encapsulation, composition, and dynamic polymorphism.

---

## 🧭 Sub-Modules

### 📁 Core Fundamentals & Interview Mastery
* [00_oop_core_fundamentals_interview_layman_guide.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/00_oop_core_fundamentals_interview_layman_guide.md) — Class, Object, Constructor, Instantiation, Public/Private/Protected, and The 4 Pillars with Layman Analogies and Interview Scripts.

### 📁 [encapsulation/](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/encapsulation)
* [01_advanced_encapsulation_state_invariants_tell_dont_ask.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/encapsulation/01_advanced_encapsulation_state_invariants_tell_dont_ask.md) — State Invariants, Tell Don't Ask, Value Objects vs Entities.
* [02_encapsulation_deep_dive_code_smells_and_interview_analogy.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/encapsulation/02_encapsulation_deep_dive_code_smells_and_interview_analogy.md) — Code Smells, Getters/Setters anti-patterns, Bank Vault vs ATM analogy.
* [03_senior_production_nuances_defensive_copying_orm_ddd_domain_events.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/encapsulation/03_senior_production_nuances_defensive_copying_orm_ddd_domain_events.md) — Leaky references, Defensive Copying, ORM impedance mismatch, and Domain Events.
* [04_production_drill_wallet_subscription_auto_renew_encapsulation.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/encapsulation/04_production_drill_wallet_subscription_auto_renew_encapsulation.md) — Real-world Wallet & Subscription auto-renew drill.

### 📁 [abstraction/](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/abstraction)
* [01_abstraction_domain_contracts_and_boundary_isolation.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/abstraction/01_abstraction_domain_contracts_and_boundary_isolation.md) — Ports & Adapters, Hexagonal Architecture, Leaky Abstraction elimination, Multi-Cloud S3 vs Local POSIX Storage.
* [02_interface_vs_abstract_class_vs_base_class_is_a_has_a.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/abstraction/02_interface_vs_abstract_class_vs_base_class_is_a_has_a.md) — Interface vs Abstract Class vs Base Class & IS-A vs HAS-A decision trees.

### 📁 [inheritance/](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/inheritance)
* [01_inheritance_vs_composition_fragile_base_class.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/inheritance/01_inheritance_vs_composition_fragile_base_class.md) — The Fragile Base-Class Problem, tight coupling, and Decorator/Composition patterns.
* [02_production_drill_http_client_combinatorial_explosion_decorator_pipeline.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/inheritance/02_production_drill_http_client_combinatorial_explosion_decorator_pipeline.md) — Production Drill: Combinatorial Class Explosion ($2^N$), Fragile Base-Class Stack Overflow, and the Decorator Pipeline Pattern.

### 📁 [polymorphism/](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/polymorphism)
* [01_polymorphism_over_conditionals_interface_segregation.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/polymorphism/01_polymorphism_over_conditionals_interface_segregation.md) — Eliminating `switch`/`if-else` branching via Polymorphic Strategy + Registry dispatch.
* [02_production_drill_multi_carrier_logistics_polymorphic_registry.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/polymorphism/02_production_drill_multi_carrier_logistics_polymorphic_registry.md) — Production Drill: Multi-Carrier Logistics Engine, Strategy Pattern, and Self-Registering Dynamic Registry.
