# SQL, Databases & Concurrency Mastery

> **Track:** Foundations & Database Architecture  
> **Target Level:** SDE-2 $\rightarrow$ Senior Engineer / Tech Lead  

This module covers transaction isolation levels, concurrency anomalies, MVCC mechanics, optimistic/pessimistic locking, window functions, and high-contention flash sale architectures.

---

## 🧭 Topic Index

1. [01_sql_mongo_window_functions_and_concurrency.md](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/01-sql-and-database-concurrency/01_sql_mongo_window_functions_and_concurrency.md)
   - Advanced SQL (Window Functions, CTEs) vs MongoDB Aggregations (`$facet`, `$group`, `$slice`) + Lost Update Anomaly.

2. [02_database_concurrency_isolation_and_locking.md](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/01-sql-and-database-concurrency/02_database_concurrency_isolation_and_locking.md)
   - The 4 Concurrency Anomalies (Dirty, Non-Repeatable, Phantom, Write Skew), ANSI Isolation Levels, MVCC, and Pessimistic vs Optimistic Locking.

3. [03_high_contention_flash_sale_inventory_concurrency.md](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/01-sql-and-database-concurrency/03_high_contention_flash_sale_inventory_concurrency.md)
   - High-Contention Flash Sale Concurrency (25k req/sec), Redis Atomic Lua Reservations, TTL Expirations, Async Kafka Buffering, and Postgres Bucket Sharding.

4. [04_fintech_fraud_velocity_burst_sliding_windows_sql_mongo.md](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/01-sql-and-database-concurrency/04_fintech_fraud_velocity_burst_sliding_windows_sql_mongo.md)
   - FinTech Fraud Detection: "Burst & Spike" Velocity Anomaly, Sliding Window Partitioning, SQL (`ROWS BETWEEN ... PRECEDING`) vs MongoDB (`$setWindowFields`), Cold Starts, and Covering Indexes.
