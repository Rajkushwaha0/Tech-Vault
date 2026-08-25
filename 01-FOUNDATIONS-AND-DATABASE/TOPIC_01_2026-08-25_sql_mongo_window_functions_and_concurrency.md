# TOPIC 01: ADVANCED SQL & MONGO AGGREGATION + DATABASE CONCURRENCY (LOST UPDATE)

- **Topic ID**: `TOPIC-01-SQL-CONCURRENCY-ANOMALIES`
- **Date**: `2026-08-25`
- **Module**: `Phase 1 — Core Foundations & Database Concurrency`
- **Target Maturity**: `L2 → L4 (Production & Interview Ready)`

---

## 📌 PART A: Top-N-Per-Group in SQL vs MongoDB

### Problem Statement
Given an `orders` table / collection:
- Columns: `id`, `user_id`, `organization_id`, `amount`, `created_at`
- **Goal**: Find the **top 2 highest spending users for each organization** for orders placed in the year **2026**.

---

### 🧠 The Lead Developer's Mental Model (How to Think Before Coding)

When faced with this problem, a junior developer might think: *"I will just `SELECT * FROM orders WHERE ... ORDER BY amount DESC LIMIT 2`."*  
**Why that fails**: `LIMIT 2` gives you 2 orders across the **entire table**, not top 2 users *per organization*, and one user might have multiple smaller orders that sum up to a huge amount!

A Senior / Lead Developer breaks the problem into **3 discrete sub-problems**:

```text
Raw Orders Table (Millions of order rows)
      │
      ▼  [Step 1: Aggregation]
"What is the total spent by each individual user in each org in 2026?"
 ──► Group by (organization_id, user_id) and SUM(amount)
      │
      ▼  [Step 2: Partitioned Ranking]
"Within each organization bucket, how do users rank by their total spending?"
 ──► Rank users 1st, 2nd, 3rd... within their own org using a Window Function
      │
      ▼  [Step 3: Slicing / Filtering]
"How do we keep only ranks 1 and 2 for every organization?"
 ──► Filter WHERE rank <= 2
```

---

### 🔍 Let's Trace With Concrete Sample Data

Imagine our `orders` table has this data:

| id | org_id | user_id | amount | created_at |
| :---: | :---: | :---: | :---: | :---: |
| 1 | Org_A | User_1 | $100 | 2026-02-01 |
| 2 | Org_A | User_1 | $150 | 2026-03-01 |
| 3 | Org_A | User_2 | $400 | 2026-01-15 |
| 4 | Org_A | User_3 | $50 | 2026-05-10 |
| 5 | Org_B | User_4 | $600 | 2026-04-12 |
| 6 | Org_B | User_5 | $700 | 2026-07-20 |

---

### 🛠️ Step-by-Step Construction of the SQL Solution

#### Step 1: Filter 2026 and Calculate Total Spent per User
We only care about orders in 2026. Since a user can make multiple purchases (like `User_1` above: $100 + $150), we must group by `organization_id` and `user_id` together and `SUM(amount)`.

```sql
SELECT 
    organization_id,
    user_id,
    SUM(amount) AS total_spent
FROM orders
WHERE created_at >= '2026-01-01 00:00:00' 
  AND created_at <  '2027-01-01 00:00:00'
GROUP BY organization_id, user_id;
```

**Intermediate Result after Step 1:**

| organization_id | user_id | total_spent |
| :--- | :--- | :---: |
| Org_A | User_1 | **$250** |
| Org_A | User_2 | **$400** |
| Org_A | User_3 | **$50** |
| Org_B | User_4 | **$600** |
| Org_B | User_5 | **$700** |

---

#### Step 2: Rank Users Within Each Organization (Enter Window Functions)
Now, how do we rank `User_2` ($400) as #1 in `Org_A`, `User_1` ($250) as #2 in `Org_A`, but reset the counter so `User_5` ($700) is #1 in `Org_B`?

Standard `GROUP BY` collapses rows. But we need to keep each row and calculate a ranking across a specific "window" of rows. This is what SQL **Window Functions** (`OVER (...)`) are for:

```sql
DENSE_RANK() OVER (
    PARTITION BY organization_id 
    ORDER BY total_spent DESC
) AS spending_rank
```

**Breaking Down Every Keyword in Plain English:**
- **`DENSE_RANK()`**: The ranking function. If there is a tie ($500 and $500), both get Rank 2, and the next person gets Rank 3 (no gaps skipped).
- **`OVER (...)`**: Tells SQL: *"Apply this calculation over a specific window of rows without collapsing them."*
- **`PARTITION BY organization_id`**: Splits our data into separate calculation buckets per org (`Org_A` bucket, `Org_B` bucket). The ranking will start at 1 inside `Org_A`, and reset back to 1 when moving to `Org_B`.
- **`ORDER BY total_spent DESC`**: Within each org bucket, sort highest spending user first so the biggest spender gets Rank 1.

**Intermediate Result after Step 2:**

| organization_id | user_id | total_spent | spending_rank |
| :--- | :--- | :---: | :---: |
| Org_A | User_2 | $400 | **1** |
| Org_A | User_1 | $250 | **2** |
| Org_A | User_3 | $50 | **3** |
| Org_B | User_5 | $700 | **1** |
| Org_B | User_4 | $600 | **2** |

---

#### Step 3: Packaging with CTE (`WITH`) to Filter Top 2
Why can't we just write `WHERE spending_rank <= 2` in the same query?  
Because of the **SQL Order of Execution**: the `WHERE` clause runs **before** Window Functions are computed. At the time `WHERE` executes, `spending_rank` does not exist yet!

So we use a **Common Table Expression (CTE)** (`WITH ... AS (...)`) as temporary named intermediate result sets:

```sql
-- CTE 1: Compute total spending
WITH user_spending AS (
    SELECT 
        organization_id,
        user_id,
        SUM(amount) AS total_spent
    FROM orders
    WHERE created_at >= '2026-01-01 00:00:00' 
      AND created_at <  '2027-01-01 00:00:00'
    GROUP BY organization_id, user_id
),
-- CTE 2: Compute ranks per organization
ranked_users AS (
    SELECT 
        organization_id,
        user_id,
        total_spent,
        DENSE_RANK() OVER (
            PARTITION BY organization_id 
            ORDER BY total_spent DESC
        ) AS spending_rank
    FROM user_spending
)
-- Outer Query: Filter top 2 per org
SELECT 
    organization_id,
    user_id,
    total_spent,
    spending_rank
FROM ranked_users
WHERE spending_rank <= 2
ORDER BY organization_id, spending_rank ASC;
```

---

### 🍃 How to Build the MongoDB Aggregation Pipeline (Mental Model)

In MongoDB, there are no SQL window functions. Instead, MongoDB uses a **Unix-like data processing pipeline**: the output of Stage 1 feeds as input into Stage 2.

```text
Orders Collection
      │
      ▼  $match: Filter orders created in 2026
      │
      ▼  $group: Aggregate sum by (organization_id, user_id)
      │
      ▼  $sort: Sort by organization_id ASC, total_spent DESC
      │
      ▼  $group: Group by organization_id only, and $push sorted users into an array
      │
      ▼  $project with $slice: Slice only the first 2 items from each org's array!
```

```javascript
db.orders.aggregate([
  // Stage 1: Filter orders placed in 2026 (Indexed scan)
  {
    $match: {
      created_at: {
        $gte: new Date("2026-01-01T00:00:00.000Z"),
        $lt:  new Date("2027-01-01T00:00:00.000Z")
      }
    }
  },

  // Stage 2: Calculate total_spent per (org, user) combination
  {
    $group: {
      _id: {
        organization_id: "$organization_id",
        user_id: "$user_id"
      },
      total_spent: { $sum: "$amount" }
    }
  },

  // Stage 3: Sort highest spenders first within each organization
  {
    $sort: {
      "_id.organization_id": 1,
      "total_spent": -1
    }
  },

  // Stage 4: Group by org alone, accumulating sorted users into an array
  {
    $group: {
      _id: "$_id.organization_id",
      top_users: {
        $push: {
          user_id: "$_id.user_id",
          total_spent: "$total_spent"
        }
      }
    }
  },

  // Stage 5: Slice the top 2 elements from the array
  {
    $project: {
      _id: 0,
      organization_id: "$_id",
      top_spenders: { $slice: ["$top_users", 2] }
    }
  }
]);
```

---

### 💡 Core Engineering Takeaways
1. **Window Function Superpower**: Unlike `GROUP BY` which collapses rows, Window Functions (`OVER (PARTITION BY ... ORDER BY ...)`) let you perform group-level aggregations and rankings while **preserving individual row identities**.
2. **Execution Order Awareness**: Always remember `FROM` → `WHERE` → `GROUP BY` → `HAVING` → `WINDOW (OVER)` → `SELECT`. If you need to filter on a window calculation, wrap it in a CTE or subquery.
3. **MongoDB Pipeline Pattern**: Top-N in Mongo is solved by **`$sort` → `$group` with `$push` → `$project` with `$slice`**.

---

## 🧠 PART A Deep-Dive: Questions Explained

### Q2: Why can't we write `WHERE ranking <= 2` in the same query? (SQL Execution Order)

#### The Mental Model:
SQL is **declarative**, but the database engine processes clauses in a **strict, non-negotiable pipeline order**:

```text
┌─────────────────────────────────────────────────────────────┐
│                 SQL CLAUSE EXECUTION ORDER                  │
├─────────────────────────────────────────────────────────────┤
│ 1. FROM & JOIN     ──► Identifies tables & joins rows       │
│ 2. WHERE           ──► Filters individual rows              │
│ 3. GROUP BY        ──► Collapses rows into buckets/groups   │
│ 4. HAVING          ──► Filters grouped buckets              │
│ 5. WINDOW (OVER)   ──► Calculates window functions (Rank)   │
│ 6. SELECT          ──► Projects columns & aliases           │
│ 7. DISTINCT        ──► Eliminates duplicates                │
│ 8. ORDER BY        ──► Sorts the final result set           │
│ 9. LIMIT / OFFSET  ──► Slices the final output rows         │
└─────────────────────────────────────────────────────────────┘
```

#### The Reason:
- When the database executes the `WHERE` clause (Step 2), **window functions have NOT been computed yet** (they happen at Step 5).
- If you write `WHERE DENSE_RANK() OVER (...) <= 2`, the database throws:  
  `ERROR: window functions are not allowed in WHERE`.
- **Solution**: Compute the window function in a **CTE (`WITH`)** or **Subquery**, and filter on its alias in the outer query's `WHERE` clause.

---

### Q3: `ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()` (When Ties Occur)

Suppose two users (User B and User C) in Organization 1 both spent the exact same amount: **$500**.

| User | Total Spent | `ROW_NUMBER()` | `RANK()` | `DENSE_RANK()` |
| :--- | :---: | :---: | :---: | :---: |
| **User A** | $1000 | **1** | **1** | **1** |
| **User B** | $500 | **2** | **2** | **2** |
| **User C** | $500 | **3** (arbitrary tie-breaker) | **2** (tied) | **2** (tied) |
| **User D** | $200 | **4** | **4** (skips rank 3!) | **3** (no gaps!) |

#### Key Differences:
1. **`ROW_NUMBER()`**: Strictly assigns a unique sequential integer (1, 2, 3, 4...). If there is a tie, it arbitrarily picks one first unless secondary sort keys are specified.
2. **`RANK()`**: Assigns the same rank to ties, but **leaves gaps** in subsequent ranks (1, 2, 2, **4**).
3. **`DENSE_RANK()`**: Assigns the same rank to ties, but **leaves NO gaps** (1, 2, 2, **3**).

> **Tech Lead Recommendation**: For "Top N Leaderboards" where ties should fairly share a position without skipping ranks, always prefer **`DENSE_RANK()`**.

---

## 💥 PART B Deep-Dive: The "Lost Update" Concurrency Anomaly

### Scenario
- Initial wallet balance: **$100**
- Request 1: `Credit +$50`
- Request 2: `Debit -$30`
- **Expected Final Balance**: `$100 + $50 - $30 = $120`

---

### The Naive Application Code (Vulnerable)
```typescript
// Executed by both Request 1 and Request 2 in parallel:
const res = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [userId]);
const currentBalance = res.rows[0].balance;
const nextBalance = currentBalance + delta;
await db.query('UPDATE wallets SET balance = $1 WHERE user_id = $2', [nextBalance, userId]);
```

---

### The Step-by-Step Interleaved Disaster Timeline (Read Committed Isolation)

```text
Time   Request 1 (Credit +$50)                 Request 2 (Debit -$30)                DB Row State
─────────────────────────────────────────────────────────────────────────────────────────────────
T1     SELECT balance... -> returns $100                                             balance = 100
T2                                             SELECT balance... -> returns $100     balance = 100
T3     Node.js computes: 100 + 50 = $150
T4                                             Node.js computes: 100 - 30 = $70
T5     UPDATE wallets SET balance = 150...                                           balance = 150
T6                                             UPDATE wallets SET balance = 70...    balance = 70  ❌
─────────────────────────────────────────────────────────────────────────────────────────────────
Outcome: Request 1's $50 deposit is COMPLETELY LOST (overwritten). $50 has vanished.
```

---

### Why does PostgreSQL allow this in `Read Committed`?
In `Read Committed` mode:
1. Each `SELECT` statement takes a **snapshot** of the data committed at the instant the statement runs.
2. Neither `SELECT` acquires an exclusive lock on the row. Both see `balance = 100`.
3. When Request 2 runs its `UPDATE`, it overwrites the balance with its stale in-memory calculation (`$70`), creating a **Lost Update**.

---

## 🛠️ The 3 Production-Grade Fixes

### Fix 1: Atomic In-Place SQL Update (Simplest & Best Throughput)
```sql
UPDATE wallets 
SET balance = balance + $1 
WHERE user_id = $2 
  AND balance + $1 >= 0 -- Prevent negative balances
RETURNING balance;
```
- **How it works internally**: When PostgreSQL executes `SET balance = balance + $1`, the database engine acquires an **exclusive row-level write lock** on that tuple during the `UPDATE` operation and evaluates the arithmetic using the **freshest on-disk value**.
- **Pros**: Zero locks in application code, lowest latency, highest concurrency throughput.

---

### Fix 2: Pessimistic Locking (`SELECT FOR UPDATE`)
```sql
BEGIN;

-- Lock the row exclusively until the transaction finishes
SELECT balance 
FROM wallets 
WHERE user_id = $1 
FOR UPDATE;

-- Perform application validation or multi-table checks in Node.js
UPDATE wallets 
SET balance = $newBalance 
WHERE user_id = $1;

COMMIT;
```
- **How it works**: `SELECT FOR UPDATE` places an exclusive lock on the selected row. Request 2 is forced to **wait / block** until Request 1 commits.
- **When to use**: When you need complex multi-table checks or business rules in Node.js before updating.
- **Risk**: Can cause **deadlocks** and reduce throughput if transactions stay open too long.

---

### Fix 3: Optimistic Concurrency Control (OCC with `version`)
Add a `version INTEGER NOT NULL DEFAULT 1` column to `wallets`:
```sql
-- Step 1: Read balance and current version
SELECT balance, version FROM wallets WHERE user_id = $1;
-- Returns: balance = 100, version = 1

-- Step 2: Attempt conditional update matching the version we just read
UPDATE wallets 
SET balance = 150, version = version + 1 
WHERE user_id = $1 AND version = 1;
```

#### 🔍 Deep Dive: How Request 2 Detects the Collision & Retries with Fresh Data

```text
DB State at Start: { user_id: 101, balance: 100, version: 1 }
```

```text
TIME    REQUEST 1 (Credit $50)                   REQUEST 2 (Debit $30)                     DB ROW STATE
─────────────────────────────────────────────────────────────────────────────────────────────────────────────
T1      SELECT balance, version...               SELECT balance, version...
        ↳ Gets: balance = 100, version = 1       ↳ Gets: balance = 100, version = 1        { balance: 100, version: 1 }

T2      Computes in Node.js memory:              Computes in Node.js memory:
        100 + 50 = $150                          100 - 30 = $70

T3      Executes SQL:
        UPDATE wallets
        SET balance = 150, version = 2
        WHERE user_id = 101 AND version = 1;
        
        ↳ DB Result: rowCount = 1 (SUCCESS!)                                              { balance: 150, version: 2 }

─────────────────────────────────────────────────────────────────────────────────────────────────────────────
⚡ THE CRITICAL MOMENT FOR REQUEST 2
─────────────────────────────────────────────────────────────────────────────────────────────────────────────

T4                                               Executes SQL:
                                                 UPDATE wallets
                                                 SET balance = 70, version = 2
                                                 WHERE user_id = 101 AND version = 1;
                                                 
                                                 ↳ DB checks table:
                                                   "Is there a row with user_id = 101 AND version = 1?"
                                                   Answer: NO! The version on disk is now 2.
                                                 
                                                 ↳ DB Result: rowCount = 0 (No rows updated!)

T5                                               Node.js inspects result: `rowCount === 0`.
                                                 Node.js detects collision: "Data changed underneath!"
                                                 Node.js initiates RETRY.

─────────────────────────────────────────────────────────────────────────────────────────────────────────────
🔄 THE RETRY OF REQUEST 2 (Picking up the new version)
─────────────────────────────────────────────────────────────────────────────────────────────────────────────

T6                                               [RETRY Step 1]: SELECT balance, version...
                                                 ↳ NOW Gets: balance = 150, version = 2     { balance: 150, version: 2 }

T7                                               [RETRY Step 2]: Computes with FRESH state:
                                                 150 - 30 = $120

T8                                               [RETRY Step 3]: Executes SQL:
                                                 UPDATE wallets
                                                 SET balance = 120, version = 3
                                                 WHERE user_id = 101 AND version = 2;
                                                 
                                                 ↳ DB Result: rowCount = 1 (SUCCESS!)     { balance: 120, version: 3 }
```

#### 💻 Production Node.js / TypeScript OCC Implementation (With Retry Loop)

```typescript
async function updateWalletBalanceWithOCC(userId: number, delta: number, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // 1. Read current balance AND current version
    const { rows } = await db.query(
      'SELECT balance, version FROM wallets WHERE user_id = $1',
      [userId]
    );

    if (rows.length === 0) throw new Error('Wallet not found');

    const currentBalance = rows[0].balance;
    const currentVersion = rows[0].version;

    const newBalance = currentBalance + delta;
    if (newBalance < 0) throw new Error('Insufficient funds');

    // 2. Attempt conditional update matching the version we read
    const updateResult = await db.query(
      `UPDATE wallets 
       SET balance = $1, version = version + 1 
       WHERE user_id = $2 AND version = $3`,
      [newBalance, userId, currentVersion]
    );

    // 3. Did we successfully update the row?
    if (updateResult.rowCount === 1) {
      // ✅ Success! Nobody touched it in between.
      return { success: true, newBalance, version: currentVersion + 1 };
    }

    // ⚠️ If rowCount === 0, someone else updated it first!
    console.warn(`[OCC Collision] Attempt ${attempt} failed for user ${userId}. Retrying with fresh state...`);
    
    // Optional: add a tiny backoff jitter (e.g. 5-15ms) before next iteration
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 15));
  }

  throw new Error('Transaction failed after maximum retries due to high contention');
}
```

- **When to use**: Read-heavy workloads with low-to-medium write contention (e.g., user profiles, document editing, catalog settings).

---

## 📌 PART C: The Peer-to-Peer Transfer Deadlock Trap

### 🚨 The Problem Scenario: Naive Pessimistic Locking
Imagine building a money transfer endpoint in Node.js / PostgreSQL. To prevent lost updates, your team implements Pessimistic Locking (`SELECT FOR UPDATE`):

```sql
BEGIN;
-- 1. Lock Sender and verify balance
SELECT balance FROM wallets WHERE user_id = $sender_id FOR UPDATE;

-- 2. Lock Receiver
SELECT balance FROM wallets WHERE user_id = $receiver_id FOR UPDATE;

-- 3. Update balances
UPDATE wallets SET balance = balance - $amount WHERE user_id = $sender_id;
UPDATE wallets SET balance = balance + $amount WHERE user_id = $receiver_id;
COMMIT;
```

---

### 💥 The Concurrent Disaster Event
At the exact same millisecond:
- **Transaction 1**: **Alice** (`user_id = 1`) sends $50 to **Bob** (`user_id = 2`).
- **Transaction 2**: **Bob** (`user_id = 2`) sends $30 to **Alice** (`user_id = 1`).

```text
TIME    TRANSACTION 1 (Alice -> Bob)                TRANSACTION 2 (Bob -> Alice)
─────────────────────────────────────────────────────────────────────────────────────────────
T1      Step 1: Locks Alice (user_id = 1)           Step 1: Locks Bob (user_id = 2)
        ✅ Acquired lock on Row 1                    ✅ Acquired lock on Row 2

T2      Step 2: Wants to lock Bob (user_id = 2)     Step 2: Wants to lock Alice (user_id = 1)
        
        ⏳ "Row 2 is locked by Tx 2!                ⏳ "Row 1 is locked by Tx 1!
            I will WAIT for Tx 2 to commit."            I will WAIT for Tx 1 to commit."
```

### 💥 The Circular Wait (Deadlock):
- **Tx 1** holds Row 1 and waits for Tx 2 to release Row 2.
- **Tx 2** holds Row 2 and waits for Tx 1 to release Row 1.
- **Neither transaction can ever reach `COMMIT`** because each is waiting for the other.

---

### 🚨 What PostgreSQL Does Internally
PostgreSQL runs an internal **Deadlock Detector** (configured by `deadlock_timeout`, default `1s`).
After 1 second of circular waiting, Postgres kills one transaction and throws:
```text
ERROR: deadlock detected
DETAIL: Process 12345 waits for ExclusiveLock on tuple of relation "wallets"; blocked by process 12346.
Process 12346 waits for ExclusiveLock on tuple of relation "wallets"; blocked by process 12345.
SQLSTATE: 40P01
```

---

### 🛠️ The Tech Lead Solution: Deterministic Lock Ordering

> **The Golden Rule**: Always acquire multi-row locks in the **exact same sorted order** across all transactions in your codebase.

Instead of locking `"Sender first, then Receiver"`, lock by **`MIN(user_id) first, then MAX(user_id)`**.

#### Production Node.js Implementation:
```typescript
async function transferMoney(fromUserId: number, toUserId: number, amount: number) {
  // 1. Always sort the IDs deterministically!
  const [firstId, secondId] = fromUserId < toUserId 
    ? [fromUserId, toUserId] 
    : [toUserId, fromUserId];

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 2. Lock smaller ID first, then larger ID
    const r1 = await client.query('SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE', [firstId]);
    const r2 = await client.query('SELECT balance FROM wallets WHERE user_id = $2 FOR UPDATE', [secondId]);

    if (r1.rows.length === 0 || r2.rows.length === 0) {
      throw new Error('Wallet not found');
    }

    // 3. Identify sender balance from locked rows
    const senderBalance = fromUserId === firstId ? r1.rows[0].balance : r2.rows[0].balance;
    if (senderBalance < amount) {
      throw new Error('Insufficient funds');
    }

    // 4. Update balances
    await client.query('UPDATE wallets SET balance = balance - $1 WHERE user_id = $2', [amount, fromUserId]);
    await client.query('UPDATE wallets SET balance = balance + $1 WHERE user_id = $2', [amount, toUserId]);

    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

---

### 🔍 Why Deterministic Sorting Guarantees Zero Deadlocks

Both transactions are now forced to **compete for Row 1 first**:

```text
TIME    TRANSACTION 1 (Alice -> Bob)                TRANSACTION 2 (Bob -> Alice)
─────────────────────────────────────────────────────────────────────────────────────────────
T1      Wants to lock firstId (user_id = 1)         Wants to lock firstId (user_id = 1)
        
        🎉 Tx 1 arrives 1 microsecond earlier:
        ✅ Acquired Lock on Row 1                    ⏳ Row 1 is already locked by Tx 1!
                                                       Tx 2 pauses and WAITS right here.
                                                       
                                                       ⚠️ CRITICAL POINT: 
                                                       Tx 2 holds ZERO locks right now! 
                                                       It has NOT touched Row 2 yet.

─────────────────────────────────────────────────────────────────────────────────────────────
T2      Tx 1 continues to secondId (user_id = 2):
        
        "Is Row 2 free?"
        YES! (Because Tx 2 is stuck waiting at Row 1)
        
        ✅ Acquired Lock on Row 2

T3      Tx 1 finishes both updates and runs COMMIT:
        ✅ Tx 1 is DONE.
        🔓 PostgreSQL releases Lock 1 and Lock 2.

─────────────────────────────────────────────────────────────────────────────────────────────
T4                                                   Tx 2 WAKES UP (Row 1 is now free!)
                                                     
                                                     ✅ Acquired Lock on Row 1
                                                     ✅ Acquired Lock on Row 2
                                                     ✅ Updates balances and runs COMMIT.
                                                     🎉 Tx 2 is DONE without any error!
```

---

## 🎯 Summary Comparison for Tech Leads & Interviews

| Strategy | Mechanism | Performance / Throughput | Deadlock Risk | Best Use Case |
| :--- | :--- | :---: | :---: | :--- |
| **Atomic Update** | Engine row lock during single query | **Highest** (No transaction wait) | **None** | Direct counters, balances, inventory decrement |
| **Pessimistic (`FOR UPDATE`)** | Explicit row lock held across transaction | **Medium** (Queues requests on lock) | **High** (Eliminated with Deterministic Sorting) | Complex multi-table financial operations |
| **Optimistic (OCC)** | Version check, retry on conflict | **High** (Under low contention) | **None** | Collaboration docs, low-frequency updates |

