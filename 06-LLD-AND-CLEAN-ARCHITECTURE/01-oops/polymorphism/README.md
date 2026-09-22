# Polymorphism, Strategy & Clean LLD Architecture

> **Track:** LLD & Clean Architecture  
> **Target Level:** SDE-2 $\rightarrow$ Senior Engineer / Tech Lead  

This module covers the elimination of procedural conditional trees, dynamic polymorphic routing, Interface Segregation Principle (ISP), and production-grade payment architecture.

---

## 🧭 Topic Breakdown

1. [01_polymorphism_over_conditionals_interface_segregation.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/polymorphism/01_polymorphism_over_conditionals_interface_segregation.md)
   - The Growing `switch` / `if-else` Nightmare (Shotgun Surgery, OCP violation).
   - Eliminating Untyped `Map<String, Object>` via Sealed Interfaces & Typed Records.
   - Interface Segregation Principle (ISP) vs Fat God Interfaces.
   - Strategy + Registry Pattern for $O(1)$ Strategy Resolution.

2. [02_production_drill_multi_carrier_logistics_polymorphic_registry.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/polymorphism/02_production_drill_multi_carrier_logistics_polymorphic_registry.md)
   - Real-World Logistics Drill: Eliminating Scattered `switch(carrier)` statements.
   - Complete Strategy + Self-Registering Dynamic Registry Implementation (FedEx, DHL, Delhivery).
   - 100% OCP Extensibility Proof: Adding new carriers with 1 file and 0 edits to existing services.

---

## 🔗 Related Full System LLDs

* 🚀 [03_production_payment_engine_lld_modular_multichannel_design.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills/03_production_payment_engine_lld_modular_multichannel_design.md) — Production-Grade Multi-Channel Payment Orchestrator LLD in `05-system-drills/`.
