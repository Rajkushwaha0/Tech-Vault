# Inheritance vs Composition Foundations

> **Track:** LLD & Clean Architecture  
> **Target Level:** SDE-2 $\rightarrow$ Senior Engineer / Tech Lead  

This module covers the architecture and mechanics of object reuse, coupling boundaries, dynamic dispatch, and the trade-offs between class inheritance and interface composition.

---

## 🧭 Topic Breakdown

1. [01_inheritance_vs_composition_fragile_base_class.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/inheritance/01_inheritance_vs_composition_fragile_base_class.md)
   - Welding vs Plugging In (`extends` vs `has-a`).
   - Case Study 1: The Electric Car vs Gasoline Car Problem.
   - Case Study 2: The Fragile Base-Class Problem (`CountingSet` double counting and v2.0 regression).
   - The Decorator/Forwarding Pattern with Composition.
   - The Two Golden Rules of Inheritance for Senior Engineers.

2. [02_production_drill_http_client_combinatorial_explosion_decorator_pipeline.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/01-oops/inheritance/02_production_drill_http_client_combinatorial_explosion_decorator_pipeline.md)
   - Real-World Fintech Drill: Combinatorial Class Explosion ($2^N$) & Fragile Base-Class Stack Overflow.
   - Complete Decorator Pipeline Implementation (Auth, Retry, Rate Limiting, Logging, Network Socket).
   - Fluent `HttpClientBuilder` for dynamic runtime assembly.
