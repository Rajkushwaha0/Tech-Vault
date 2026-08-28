# TOPIC 05: FINTECH FRAUD DETECTION — BURST VELOCITY & SLIDING WINDOW ANALYTICS (SQL VS MONGODB)

- **Topic ID**: `TOPIC-05-SQL-MONGO-BURST-VELOCITY-WINDOW-FUNCTIONS`
- **Date**: `2026-08-29`
- **Module**: `Phase 1 — Core Foundations & Database Concurrency`
- **Target Maturity**: `L2 → L4 (Production & Interview Ready)`

---

## 🏛️ PART 1: The Real-World Production Scenario

### 1. The Business Situation
You work on the Risk & Abuse / Fraud Detection platform at a high-throughput digital payments company (e.g., Stripe, PayPal, Razorpay). 

When compromised credit cards, stolen tokens, or hijacked sessions are exploited by bad actors, they exhibit a well-known behavioral anomaly known as **"The Burst & Spike"**:
1. **Burst Testing**: The attacker runs rapid transactions within minutes to verify the credential is still valid and not yet frozen.
2. **Spike Drain**: Almost immediately after, they attempt a disproportionately high transaction (e.g. $500–$2,000) to extract maximum value before the user receives an SMS/push alert and locks the account.

```text
Normal Behavior:
Tx 1: $45 (10:00 AM) ────────── 2 hours ──────────► Tx 2: $50 (12:00 PM)

Fraud Burst & Spike Pattern:
Tx 1: $50 (10:00 AM) ── 30m ──► Tx 2: $60 (10:30 AM) ── 30m ──► Tx 3: $40 (11:00 AM) ── 5m ──► Tx 4: $500! (11:05 AM)
                                                                                         ▲
                                                                           [Rapid Burst + 10x Spike]
```

### 2. The Business Objective
Your Risk Engineering team needs an analytical detection pipeline that evaluates every incoming or batch transaction against the user's localized historical baseline:

1. Calculate the **time delta (in minutes)** from the user's immediately preceding transaction.
2. Calculate the **rolling baseline average** of the user's prior 3 transactions (strictly excluding the current transaction).
3. Raise a **`SUSPICIOUS_VELOCITY_SPIKE`** alert if:
   - The transaction occurred **within 10 minutes** of their last transaction (`time_since_prev <= 10`), **AND**
   - The current amount is **at least $3\times$ higher** than their prior 3-transaction rolling average (`amount >= 3 * rolling_avg_prev_3`).
   - *(Note: Users with fewer than 3 prior transactions do not have enough baseline history to trigger this specific rule).*

---

## 📋 PART 2: Schema & Concrete Test Data

### 1. Schema Definition
Given a `transactions` table / collection:

| Column / Field | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR / ObjectId | Unique transaction identifier |
| `user_id` | VARCHAR | Account holder identifier |
| `amount` | NUMERIC(10, 2) / Double | Amount of transaction in USD |
| `created_at` | TIMESTAMP / Date | UTC timestamp when transaction was created |

### 2. Sample Data

```sql
-- Sample Seed Data
INSERT INTO transactions (id, user_id, amount, created_at) VALUES
('tx_1', 'user_A', 50.00,  '2026-08-29 10:00:00'),
('tx_2', 'user_A', 60.00,  '2026-08-29 10:30:00'),
('tx_3', 'user_A', 40.00,  '2026-08-29 11:00:00'),
('tx_4', 'user_A', 500.00, '2026-08-29 11:05:00'), -- Triggers fraud rule
('tx_5', 'user_B', 100.00, '2026-08-29 10:10:00'),
('tx_6', 'user_B', 800.00, '2026-08-29 10:15:00'); -- Only 1 prior tx (cold start)
```

### 3. Expected Evaluation Matrix

| id | user_id | amount | time_since_prev_mins | rolling_avg_prev_3 | is_fraud_suspect | Evaluation Reason |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `tx_1` | `user_A` | $50.00 | `NULL` | `NULL` | `FALSE` | First transaction. No previous history. |
| `tx_2` | `user_A` | $60.00 | 30.0 | `NULL` | `FALSE` | Only 1 prior transaction. Insufficient baseline. |
| `tx_3` | `user_A` | $40.00 | 30.0 | `NULL` | `FALSE` | Only 2 prior transactions. Insufficient baseline. |
| `tx_4` | `user_A` | $500.00 | **5.0** | **$50.00** | **`TRUE`** | ⚡ **ALERT**: Gap = 5m ($\le 10$m) and $\$500 \ge 3 \times \$50$ ($150). |
| `tx_5` | `user_B` | $100.00 | `NULL` | `NULL` | `FALSE` | First transaction for `user_B`. |
| `tx_6` | `user_B` | $800.00 | 5.0 | `NULL` | `FALSE` | Gap $\le 10$, but only 1 prior transaction. |

---

## 🧠 PART 3: Engineering Pitfalls & Mental Model

### Trap 1: The Implicit Window Frame Inclusion
*Junior Mistake:*
```sql
-- DANGEROUS!
AVG(amount) OVER (
    PARTITION BY user_id 
    ORDER BY created_at 
    ROWS 3 PRECEDING
)
```
*Why this fails:* When you write `ROWS 3 PRECEDING`, SQL expands this to `ROWS BETWEEN 3 PRECEDING AND CURRENT ROW`. The current spike (e.g. $500) will be added to the average:
$$\text{AVG} = \frac{50 + 60 + 40 + 500}{4} = \$162.50$$
This inflates the baseline and suppresses the alert! You must explicitly exclude the current row:
```sql
ROWS BETWEEN 3 PRECEDING AND 1 PRECEDING
```

### Trap 2: Cold Start False Positives / Skew
If a user has only 1 transaction of $10, and their 2nd transaction 2 minutes later is $35:
Without a minimum count check (`prior_tx_count = 3`), $35 would be evaluated against an average of $10, falsely flagging legitimate new users before a stable baseline is formed.

### Trap 3: NoSQL Window Queries
Engineers often assume MongoDB cannot perform window functions or time-series framing. Prior to MongoDB 5.0, developers fetched documents into Node.js/Python memory to do rolling calculations. Since MongoDB 5.0, the `$setWindowFields` aggregation stage allows in-database analytical window execution.

---

## 🛠️ PART 4: SQL Implementation (PostgreSQL / MySQL 8+)

```sql
WITH transaction_window_metrics AS (
    SELECT
        id,
        user_id,
        amount,
        created_at,

        -- 1. Difference from immediately previous transaction in minutes
        ROUND(
            EXTRACT(EPOCH FROM (
                created_at - LAG(created_at, 1) OVER (
                    PARTITION BY user_id 
                    ORDER BY created_at
                )
            )) / 60.0, 
            1
        ) AS time_since_prev_mins,

        -- 2. Count preceding rows in the history frame to handle cold start
        COUNT(*) OVER (
            PARTITION BY user_id 
            ORDER BY created_at 
            ROWS BETWEEN 3 PRECEDING AND 1 PRECEDING
        ) AS prior_tx_count,

        -- 3. Average of prior 3 transactions (excluding current row)
        ROUND(
            AVG(amount) OVER (
                PARTITION BY user_id 
                ORDER BY created_at 
                ROWS BETWEEN 3 PRECEDING AND 1 PRECEDING
            ), 
            2
        ) AS rolling_avg_prev_3
    FROM transactions
)
SELECT
    id,
    user_id,
    amount,
    time_since_prev_mins,
    CASE 
        WHEN prior_tx_count = 3 THEN rolling_avg_prev_3 
        ELSE NULL 
    END AS rolling_avg_prev_3,
    CASE
        WHEN time_since_prev_mins <= 10.0
         AND prior_tx_count = 3
         AND amount >= (3 * rolling_avg_prev_3)
        THEN TRUE
        ELSE FALSE
    END AS is_fraud_suspect
FROM transaction_window_metrics
ORDER BY user_id, created_at;
```

---

## 🍃 PART 5: MongoDB Aggregation (MongoDB 5.0+ `$setWindowFields`)

```javascript
db.transactions.aggregate([
  // Step 1: Analytical Window Processing
  {
    $setWindowFields: {
      partitionBy: "$user_id",
      sortBy: { created_at: 1 },
      output: {
        // Shift by -1 to retrieve the previous document's timestamp
        prev_created_at: {
          $shift: {
            output: "$created_at",
            by: -1
          }
        },
        // Count documents in the window [-3, -1]
        prior_tx_count: {
          $count: {},
          window: {
            documents: [-3, -1] // 3 docs ago to 1 doc ago (excludes current)
          }
        },
        // Calculate average amount over the window [-3, -1]
        rolling_avg_prev_3: {
          $avg: "$amount",
          window: {
            documents: [-3, -1]
          }
        }
      }
    }
  },

  // Step 2: Projection & Fraud Evaluation Logic
  {
    $project: {
      _id: 1,
      user_id: 1,
      amount: 1,
      created_at: 1,
      time_since_prev_mins: {
        $cond: {
          if: { $eq: ["$prev_created_at", null] },
          then: null,
          else: {
            $round: [
              {
                $divide: [
                  { $subtract: ["$created_at", "$prev_created_at"] },
                  1000 * 60 // milliseconds to minutes
                ]
              },
              1
            ]
          }
        }
      },
      rolling_avg_prev_3: {
        $cond: {
          if: { $eq: ["$prior_tx_count", 3] },
          then: { $round: ["$rolling_avg_prev_3", 2] },
          else: null
        }
      },
      is_fraud_suspect: {
        $cond: {
          if: {
            $and: [
              { $eq: ["$prior_tx_count", 3] },
              {
                $lte: [
                  {
                    $divide: [
                      { $subtract: ["$created_at", "$prev_created_at"] },
                      1000 * 60
                    ]
                  },
                  10
                ]
              },
              {
                $gte: [
                  "$amount",
                  { $multiply: [3, "$rolling_avg_prev_3"] }
                ]
              }
            ]
          },
          then: true,
          else: false
        }
      }
    }
  },

  // Step 3: Deterministic Ordering
  { 
    $sort: { user_id: 1, created_at: 1 } 
  }
]);
```

---

## ⚡ PART 6: Production Indexing & Query Execution

Both SQL and MongoDB execute partition-based window operations:
1. Divide records into user partitions (`PARTITION BY user_id` / `partitionBy: "$user_id"`).
2. Sort rows within each partition by `created_at ASC`.

### The Catastrophic Plan Without an Index:
Without an index, the database must perform a full table scan, load all rows into work memory (e.g. `work_mem` in PostgreSQL), and run an external disk/memory sort.

### Covering Index Strategy:

#### PostgreSQL:
```sql
CREATE INDEX idx_tx_user_created_covering 
ON transactions (user_id, created_at ASC) 
INCLUDE (amount);
```
- `(user_id, created_at ASC)` allows the query engine to stream pre-sorted records directly into the window accumulator without sorting.
- `INCLUDE (amount)` turns this into an **Index-Only Scan**, avoiding table heap lookups entirely.

#### MongoDB:
```javascript
db.transactions.createIndex(
  { user_id: 1, created_at: 1, amount: 1 }, 
  { name: "idx_fraud_window_eval" }
);
```

---

## 🚀 PART 7: Advanced Variation (Count-Based vs. Time-Based Framing)

### The Follow-up Interview Question:
> *"What if instead of the prior 3 **transactions** (count-based), the business asks for the baseline over the **prior 7 calendar days** (time-based)?"*

### SQL Time-Based Window (`RANGE BETWEEN INTERVAL`):
```sql
AVG(amount) OVER (
    PARTITION BY user_id 
    ORDER BY created_at 
    RANGE BETWEEN INTERVAL '7 days' PRECEDING AND INTERVAL '1 second' PRECEDING
)
```

### MongoDB Time-Based Window (`window: { range: [...] }`):
```javascript
rolling_avg_7_days: {
  $avg: "$amount",
  window: {
    range: [-7, 0],
    unit: "day"
  }
}
```
