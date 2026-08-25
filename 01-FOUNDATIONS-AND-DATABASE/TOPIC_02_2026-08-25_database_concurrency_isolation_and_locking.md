# TOPIC 02: DATABASE CONCURRENCY, ISOLATION LEVELS & LOCKING MECHANISMS

**Date:** 2026-08-25  
**Track:** 01-FOUNDATIONS-AND-DATABASE  
**Prerequisites:** SQL Fundamentals, ACID Properties  
**Target Profile:** Senior Backend Engineer / Systems Architect  

---

## 🧭 Executive Summary & Mental Model

When a single user updates a database row, everything works as expected. But in production, hundreds or thousands of concurrent transactions ($Tx_1, Tx_2, \dots, Tx_N$) read and write to the same tables simultaneously.

Without concurrency control, databases suffer from **Race Conditions**, resulting in:
- Double-spending money from wallets.
- Overselling inventory in flash sales.
- Corrupted account balances.

To solve this, relational databases like PostgreSQL and MySQL use **Transaction Isolation Levels**, **MVCC (Multi-Version Concurrency Control)**, and **Locking Strategies** (Pessimistic vs. Optimistic).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               DATABASE CONCURRENCY PYRAMID                             │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Level 4: SERIALIZABLE        -> Zero anomalies (Strict serial order / SSI)            │
│  Level 3: REPEATABLE READ     -> Eliminates Non-Repeatable Reads & Phantom Reads (MVCC)│
│  Level 2: READ COMMITTED      -> Default in PostgreSQL. Eliminates Dirty Reads.        │
│  Level 1: READ UNCOMMITTED    -> Can see uncommitted dirty data.                       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ 1. The 4 Concurrency Anomalies (The Bugs)

An **anomaly** is an unexpected, incorrect result caused when concurrent transactions interleave their operations.

---

### Anomaly 1: Dirty Read
> **Definition:** A transaction reads uncommitted data written by another concurrent transaction that is later **rolled back**.

```text
Tx 1 (Transfer $500)                 Tx 2 (Audit / Check Balance)
──────────────────────────────────────────────────────────────────────────
BEGIN;
UPDATE accounts 
SET balance = balance - 500 
WHERE id = 1; -- balance is now $500 (uncommitted)
                                      BEGIN;
                                      SELECT balance FROM accounts WHERE id = 1;
                                      -- 💥 Tx 2 reads $500 (DIRTY READ!)
ROLLBACK; -- Tx 1 fails! Real balance remains $1000.
                                      COMMIT;
                                      -- Tx 2 made business decisions on fake data!
```
* **Why it's dangerous:** Tx 2 approved a loan or generated an invoice based on phantom changes that never actually happened.

---

### Anomaly 2: Non-Repeatable Read (Fuzzy Read)
> **Definition:** A transaction reads the same row twice, but gets **different values** because another transaction modified and committed changes in between.

```text
Tx 1 (Calculate Tax Discount)         Tx 2 (User updates salary)
──────────────────────────────────────────────────────────────────────────
BEGIN;
SELECT salary FROM emp WHERE id = 1;
-- 📖 Tx 1 reads: $100,000
                                      BEGIN;
                                      UPDATE emp SET salary = 120000 WHERE id = 1;
                                      COMMIT; -- Tx 2 committed!
SELECT salary FROM emp WHERE id = 1;
-- 💥 Tx 1 reads: $120,000 within the SAME transaction!
COMMIT;
```
* **Why it's dangerous:** Tx 1's business logic breaks because variables mutate mid-execution.

---

### Anomaly 3: Phantom Read
> **Definition:** A transaction runs a range query (`WHERE age > 30`) twice, but gets a **different set of rows** because another transaction inserted/deleted rows matching that condition.

```text
Tx 1 (Count Active VIP Users)        Tx 2 (New VIP Registration)
──────────────────────────────────────────────────────────────────────────
BEGIN;
SELECT COUNT(*) FROM users 
WHERE tier = 'VIP';
-- 📖 Reads: 10 VIPs
                                      BEGIN;
                                      INSERT INTO users (name, tier) VALUES ('Alice', 'VIP');
                                      COMMIT; -- Tx 2 committed!
SELECT COUNT(*) FROM users 
WHERE tier = 'VIP';
-- 💥 Reads: 11 VIPs! (A "Phantom" row appeared)
COMMIT;
```

---

### Anomaly 4: Serialization Anomaly / Write Skew
> **Definition:** Two concurrent transactions each read overlapping data, make a decision based on business constraints, and write to **different** rows. Both commit, but the combined result violates the business rule!

#### Real-World Example: "On-Call Doctor Constraint"
* **Rule:** At least *one* doctor must remain on call at all times.
* Currently on call: **Doctor A** and **Doctor B**.

```text
Tx 1 (Doctor A calls in sick)        Tx 2 (Doctor B calls in sick)
──────────────────────────────────────────────────────────────────────────
BEGIN;                               BEGIN;
SELECT COUNT(*) FROM doctors         SELECT COUNT(*) FROM doctors
WHERE on_call = true;                WHERE on_call = true;
-- Reads: 2 (Safe to go off call)    -- Reads: 2 (Safe to go off call)

UPDATE doctors                       UPDATE doctors
SET on_call = false                  SET on_call = false
WHERE name = 'A';                    WHERE name = 'B';

COMMIT;                              COMMIT;
──────────────────────────────────────────────────────────────────────────
💥 FINAL STATE: 0 doctors on call! Business constraint VIOLATED.
```
* Neither transaction modified the other's row, so standard row locks did not trigger. Only `SERIALIZABLE` isolation prevents this.

---

## 🛡️ 2. The 4 ANSI SQL Isolation Levels

Each isolation level trades off **Data Correctness** vs. **Concurrency / Performance**:

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read | Serialization Anomaly (Write Skew) | Default In |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Read Uncommitted** | ❌ Allowed | ❌ Allowed | ❌ Allowed | ❌ Allowed | *Rarely used* |
| **Read Committed** | ✅ **Prevented** | ❌ Allowed | ❌ Allowed | ❌ Allowed | **PostgreSQL, Oracle, SQL Server** |
| **Repeatable Read** | ✅ **Prevented** | ✅ **Prevented** | ✅ **Prevented** *(in Postgres MVCC)* | ❌ Allowed | **MySQL (InnoDB)** |
| **Serializable** | ✅ **Prevented** | ✅ **Prevented** | ✅ **Prevented** | ✅ **Prevented** | *Strict Financial Systems* |

---

## 🔄 3. MVCC: Multi-Version Concurrency Control

In traditional databases, readers blocked writers, and writers blocked readers.  
**PostgreSQL uses MVCC, whose golden rule is:**
> **"Readers never block Writers, and Writers never block Readers."**

### How Postgres Implements MVCC Internally:
Every row in PostgreSQL has hidden system columns:
1. `xmin`: The Transaction ID ($TxID$) that **created/inserted** the row.
2. `xmax`: The Transaction ID ($TxID$) that **deleted or updated** the row (set to `0` if active).

```text
When you run: UPDATE users SET name = 'Bob' WHERE id = 1;

PostgreSQL DOES NOT overwrite the row on disk!
Instead, it:
1. Marks the OLD row's `xmax = current_TxID` (Soft delete).
2. Inserts a BRAND NEW row version with `xmin = current_TxID` and `xmax = 0`.
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ DISK STORAGE (TABLE HEAP)                                               │
├─────────┬─────────┬────────┬──────────────┬──────────────┬──────────────┤
│ Row ID  │ xmin    │ xmax   │ id           │ name         │ Status       │
├─────────┼─────────┼────────┼──────────────┼──────────────┼──────────────┤
│ #101    │ 500     │ 505    │ 1            │ 'Alice'      │ Old Version  │
│ #102    │ 505     │ 0      │ 1            │ 'Bob'        │ New Version  │
└─────────┴─────────┴────────┴──────────────┴──────────────┴──────────────┘
```
* If Transaction 502 reads `users` at the same time, its **Snapshot** only sees Row `#101` because `#102` was created by Tx 505 (in the future relative to Tx 502).
* **VACUUM Cleaner:** PostgreSQL runs a background `VACUUM` process to clean up dead rows (like `#101`) when no active transactions need them anymore.

---

## 🔒 4. Concurrency Control: Pessimistic vs. Optimistic Locking

When multiple users try to modify the exact same record (e.g., deducting balance from Wallet ID = 1), MVCC alone isn't enough. We must choose a locking strategy.

---

### A. Pessimistic Locking (`SELECT FOR UPDATE`)
* **Philosophy:** *"Conflicts are frequent. Lock the row immediately so nobody else can touch it until I finish."*
* **How it works:** Acquires an exclusive row-level lock. Concurrent transactions attempting to read with lock or update that row are **blocked** and placed in a wait queue.

```sql
-- Transaction: Deduct $100 from user wallet
BEGIN;

-- 1. Lock the row exclusively
SELECT balance 
FROM wallets 
WHERE user_id = 42 
FOR UPDATE;

-- 2. Any other concurrent transaction waiting on user_id = 42 stops and waits here!

-- 3. Perform balance check & update in application code
UPDATE wallets 
SET balance = balance - 100 
WHERE user_id = 42;

COMMIT; -- Lock is released! Next waiting transaction resumes.
```

* **Best used for:**
  * High-contention financial transactions (bank transfers, wallet balances).
  * Flash-sale inventory where contention is extreme.
* **Trade-off:** High safety, but lower throughput if many threads queue on the same row. Risk of **Deadlocks** if locks are acquired in different orders.

---

### B. Optimistic Locking (Version Counter)
* **Philosophy:** *"Conflicts are rare. Let everyone read and write freely. Right before saving, check if someone changed the record behind my back. If yes, reject/retry."*
* **How it works:** Add a `version INT DEFAULT 1` column. When updating, increment the version and check that the version matches what you originally read.

```sql
-- Step 1: Read data + version (NO LOCKS HELD!)
SELECT id, balance, version FROM accounts WHERE id = 42;
-- Reads: balance = 500, version = 3

-- Step 2: Application computes new balance: 500 - 100 = 400

-- Step 3: Atomic conditional update
UPDATE accounts 
SET balance = 400, version = version + 1 
WHERE id = 42 AND version = 3;

-- Result check:
-- If Rows Affected == 1 -> Success!
-- If Rows Affected == 0 -> CONFLICT! Another request updated version to 4 in between.
--                          Application catches this and retries.
```

* **Best used for:**
  * Low to medium contention systems (User Profile updates, CMS articles, E-commerce cart edits).
  * Distributed systems spanning multiple microservices where DB locks cannot be held across network calls.
* **Trade-off:** High throughput and zero DB locks, but high retry rate under heavy write contention.

---

## ⚖️ Summary Comparison Table

| Feature | Pessimistic Locking (`FOR UPDATE`) | Optimistic Locking (`version` check) |
| :--- | :--- | :--- |
| **Lock Type** | Explicit Database Row Lock | Lock-Free (Atomic SQL check) |
| **Deadlock Risk** | Yes (if order of keys varies) | No deadlocks |
| **Contention Strategy** | Best for High Contention | Best for Low/Medium Contention |
| **Network Span** | Must stay within 1 DB transaction | Can span across HTTP requests / UI forms |
| **Throughput** | Lower (threads block in queue) | Higher (zero blocking, fast rejects) |
