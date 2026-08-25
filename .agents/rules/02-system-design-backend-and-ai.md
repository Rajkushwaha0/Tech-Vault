# SYSTEM DESIGN, BACKEND MASTERY & AI ARCHITECTURE RULE

This rule governs all technical explanations across Backend Systems, Databases, Distributed Architecture, and AI Systems.

---

## 🏛️ 1. System Design (HLD & LLD) Guidelines
- **High-Level Design (HLD):**
  - Always start with explicit Functional Requirements, Non-Functional Requirements (SLAs, Latency, Availability, Consistency), and Scale Estimations (QPS, Storage, Bandwidth).
  - Define clear API Contracts and Data Models before drawing architecture components.
  - Detail deep-dive bottlenecks: Single points of failure, Partitioning/Sharding strategy, Cache invalidation policies, Idempotency keys, and Failure modes.
  - Present explicit trade-offs (e.g., CP vs AP, Read-heavy vs Write-heavy optimizations).
- **Low-Level Design (LLD):**
  - Follow SOLID principles, clean domain layering (Controller → Service → Repository/Domain), design patterns (Strategy, Factory, Observer, Decorator, Circuit Breaker).
  - Explicitly model thread-safety, race condition handling, and memory lifecycle.

---

## 🗄️ 2. Backend, Database Internals & Distributed Systems
- **SQL & Query Performance:**
  - Break down window functions, recursive CTEs, join algorithms (Nested loop, Hash join, Merge join).
  - Emphasize `EXPLAIN ANALYZE`, index selection (B-Tree, composite index leftmost prefix rule, covering indexes).
- **Database Internals & Concurrency:**
  - Deep-dive into ACID, Isolation levels (Dirty read, Non-repeatable read, Phantom read, Serialization anomaly).
  - Concurrency control mechanisms: MVCC, Pessimistic Locking (`SELECT FOR UPDATE`), and Optimistic Locking (`version` columns).
- **Distributed Systems:**
  - Message brokers (Kafka partitions, consumer groups, offset management vs SQS FIFO).
  - Reliable messaging patterns: Transactional Outbox, Idempotency keys, Saga pattern (Choreography vs Orchestration), Distributed locking (Redlock).

---

## 🤖 3. AI & Agent Systems Architecture
- **RAG & Vector Retrieval:** Hybrid search (Sparse BM25 + Dense embeddings), chunking strategies, re-ranking, metadata filtering.
- **Agent Frameworks:** Stateful graphs (e.g., LangGraph), tool calling, error recovery loops, context compression.
- **Production Guardrails:** Token latency optimization, prompt injection defenses, PII redaction, evaluation frameworks.
- **Security:** OWASP Top 10 for LLMs, rate limiting, and cost controls.
