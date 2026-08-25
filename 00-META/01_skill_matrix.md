# LIVE SKILL MATRIX & MATURITY RATINGS

> **Maturity Scale Definitions**:
> - **L0 (Not Introduced)**: Unaware or untouched.
> - **L1 (Familiarity)**: Surface definitions & buzzwords only.
> - **L2 (Conceptual Understanding)**: Can explain mechanics from first principles.
> - **L3 (Implementation)**: Can write working code / configure it in projects.
> - **L4 (Production Engineering)**: Deep grasp of failure modes, concurrency, scalability, observability & edge cases.
> - **L5 (Architecture)**: Can design complete systems, evaluate trade-offs & defend choices.
> - **L6 (Technical Leadership)**: Sets org standards, reviews architecture, leads incidents & writes ADRs.

---

## 📊 Complete Skill Matrix

| Domain | Sub-Topic | Current Level | Target Level (1–2 Yrs) | Priority | Status |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Backend & Web Security** | SQL Injection, Parameterization, ORM risks | **L2** | **L5** | P0 | Needs drill on raw queries vs knex/prisma vs dynamic filters |
| | CORS, CSRF, XSS, SSRF & DNS Security | **L2** | **L5** | P0 | Preflight requests, origin headers, internal VPC SSRF vectors |
| | Password Hashing (Argon2id vs bcrypt) | **L3** | **L5** | P1 | Salt, pepper, CPU/Memory work factors, rainbow tables |
| | Tokens, JWTs & Session Lifecycle | **L3** | **L5** | P0 | RS256/Asymmetric vs HS256, Refresh Token Rotation, JWKS, Revocation |
| | RBAC, ABAC & Multi-tenant Authorization | **L2** | **L5** | P0 | Role vs permission tables, row-level security (RLS), tenant isolation |
| **AI Systems Security** | Prompt Injection (Direct & Indirect) | **L2** | **L5** | P1 | System prompt separation, delimiters, data exfiltration attacks |
| | PII Masking, Jailbreak & Guardrails | **L2** | **L5** | P1 | NeMo Guardrails, Llama Guard, regex/NER anonymization |
| **SQL Mastery** | Joins (INNER, LEFT, RIGHT, FULL, CROSS, SELF)| **L2** | **L5** | P0 | Join algorithms (Hash vs Nested Loop vs Merge Join) |
| | Filtering & Aggregates (WHERE vs HAVING) | **L2** | **L5** | P0 | Order of execution (FROM → WHERE → GROUP BY → HAVING → SELECT) |
| | Subqueries & CTEs (`WITH ... AS`) | **L2** | **L5** | P0 | Correlated vs non-correlated subqueries, Recursive CTEs |
| | Window Functions (`ROW_NUMBER`, `RANK`, `LEAD`)| **L2** | **L5** | P0 | `OVER (PARTITION BY ... ORDER BY ...)` pagination & running totals |
| | Stored Procedures, Functions & Triggers | **L2** | **L5** | P1 | PL/pgSQL, side effects, audit triggers vs application-level |
| | Views & Materialized Views | **L2** | **L5** | P1 | Refresh strategies (`REFRESH MATERIALIZED VIEW CONCURRENTLY`) |
| **Database Internals** | B-Trees, Composite & Covering Indexes | **L2** | **L5** | P0 | Index selectivity, EXPLAIN ANALYZE interpretation |
| | Transactions, ACID & MVCC | **L2** | **L5** | P0 | Read Committed vs Repeatable Read vs Serializable |
| | Concurrency & Locking (`FOR UPDATE` vs OCC) | **L2** | **L5** | P0 | Deadlock prevention, lock wait timeouts |
| **Redis** | Data Structures (Sorted Sets, Streams) | **L3** | **L5** | P1 | Sliding window rate limiters, stream consumers |
| | Distributed Locks & Race Conditions | **L2** | **L5** | P0 | Redlock edge cases, TTL expiration mid-execution |
| **Distributed Systems** | SQS & Message Queues | **L3** | **L5** | P0 | Visibility timeout, at-least-once deduplication, DLQ replay |
| | Outbox Pattern & Dual-Write Mitigation | **L2** | **L5** | P0 | Atomic DB commit + asynchronous message dispatch |
| **AI & Agents** | LangGraph State Persistence & Checkpoints | **L3** | **L5** | P0 | Cyclic graph limits, PostgreSQL state saving |
| | Scaled RAG (1M+ Documents) | **L2** | **L5** | P1 | Chunking, HNSW vector search, Hybrid BM25, Reranking |
| **Production Engineering**| Structured Logging & OpenTelemetry | **L3** | **L5** | P1 | Correlation IDs across HTTP, SQS, Workers |
| **Tech Leadership** | ADRs, RFCs & Architecture Defense | **L2** | **L6** | P1 | Trade-off documentation, business alignment, cost estimation |
