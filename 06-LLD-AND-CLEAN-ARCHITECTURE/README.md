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

### 📁 04-domain-modeling-and-clean-arch/ — Domain Modeling & DDD
* Rich Domain Models, Aggregate Roots, Domain Events, Bounded Contexts.

### 📁 [05-system-drills/](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills) — Production LLD Systems & Drills
* [01_lld_interview_mastery_framework_and_mental_models.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills/01_lld_interview_mastery_framework_and_mental_models.md) — 45-Minute LLD Interview Mastery Framework.
* [02_concurrent_in_memory_task_scheduler.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills/02_concurrent_in_memory_task_scheduler.md) — Concurrent In-Memory Task Scheduler LLD.
* [03_production_payment_engine_lld_modular_multichannel_design.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills/03_production_payment_engine_lld_modular_multichannel_design.md) — Production Multi-Channel Payment Orchestrator LLD.
