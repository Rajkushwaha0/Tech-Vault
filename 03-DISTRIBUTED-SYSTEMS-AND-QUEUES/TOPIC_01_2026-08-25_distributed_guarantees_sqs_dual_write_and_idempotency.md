# TOPIC 01: DISTRIBUTED GUARANTEES, SQS, DUAL-WRITE & IDEMPOTENCY

**Date:** 2026-08-25  
**Track:** 03-DISTRIBUTED-SYSTEMS-AND-QUEUES  
**Prerequisites:** Database Transactions (ACID), Asynchronous Node.js, AWS SQS Basics  
**Target Profile:** Senior Backend Engineer / Product Tech Lead  

---

## 🧭 Executive Summary & Core Mental Model

In a monolithic system with a single database, operations either succeed together or fail together via ACID transactions. 

In a **distributed system** involving a Database, a Message Queue (SQS), and Worker Nodes, there is **no single distributed transaction coordinator** (2-Phase Commit is too slow and fragile for web-scale).

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                DISTRIBUTED ASYNC PROCESSING MODEL                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│  [API Client] ──► [API Server] ──(1. ACID Tx)──► [PostgreSQL]                                   │
│                         │                                                                        │
│                         └──(2. Network RPC)──► [AWS SQS Queue]                                   │
│                                                       │                                          │
│                                                       └──(3. Poll)──► [Worker 1] ──► [3rd Party] │
│                                                       └──(3. Poll)──► [Worker 2]                 │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Every distributed hop across the network can fail in 3 ways:
1. **Success**
2. **Failure**
3. **Timeout / Unknown State** (The request might have executed, but the response was lost).

To build reliable systems, we must master:
1. **The Dual-Write Problem** (Transactional Outbox Pattern)
2. **Message Queue Semantics** (Visibility Timeout & Heartbeating)
3. **Distributed Idempotency** (Atomic State Machines & Idempotency Keys)

---

## ⚡ 1. The Dual-Write Problem (API Layer)

### The Core Conflict
When an API receives a request to create a job (e.g. `POST /posts`), it must perform two state changes:
1. Write entity to PostgreSQL (`status = 'PENDING'`)
2. Publish message to AWS SQS

Because PostgreSQL and AWS SQS are separate storage systems without distributed ACID transactions:
* If you commit DB first and SQS fails $\rightarrow$ **Stuck / Lost Job**.
* If you push SQS first and DB fails $\rightarrow$ **Ghost Job processed by workers**.

---

### 📝 User's Proposed Solution
> *"Use a state dispatch in DB with `{ status: 'pending', attempt: 0, maxRetries: 3 }`. First create a record in DB. If inserted, call function to send SQS message. If SQS push fails, update status to pending and increase attempt. A background cron polls DB for `status = 'pending' AND attempt > 0` and tries to push to SQS up to 3 attempts, then fails."*

---

### 🔍 Tech Lead Deep Critique & Hidden Flaws

```
                    ┌───────────────────────────────────────────────────┐
                    │            WHERE THE NAIVE DISPATCH FAILS         │
                    └─────────────────────────┬─────────────────────────┘
                                              │
         ┌────────────────────────────────────┴────────────────────────────────────┐
         ▼                                                                         ▼
[Flaw 1: The Crash Between Steps]                                 [Flaw 2: False Failure / Double Push]
API commits DB with attempt = 0.                                  SQS accepts message, but network drops ACK.
API process dies before sendSQS().                                API marks attempt = 1 for Cron.
Cron ignores attempt = 0 ➔ JOB LOST FOREVER.                      Cron pushes AGAIN ➔ DUPLICATE SQS MESSAGE.
```

1. **The Crash Between Steps (Ghost Pending Job):**
   If the Node.js process crashes (OOM, deployment, SIGTERM) right after `db.insert()` commits, `attempt` remains `0`. If the cron only queries `attempt > 0`, this job is **permanently abandoned**.
2. **The Double-Push on Network Timeout:**
   If `sqs.sendMessage()` reaches AWS and is queued, but the network connection drops before Node.js receives the HTTP 200 response, Node.js catches an error, increments `attempt`, and the cron pushes a **second duplicate message**.
3. **Database Polling Contention at Scale:**
   Running `SELECT ... WHERE status = 'pending'` every few seconds across a table with millions of historical rows leads to index fragmentation, sequential scans, and DB CPU spikes.

---

### 🏆 The Staff/Tech Lead Architecture: Transactional Outbox Pattern

To guarantee 100% atomicity between Database and Queue, use the **Transactional Outbox Pattern**.

#### Architectural Blueprint:
```
[Client Request]
       │
       ▼
[API Server] ──(BEGIN TRANSACTION)─────────────────────────────────────────────┐
       │                                                                       │
       ├──► 1. INSERT INTO posts (id, user_id, media_url, status)              │ (1 Single
       │       VALUES ('p123', 'u1', 'https://...', 'PENDING');                │  ACID Tx)
       │                                                                       │
       └──► 2. INSERT INTO outbox_events (id, aggregate_type, payload, status) │
               VALUES ('e999', 'POST', '{"postId":"p123"}', 'PENDING');       │
                                                                               │
[API Server] ──(COMMIT TRANSACTION)────────────────────────────────────────────┘
       │
       ▼ (DB Guarantees BOTH or NEITHER exist)
```

#### How Outbox Events Reach SQS (2 Industry Strategies):

#### Strategy A: Polling Publisher with `FOR UPDATE SKIP LOCKED`
A lightweight background worker polls the `outbox_events` table using row-level locking without blocking other workers:

```sql
-- Worker retrieves 50 pending events safely across multiple instances
SELECT id, aggregate_type, payload 
FROM outbox_events 
WHERE status = 'PENDING' 
ORDER BY created_at ASC 
LIMIT 50 
FOR UPDATE SKIP LOCKED;
```

```javascript
// Worker Publisher Implementation
async function publishOutboxBatch() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { rows: events } = await client.query(`
      SELECT id, payload 
      FROM outbox_events 
      WHERE status = 'PENDING' 
      ORDER BY created_at ASC 
      LIMIT 50 
      FOR UPDATE SKIP LOCKED
    `);

    if (events.length === 0) {
      await client.query('COMMIT');
      return;
    }

    // Publish to SQS in batch
    const entries = events.map(e => ({
      Id: e.id,
      MessageBody: JSON.stringify(e.payload)
    }));

    await sqs.sendMessageBatch({ QueueUrl: QUEUE_URL, Entries: entries }).promise();

    // Mark as published inside the same transaction
    const eventIds = events.map(e => e.id);
    await client.query(`
      UPDATE outbox_events 
      SET status = 'PUBLISHED', published_at = NOW() 
      WHERE id = ANY($1::uuid[])
    `, [eventIds]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Outbox publishing failed', err);
  } finally {
    client.release();
  }
}
```

#### Strategy B: Change Data Capture (CDC) with Debezium (Zero Polling Overhead)
* PostgreSQL writes all commits to its internal **Write-Ahead Log (WAL)**.
* **Debezium** connects to PostgreSQL via Logical Replication, reads the `outbox_events` table from the WAL stream, and pushes directly to SQS or Kafka with **sub-millisecond latency** and **zero DB load**.

---

## ⚡ 2. The Visibility Timeout Trap (Worker Layer)

### The Core Conflict
When a worker receives a message from SQS via `ReceiveMessage`, SQS makes the message invisible to other workers for the duration of the **Visibility Timeout** (e.g. 30 seconds).
* If the worker finishes and calls `DeleteMessage` within 30s, the message is permanently removed.
* If the worker takes **45 seconds** to render a 4K video, at second 30 the Visibility Timeout expires.
* SQS assumes Worker 1 died and delivers the exact same message to Worker 2.

---

### 📝 User's Proposed Solution
> *"Introduce a status: 'generating'. If another worker gets it and sees 'generating', it deletes that message or returns directly. Also, do not keep visibility timeout so low: if a job takes 5 min, keep visibility timeout at 12 min (double + 2 buffer)."*

---

### 🔍 Tech Lead Deep Critique & Hidden Flaws

```
[Static 12-Min Timeout] ──► Worker 1 receives msg ──► Worker 1 crashes at 10s (OOM)
                                                            │
                                                            ▼
                                   💥 SQS holds message invisible for 11 MIN 50 SEC!
                                   💥 Job delayed for 12 minutes before retry!
                                                            │
                                                            ▼
[Status 'generating' check] ──► Worker 2 picks up msg at minute 12.
                                Sees status = 'generating'.
                                Worker 2 DELETES message and exits!
                                💥 THE JOB IS LOST FOREVER.
```

1. **The Zombie Dropped Job Bug:**
   If Worker 1 crashes (e.g. out-of-memory or EC2 spot instance termination) after setting `status = 'generating'`, Worker 2 eventually picks up the message, sees `status = 'generating'`, and **deletes the message**. The job will **never be processed** and stays stuck in `generating` forever.
2. **The Huge Visibility Timeout Penalty:**
   Setting visibility timeout to 12 minutes for a 5-minute job means that if a worker crashes legitimately in second 10, the job cannot be picked up by another worker for **nearly 12 minutes**, destroying customer SLAs.

---

### 🏆 The Staff/Tech Lead Architecture: Dynamic Heartbeat Extension (`ChangeMessageVisibility`)

Set a short, aggressive Visibility Timeout (e.g. **60 seconds**). While the worker is actively computing (e.g. FFmpeg transcoding), run a background heartbeat timer that periodically extends visibility.

#### Architecture Flow:
```
[Worker 1] Receives Message (Visibility = 60s)
   │
   ├──► Starts Video Transcoding (Target: 5 minutes)
   │
   ├──► [Heartbeat Loop Every 20s]:
   │       sqs.changeMessageVisibility({ VisibilityTimeout: 60 })
   │       (Message stays invisible as long as Worker 1 is healthy)
   │
   ├──► Video Finished ➔ DeleteMessage() from SQS ➔ Stop Heartbeat
   │
   └──► IF WORKER CRASHES:
           Heartbeat stops immediately.
           Exactly 60s later, Worker 2 picks it up and retries!
```

#### Production Heartbeat Implementation:
```typescript
import { SQS } from 'aws-sdk';

export async function processWithHeartbeat(
  sqs: SQS,
  queueUrl: string,
  receiptHandle: string,
  jobFn: () => Promise<void>
) {
  const HEARTBEAT_INTERVAL_MS = 20_000; // 20 seconds
  const EXTENSION_VISIBILITY_SEC = 60;  // Extend by 60 seconds

  let isComplete = false;

  // Background Heartbeat Timer
  const heartbeatTimer = setInterval(async () => {
    if (isComplete) return;
    try {
      await sqs.changeMessageVisibility({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
        VisibilityTimeout: EXTENSION_VISIBILITY_SEC
      }).promise();
      console.log(`[Heartbeat] Extended visibility by ${EXTENSION_VISIBILITY_SEC}s`);
    } catch (err) {
      console.error('[Heartbeat] Failed to extend visibility', err);
    }
  }, HEARTBEAT_INTERVAL_MS);

  try {
    await jobFn(); // Run FFmpeg / AI Transcoding
    isComplete = true;
    clearInterval(heartbeatTimer);

    // Delete message upon verified completion
    await sqs.deleteMessage({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle
    }).promise();
  } catch (error) {
    isComplete = true;
    clearInterval(heartbeatTimer);
    // Release immediately for retry by setting visibility to 0
    await sqs.changeMessageVisibility({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
      VisibilityTimeout: 0
    }).promise();
    throw error;
  }
}
```

---

## ⚡ 3. Distributed Idempotency & Concurrency

### The Core Conflict
AWS SQS Standard provides **At-Least-Once Delivery**. Under network latency, worker timeouts, or retry spikes, **multiple workers can receive the exact same message concurrently**.
* If both workers proceed, they will charge the customer twice and post duplicate media to Instagram/TikTok.

---

### 📝 User's Proposed Solution
> *"In DB have `isDelivered: false`. When consumer gets it, update in DB. After processing, delete that data. If success, delete the message. If error, terminate or delete and insert again with same payload or decrement attempt in DB. If duplicate message arrives by chance, check `isDelivered == true` and return automatically."*

---

### 🔍 Tech Lead Deep Critique & Hidden Flaws

```
Worker A (Timestamp 00.001)                   Worker B (Timestamp 00.002)
──────────────────────────────────────────────────────────────────────────
SELECT isDelivered FROM jobs WHERE id = 99;   SELECT isDelivered FROM jobs WHERE id = 99;
-- Returns false                               -- Returns false (Worker A has not written yet!)
Deducts AI Credits                            Deducts AI Credits (💥 DOUBLE SPEND!)
Calls Instagram API                           Calls Instagram API (💥 DUPLICATE POST!)
UPDATE jobs SET isDelivered = true;           UPDATE jobs SET isDelivered = true;
```

1. **The TOCTOU Race Condition (Time-of-Check to Time-of-Use):**
   Reading `isDelivered == false` and then executing work is non-atomic. Two concurrent workers will both read `false` before either has finished, executing the payment and API call twice.
2. **Deleting Data Destroys Future Idempotency:**
   If you delete the DB record after completion, when a delayed duplicate SQS message arrives 2 minutes later, the worker queries the DB, finds no record, and may treat it as a new job! **Completed records must be retained with terminal state `COMPLETED` for idempotency verification.**

---

### 🏆 The Staff/Tech Lead Architecture: Atomic State Transitions & Idempotency Keys

To guarantee bulletproof exactly-once execution semantics across distributed nodes, implement the **3-Tier Idempotency Shield**:

```
                       ┌──────────────────────────────────────────────┐
                       │          3-TIER IDEMPOTENCY SHIELD           │
                       └──────────────────────┬───────────────────────┘
                                              │
    ┌─────────────────────────────────────────┼─────────────────────────────────────────┐
    ▼                                         ▼                                         ▼
[Tier 1: Fast Redis Lock]         [Tier 2: Atomic DB State Machine]       [Tier 3: 3rd-Party Idempotency Key]
SET lock:job_123 NX EX 120        UPDATE jobs SET status = 'PROCESSING'   Send 'Idempotency-Key: job_123'
(Rejects 99% instant dupes)       WHERE id = 123 AND status = 'PENDING'   to Stripe / Instagram APIs
                                  (Strict single-winner guarantee)        (External safety net)
```

#### 1. Atomic Database Claim (Conditional Update):
```sql
-- Single winner atomic transition
UPDATE jobs 
SET 
  status = 'PROCESSING',
  locked_by = :workerId,
  locked_at = NOW()
WHERE id = :jobId 
  AND status = 'PENDING'
RETURNING *;
```
* If `rowCount === 1`: This worker **won the lock**. Proceed to process.
* If `rowCount === 0`: Another worker already claimed this job. **Drop message and do nothing.**

#### 2. Double-Entry Balance Deduction with Constraints:
Never do `UPDATE users SET credits = credits - 10`. Use balance assertions:
```sql
UPDATE user_wallets 
SET balance = balance - :cost 
WHERE user_id = :userId 
  AND balance >= :cost; -- Prevents balance from ever going negative
```

#### 3. Downstream API Idempotency Headers:
When calling external APIs (e.g. Stripe, Instagram Graph API, LLM Gateways), pass the immutable job UUID:
```http
POST /v1/media/publish HTTP/1.1
Host: graph.facebook.com
Idempotency-Key: post_job_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
```

---

## 📊 Summary Comparison: Junior/Mid vs. Product Tech Lead

| Dimension | Mid-Level Approach | Staff / Tech Lead Approach |
| :--- | :--- | :--- |
| **Dual-Write** | DB insert + SQS push in try/catch with cron retry | **Transactional Outbox Pattern** with CDC (Debezium) or `SKIP LOCKED` |
| **Long Jobs** | Giant static Visibility Timeout (e.g. 15 mins) | Short Visibility Timeout (60s) + **Active Background Heartbeat** |
| **Worker Crashes** | Jobs get stuck in `generating` or dropped | Heartbeat stops $\rightarrow$ automatic seamless retry by another worker |
| **Deduplication** | Boolean flag check (`if (!isDelivered)`) | **Atomic conditional SQL update** + **Downstream Idempotency Keys** |
| **Post-Completion** | Delete DB records | Retain terminal state (`COMPLETED`) for audit & replay protection |

---

## 🎯 Actionable Takeaway & Self-Check

Next time you design a message-driven pipeline:
1. **Never call `sqs.sendMessage` inside a web request handler without an Outbox table.**
2. **Never set a 15-minute Visibility Timeout for slow jobs; write a 20-line heartbeat manager.**
3. **Always use atomic SQL conditional statements (`WHERE status = 'PENDING'`) to claim jobs.**
