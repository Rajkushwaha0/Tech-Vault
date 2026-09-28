# Low-Level Design (LLD) & Clean Architecture

> **Track:** Production System Design & Senior Engineering  
> **Target Level:** SDE-1 $\rightarrow$ SDE-2 $\rightarrow$ Senior Engineer / Tech Lead  

This module contains complete first-principles breakdowns of Object-Oriented Programming (OOP), SOLID principles, design patterns, clean domain modeling, and production-grade LLD systems.

---

## 🧭 Module Structure

### 📁 [01-oops/](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops) — First Principles of OOP
* **[encapsulation/](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/encapsulation)**: State Invariants, Tell Don't Ask, Value Objects, Eliminating Anemic Models, Defensive Copying.
* **[inheritance/](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/inheritance)**: IS-A vs HAS-A, Fragile Base-Class Problem, Composition over Inheritance.
* **[polymorphism/](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/polymorphism)**: Polymorphism over Conditionals, Dynamic Dispatch, Interface Segregation.
* **abstraction/**: Stable Contracts, Boundary Isolation, Domain vs Infrastructure Abstractions.

### 📁 [02-solid/](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/02-solid) — SOLID Design Principles
* **[lsp/](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/02-solid/lsp)**: Liskov Substitution Principle, Behavioral Subtyping, Invariants, Preconditions & Postconditions.
* **srp/**: Single Responsibility, Class/Module boundaries, God Class splitting.
* **ocp/**: Open/Closed Principle, Plugin Architecture, Strategy/Factory extensibility.
* **isp/**: Interface Segregation, Role-based interfaces.
* **dip/**: Dependency Inversion, Hexagonal Ports & Adapters, IoC.

### 📁 03-design-patterns/ — Problem-Solving Design Patterns
* Creational (Factory, Abstract Factory, Builder, Prototype).
* Structural (Adapter, Decorator, Facade, Proxy, Composite).
* Behavioral (Strategy, Observer, Command, State, Chain of Responsibility).

### 📁 [04-domain-modeling-and-clean-arch/](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/04-domain-modeling-and-clean-arch) — Domain Modeling, DB Design & Golden Rules
* **[01_object_relationships_association_aggregation_composition.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/04-domain-modeling-and-clean-arch/01_object_relationships_association_aggregation_composition.md)**: Dependency, Association, Aggregation, Composition, & Lifecycle Ownership.
* **[02_lld_interview_framework_cardinality_and_db_schema_design.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/04-domain-modeling-and-clean-arch/02_lld_interview_framework_cardinality_and_db_schema_design.md)**: 4-Step LLD Framework, 2-Way Cardinality Formula, & BookMyShow Case Study.
* **[03_deep_dive_cardinality_detection_questions_to_ask_and_junction_tables.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/04-domain-modeling-and-clean-arch/03_deep_dive_cardinality_detection_questions_to_ask_and_junction_tables.md)**: 2-Way Directional Question Algorithm, 5 Interview Questions, & Junction Tables.
* **[04_association_vs_aggregation_deep_dive_the_whole_part_test.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/04-domain-modeling-and-clean-arch/04_association_vs_aggregation_deep_dive_the_whole_part_test.md)**: Association vs. Aggregation: The "Whole-Part Container" Test.
* **[05_production_db_design_normalization_3nf_indexing_concurrency.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/04-domain-modeling-and-clean-arch/05_production_db_design_normalization_3nf_indexing_concurrency.md)**: Database Normalization (1NF–3NF), Snapshot Denormalization, Indexing & Concurrency.
* **[06_golden_master_rulebook_cardinality_relationships_and_db_design.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/04-domain-modeling-and-clean-arch/06_golden_master_rulebook_cardinality_relationships_and_db_design.md)**: The 1-Page Unified Master Rulebook for Cardinality & Relationships.

### 📁 [05-system-drills/](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills) — Production LLD Systems & Drills
* [01_lld_interview_mastery_framework_and_mental_models.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills/01_lld_interview_mastery_framework_and_mental_models.md) — 45-Minute LLD Interview Mastery Framework.
* [02_concurrent_in_memory_task_scheduler.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills/02_concurrent_in_memory_task_scheduler.md) — Concurrent In-Memory Task Scheduler LLD.
* [03_production_payment_engine_lld_modular_multichannel_design.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills/03_production_payment_engine_lld_modular_multichannel_design.md) — Production Multi-Channel Payment Orchestrator LLD.
* [04_production_drill_food_delivery_order_aggregate_relationships.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills/04_production_drill_food_delivery_order_aggregate_relationships.md) — Food Delivery Order Aggregate Drill (Swiggy / DoorDash).
* [05_production_drill_telemedicine_prescription_aggregate_and_relationship_discovery.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills/05_production_drill_telemedicine_prescription_aggregate_and_relationship_discovery.md) — Telemedicine Consultations & E-Prescription Drill (Practo / Teladoc).
* [06_production_drill_splitwise_expense_settlement_ledger.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills/06_production_drill_splitwise_expense_settlement_ledger.md) — Splitwise Peer-to-Peer Expense Sharing & Debt Settlement Ledger.
