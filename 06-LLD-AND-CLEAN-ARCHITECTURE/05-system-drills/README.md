# 05 — Production LLD System Drills & Architecture Blueprints

> **Track:** LLD & Clean Architecture  
> **Target Level:** SDE-2 $\rightarrow$ Senior Engineer / Tech Lead  

This module contains end-to-end Low-Level Design (LLD) solutions, interview framework blueprints, concurrency engines, and modular multi-channel backend systems.

---

## 🧭 System Designs & Drills

1. [01_lld_interview_mastery_framework_and_mental_models.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills/01_lld_interview_mastery_framework_and_mental_models.md)
   - 45-Minute LLD Interview Execution Framework (Requirements $\rightarrow$ Core Entities $\rightarrow$ State Transitions $\rightarrow$ Design Patterns $\rightarrow$ Concurrency $\rightarrow$ Extensibility).

2. [02_concurrent_in_memory_task_scheduler.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills/02_concurrent_in_memory_task_scheduler.md)
   - Concurrent In-Memory Task Scheduler (Worker Thread Pool, DelayQueue, Periodic Execution, Graceful Shutdown, Reentrancy).

3. [03_production_payment_engine_lld_modular_multichannel_design.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills/03_production_payment_engine_lld_modular_multichannel_design.md)
   - Production Multi-Channel Payment Orchestrator (Stripe, Razorpay, PayPal, UPI, Coupons & Split Payments, Idempotency & Retries).

4. [04_production_drill_food_delivery_order_aggregate_relationships.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills/04_production_drill_food_delivery_order_aggregate_relationships.md)
   - Real-World Drill: Food Delivery Order Aggregate & Dispatch Engine (Swiggy / DoorDash).
   - Candidate Thought Analysis: The 4 Critical Mistakes (Redundant FKs, Inverted Cardinalities, Lifecycle Traps).
   - Complete DDD Aggregate Root (`Order`), Composition vs. Association boundaries, and Postgres DDL.

5. [05_production_drill_telemedicine_prescription_aggregate_and_relationship_discovery.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills/05_production_drill_telemedicine_prescription_aggregate_and_relationship_discovery.md)
   - Real-World Drill: Telemedicine Consultations & E-Prescription Engine (Practo / Teladoc).
   - The Relationship Discovery Framework: The Multiplicity Question + The Death Test.
   - Complete Legal Medical Document Aggregate (`Prescription`), Concurrency Guard, and Postgres DDL.

6. [06_production_drill_splitwise_expense_settlement_ledger.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills/06_production_drill_splitwise_expense_settlement_ledger.md)
   - Real-World Drill: Peer-to-Peer Expense Sharing & Debt Settlement Engine (Splitwise / Venmo).
   - Multi-Payer vs. Multi-Debtor Double-Entry Invariants, Aggregate Root Validation, and Greedy Debt Simplification Algorithm.
   - Complete Normalized 3NF Postgres DDL and TypeScript Domain Model.
