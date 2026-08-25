# TOPIC 03: HIGH-CONTENTION FLASH SALE & INVENTORY CONCURRENCY ARCHITECTURE

**Date:** 2026-08-25  
**Track:** 01-FOUNDATIONS-AND-DATABASE  
**Prerequisites:** Concurrency Anomalies, Isolation Levels, MVCC, Redis Basics  
**Target Profile:** Senior Backend Engineer / Systems Architect  

---

## 🧭 Executive Summary & The Problem

Handling high-concurrency write contention (e.g., **1,000 inventory units, 25,000 requests/second**) is one of the most critical system design and database challenges.

Under naive implementations:
1. **Overselling (Lost Update)** occurs when multiple transactions read stock before any transaction commits the decrement.
2. **Database Crash (Lock Contention)** occurs when thousands of database connections queue up waiting for a single row-level lock.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   THE FLASH SALE BOTTLENECK                                     │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 25,000 req/sec  ──►  [PostgreSQL Instance]  ──►  1 Single Row (item_id = 999)                  │
│                                                   💥 Row Lock Queue (25k waiters)               │
│                                                   💥 Connection Pool Exhaustion                 │
│                                                   💥 CPU spikes to 100%                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚨 1. Naive Implementation & Concurrency Breakdown

### The Naive Flow:
```sql
-- Step 1: Read stock
SELECT available_stock FROM inventory WHERE item_id = 999;

-- Step 2: Application logic
-- if (available_stock >= requested_qty) -> proceed

-- Step 3: Deduct stock
UPDATE inventory SET available_stock = available_stock - :requested_qty WHERE item_id = 999;
```

### Anomaly Breakdown:
* **The Root Cause:** **Time-of-Check to Time-of-Use (TOCTOU) Race Condition**.
* Under `READ COMMITTED` or `REPEATABLE READ`, 10,000 concurrent threads read `available_stock = 1000` simultaneously.
* Each thread calculates `1000 - 1 = 999` and issues an `UPDATE`.
* When the 1,001st transaction attempts to write, the PostgreSQL database triggers:
  ```text
  ERROR: new row for relation "inventory" violates check constraint "inventory_available_stock_check"
  DETAIL: Failing row contains (999, -1, 0, 1).
  ```
* **User Impact:** Cascading 500 errors, broken checkout sessions, and ruined user trust.

---

## ⚖️ 2. Pure Database Concurrency Strategies (Comparison)

### Strategy A: Pessimistic Locking (`SELECT ... FOR UPDATE`)
```sql
BEGIN;
SELECT available_stock 
FROM inventory 
WHERE item_id = 999 
FOR UPDATE; -- 🔒 Row exclusive lock acquired

UPDATE inventory 
SET available_stock = available_stock - 1 
WHERE item_id = 999;
COMMIT;
```
* **Pros:** 100% guarantee against overselling.
* **Cons under 25k req/sec:** Every request blocks sequentially. 24,999 connections wait in line $\rightarrow$ connection pool fills up in milliseconds $\rightarrow$ `504 Gateway Timeout` for all other unrelated API endpoints.

---

### Strategy B: Optimistic Concurrency Control (OCC with `version`)
```sql
UPDATE inventory 
SET available_stock = available_stock - 1,
    version = version + 1
WHERE item_id = 999 
  AND version = :read_version 
  AND available_stock >= 1;
```
* **Pros:** Non-blocking reads.
* **Cons under 25k req/sec:** 1 request wins the version update; 24,999 requests fail immediately. If retries are implemented, an exponential retry storm takes down the database.

---

### Strategy C: Atomic Conditional SQL (Best Pure SQL Approach)
```sql
UPDATE inventory 
SET available_stock = available_stock - 1 
WHERE item_id = 999 
  AND available_stock >= 1
RETURNING available_stock;
```
* **How it works:** Relies on PostgreSQL's internal row lock during `UPDATE` without needing an explicit `SELECT ... FOR UPDATE`.
* If rows affected = 0, item is out of stock.
* **Limit:** Capped by single-disk/row IOPS (max ~2,000–4,000 TPS on a single row).

---

### Strategy D: Stock Bucket Sharding (Pure SQL Scaling Pattern)
Instead of 1 row with 1,000 units, create 10 virtual bucket rows:
```sql
CREATE TABLE inventory_buckets (
    bucket_id INT PRIMARY KEY,
    item_id INT NOT NULL,
    stock INT NOT NULL CHECK (stock >= 0)
);
-- Buckets 1..10 each have 100 units.
```
* The backend generates a random bucket index `bucket_id = random(1, 10)` and decrements that specific bucket.
* **Benefit:** 10 independent row locks $\rightarrow$ 10x concurrency throughput in pure PostgreSQL!

---

## ⚡ 3. The Production Architecture (Redis + Lua + Async Queue)

For tier-1 scale (25k–100k+ req/sec), offloading state to an in-memory data store is required.

```
                  ┌────────────────────────────────────────────────────────┐
                  │              HIGH-CONTENTION FLASH SALE FLOW           │
                  └────────────────────────────────────────────────────────┘

     25,000 req/s
  ────────────────►  [ API Gateway / Load Balancer ]
                                │
                                ▼
                       [ Application Cluster ]
                                │
                                ▼
                   [ Redis Cluster (In-Memory) ]
                   • Atomic Lua Script (EVAL)
                   • Decr stock & Set TTL Reservation
                                │
                 ┌──────────────┴──────────────┐
                 ▼ (Success)                   ▼ (Out of stock)
        [ Push to Kafka Queue ]         [ Fast Fail: 400 Out of Stock ]
                 │
                 ▼
       [ Async Order Consumers ] (e.g. 500 writes/sec)
                 │
                 ▼
     [ PostgreSQL Master Database ]
     • Insert Orders
     • Finalize Inventory Ledger
```

---

### 🛡️ Step 1: Atomic Stock Reservation via Redis Lua Script

Redis processes commands on a single thread. A Lua script executes **atomically**:

```lua
-- KEYS[1] = "item:999:stock"
-- KEYS[2] = "item:999:reservations"
-- ARGV[1] = quantity (e.g. 1)
-- ARGV[2] = user_id (e.g. 501)
-- ARGV[3] = reservation_ttl_seconds (e.g. 600)

local current_stock = tonumber(redis.call('get', KEYS[1]))

if not current_stock or current_stock < tonumber(ARGV[1]) then
    return 0 -- OUT OF STOCK
end

-- 1. Atomically decrement stock
redis.call('decrby', KEYS[1], ARGV[1])

-- 2. Store temporary user reservation with TTL
local reservation_key = "reservation:" .. ARGV[2] .. ":" .. KEYS[1]
redis.call('set', reservation_key, ARGV[1], 'EX', ARGV[3])

return 1 -- RESERVATION SUCCESS
```

---

### ⏱️ Step 2: Handling TTL & Payment Expiration
1. **User completes payment in 3 minutes:**
   - Order finalized $\rightarrow$ Kafka event marks order `CONFIRMED`.
   - Redis reservation key deleted.
2. **User abandons cart / payment fails (TTL expires after 10 mins):**
   - Redis Keyspace Notification or Sweeper worker detects expired key.
   - Redis executes `INCRBY item:999:stock 1` (stock automatically returned to the pool).

---

## 📊 Summary Comparison Matrix

| Approach | Max Safe Throughput | Lock Type | Oversell Risk | Implementation Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **Naive App Check** | < 100 req/s | None | 🔴 **Extreme** | Very Low |
| **Postgres `SELECT FOR UPDATE`** | ~500 req/s | Row Exclusive | 🟢 Zero | Low |
| **Postgres Atomic Conditional SQL** | ~2,000 req/s | Row Write Lock | 🟢 Zero | Low |
| **Postgres Bucket Sharding** | ~15,000 req/s | Sharded Row Locks | 🟢 Zero | Medium |
| **Redis Lua + Async Kafka (Standard)**| **100,000+ req/s** | Lock-Free In-Memory | 🟢 Zero | High (Production Standard) |

---

## 💡 Key Architectural Takeaways for Tech Lead Interviews
1. **Never read-then-write without an atomic condition:** Always enforce atomic state transitions at the storage layer (`WHERE stock >= requested_qty` or Redis Lua).
2. **Do not use Distributed Locks for high-throughput counters:** Distributed locks turn parallel traffic into sequential traffic. Use atomic counters (`DECRBY`) or token buckets.
3. **Decouple Reservation from Persistence:** Reserve in sub-millisecond memory (Redis), persist asynchronously via guaranteed messaging (Kafka $\rightarrow$ DB).
