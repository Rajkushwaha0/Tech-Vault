# 01 — FOUNDATIONS AND DATABASE ARCHITECTURE

This track covers core database theory, concurrency control, transaction isolation levels, high-throughput locking mechanisms, and Node.js runtime/memory internals.

---

## 🧭 Sub-Modules & Topics

### 📁 [00-git-and-source-control/](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/00-git-and-source-control)
* [01_git_core_commands_internals_and_visual_mastery.md](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/00-git-and-source-control/01_git_core_commands_internals_and_visual_mastery.md) — Git DAG Internals, `git stash`, `fetch`/`pull`/`push --force-with-lease`, `reflog`, and Git Graph Visual Mastery.
* [02_isolate_commits_and_branch_surgery.md](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/00-git-and-source-control/02_isolate_commits_and_branch_surgery.md) — Branch Surgery: Isolating commits (A, B, C) from dirty development branches (`dev2`), `rebase --onto`, and safe WIP sharing.
* [03_production_cherry_pick_and_hotfix_lifecycles.md](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/00-git-and-source-control/03_production_cherry_pick_and_hotfix_lifecycles.md) — Production Cherry-Pick, Hotfix Lifecycles, Divergent Staging vs Main Branches, and 3-Way Conflict Resolution.
* [04_multi_dev_collaboration_and_conflict_elimination.md](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/00-git-and-source-control/04_multi_dev_collaboration_and_conflict_elimination.md) — Coordinating 2–4 Devs on the Same Feature, Contract-First Architecture, Shared Epics, and Stacked PRs.
* [05_fetch_rebase_vs_merge_production_lifecycle.md](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/00-git-and-source-control/05_fetch_rebase_vs_merge_production_lifecycle.md) — Why `fetch + rebase` Beats `pull`, Linear Histories, Interactive Rebase Squashing, and `reflog` Disaster Recovery.

### 📁 [01-sql-and-database-concurrency/](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/01-sql-and-database-concurrency)
* [01_sql_mongo_window_functions_and_concurrency.md](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/01-sql-and-database-concurrency/01_sql_mongo_window_functions_and_concurrency.md) — Advanced SQL (Window Functions, CTEs) vs MongoDB Aggregations (`$facet`, `$group`) + Lost Update Anomaly.
* [02_database_concurrency_isolation_and_locking.md](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/01-sql-and-database-concurrency/02_database_concurrency_isolation_and_locking.md) — Concurrency Anomalies (Dirty, Non-Repeatable, Phantom reads, Write Skew), Isolation Levels, MVCC, and Locking.
* [03_high_contention_flash_sale_inventory_concurrency.md](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/01-sql-and-database-concurrency/03_high_contention_flash_sale_inventory_concurrency.md) — High-Contention Flash Sale Inventory Concurrency (Redis Lua Reservations, Kafka Buffering, Postgres Sharding).
* [04_fintech_fraud_velocity_burst_sliding_windows_sql_mongo.md](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/01-sql-and-database-concurrency/04_fintech_fraud_velocity_burst_sliding_windows_sql_mongo.md) — FinTech Fraud Detection: Burst & Spike Velocity Anomaly, Sliding Windows (`ROWS BETWEEN ... PRECEDING`), and Covering Indexes.

### 📁 [02-nodejs-runtime-and-memory/](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/02-nodejs-runtime-and-memory)
* [01_nodejs_event_loop_streams_and_backpressure.md](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/02-nodejs-runtime-and-memory/01_nodejs_event_loop_streams_and_backpressure.md) — Node.js Runtime Internals, Stream Backpressure, Event Loop Starvation, and Microtask Queues.
* [02_concurrency_vs_parallelism_async_event_loop_starvation.md](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/02-nodejs-runtime-and-memory/02_concurrency_vs_parallelism_async_event_loop_starvation.md) — Concurrency vs Parallelism in Async Backend Runtimes: I/O Fan-Out, CPU-Bound Event Loop Starvation, and Worker Threads.

