# ACTIVE LEARNING QUEUE & PRIORITY DRILLS

---

## 🎯 P0: Critical Foundations & Concurrency (Weeks 1–4)

### 1. Database Concurrency, ACID & Isolation Levels
- **What to Master**:
  - PostgreSQL transaction isolation levels: `Read Committed` (default), `Repeatable Read`, `Serializable`.
  - Concurrency anomalies: Dirty Read, Non-Repeatable Read, Phantom Read, Serialization Anomaly.
  - Concurrency control mechanisms: Multi-Version Concurrency Control (MVCC), Pessimistic Locking (`SELECT FOR UPDATE`), Optimistic Locking (`version` column / conditional update).
  - Deadlock detection, lock escalations, and index-based locking.
- **Drill / Production Exercise**:
  - Design a bulletproof double-entry wallet credit/debit transaction system in Node.js/PostgreSQL handling 1,000 concurrent updates on the same wallet with zero double-spends and zero deadlocks.

### 2. Distributed Guarantees & Message Queues (SQS)
- **What to Master**:
  - Producer-Consumer model mechanics: Visibility Timeout, In-Flight limits, Long Polling (`WaitTimeSeconds`), Exponential Backoff.
  - At-least-once delivery implications: Duplicate delivery, out-of-order execution, poison messages.
  - Solving the **Dual-Write Problem**: Transactional Outbox Pattern + Debezium/Worker polling.
  - Distributed Idempotency: Redis SETNX with TTL vs DB Unique Constraints + State Machines.
- **Drill / Production Exercise**:
  - Design a video rendering worker that guarantees exactly-once business outcome even when SQS delivers duplicate messages or workers crash mid-render.

### 3. Node.js Runtime Internals & Performance
- **What to Master**:
  - V8 execution stack vs Libuv event loop 6 phases (`timers`, `pending callbacks`, `idle/prepare`, `poll`, `check`, `close callbacks`).
  - Microtasks (`process.nextTick`, `Promise.then`) vs Macrotasks.
  - Event loop starvation, thread pool exhaustion (`UV_THREADPOOL_SIZE`), CPU-bound tasks in Node.js.
  - Stream Backpressure (`readable.pipe`, `.write()` returning `false`, `drain` event) & memory leak profiling with heap snapshots.
- **Drill / Production Exercise**:
  - Diagnose and resolve a real-world memory leak and event loop blocking scenario in a media streaming proxy.

---

## 🎯 P1: Production AI & Agent Architecture (Weeks 5–8)

### 1. Multi-Agent Orchestration & Stateful Workflows (LangGraph)
- **What to Master**:
  - Cyclic graphs, state reducers, checkpointing with PostgreSQL/Redis saver.
  - Guarding against infinite agent loops: Max iterations, recursion limit, token budget cutoffs.
  - Human-in-the-loop: Interrupt states, state resumption, rollbacks.
  - Deterministic workflows vs Autonomous agents: Choosing the simplest architecture that solves the problem.

### 2. Scaled RAG for 1M+ Documents
- **What to Master**:
  - Ingestion pipeline: Document parsing, recursive character chunking, token estimation.
  - Vector indexing: Flat vs IVFFlat vs HNSW (Graph-based approximate nearest neighbor).
  - Hybrid search: Combining sparse keyword search (BM25) with dense vector embeddings (Cosine / Dot Product) + Cross-Encoder Reranker.
  - Metadata filtering, tenant isolation, and live index updates/deletions.

---

## 🎯 P2: High-Level Architecture & Tech Leadership (Weeks 9–12)

### 1. High-Scale System Design
- End-to-end design for Social Media Publishing & Scheduling Engine (handling 1M daily scheduled posts with strict timing constraints).
- Real-time media conversion & CDN delivery architecture.

### 2. Technical Leadership & Architecture Reviews
- Writing production RFCs / Architecture Decision Records (ADRs).
- Defending system trade-offs against cost, availability, latency, and team delivery velocity.
