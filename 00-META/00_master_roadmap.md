# TECH LEAD JOURNEY — MASTER ROADMAP & CONTEXT

> **Quick Resume Anchor**:
> Whenever starting a fresh chat or resuming after a break, say:
> **`"Load Tech Lead Mentor Context from TECH-LEAD-JOURNEY docs. Let's continue."`**

---

## 🎯 Profile Objective
> **Backend + AI Systems Architect / Product Tech Lead (1–2 Years)**
> From 2 YoE hands-on developer to technical owner capable of architecting, building, securing, and scaling distributed backend systems, AI pipelines, databases, and engineering teams.

---

## 🧭 Expanded Master Curriculum

```text
TECH-LEAD-JOURNEY/
├── 00-META/
│   ├── README.md                      # Index & operating manual
│   ├── career-goal.md                 # Target profile & milestones
│   ├── current-level.md               # Live evaluation & maturity ratings
│   ├── skill-matrix.md                # L0–L6 tracking table across all tracks
│   ├── current-priorities.md          # Active learning queue (P0, P1, P2)
│   ├── context-vault-guide.md         # Guide on file locations and how to inspect
│   └── roadmap.md                     # Phase 1 to Phase 6 progression
│
├── 01-FOUNDATIONS/
│   ├── 01-programming/                # JS/TS internals, V8 Engine, Event loop phases, Libuv, Memory & GC
│   ├── 02-computer-science/           # Processes, Threads, Concurrency, Mutexes, OS, TCP/TLS sockets
│   └── 03-web-networking/             # HTTP/1.1, HTTP/2, HTTP/3, DNS resolution, TLS 1.3 handshake, CORS, WebSockets, SSE
│
├── 02-SECURITY-BACKEND-AND-AI/        # [NEW CORE TRACK]
│   ├── 01-web-and-api-security/       # CORS, CSRF, XSS, SSRF, SQL Injection, Replay Attacks, Rate Limiting
│   ├── 02-auth-and-cryptography/      # Password hashing (Argon2id, bcrypt), Salt/Pepper, Secrets management
│   ├── 03-tokens-and-sessions/        # JWT (HMAC vs RS256/Asymmetric), Token revocation, Refresh token rotation, JWKS
│   ├── 04-access-control-models/      # RBAC, ABAC, Application-level permissions, Multi-tenant data isolation
│   └── 05-ai-systems-security/        # Prompt injection (direct/indirect), Data exfiltration, PII masking, Jailbreak defense, Guardrails
│
├── 03-SQL-MASTERY/                    # [NEW DEEP DIVE TRACK]
│   ├── 01-fundamentals-and-crud/      # DDL, DML, Constraints (PK, FK, UNIQUE, CHECK), Cascades, Upserts (ON CONFLICT)
│   ├── 02-filtering-and-aggregation/  # WHERE vs HAVING, GROUP BY, DISTINCT, Aggregate functions (SUM, AVG, COUNT, MIN, MAX)
│   ├── 03-joins-mastery/              # INNER, LEFT, RIGHT, FULL OUTER, CROSS, SELF joins, Join algorithms (Hash vs Nested Loop vs Merge)
│   ├── 04-subqueries-and-ctes/        # Scalar subqueries, Correlated subqueries, Common Table Expressions (`WITH ... AS`, Recursive CTEs)
│   ├── 05-window-functions/           # ROW_NUMBER(), RANK(), DENSE_RANK(), NTILE(), LAG(), LEAD(), Cumulative SUM/AVG OVER (PARTITION BY ... ORDER BY)
│   ├── 06-programmable-sql/           # Stored Procedures, User-Defined Functions (UDFs), Triggers, Views, Materialized Views
│   └── 07-performance-and-internals/  # EXPLAIN ANALYZE, Query execution plans, Index usage, Buffer cache hit ratio
│
├── 04-DATABASE-INTERNALS/
│   ├── 01-relational-internals/       # B-Tree vs LSM-Tree, Page storage, WAL (Write-Ahead Log)
│   ├── 02-indexing/                   # Clustered, Non-clustered, Composite, Covering indexes
│   ├── 03-transactions-and-acid/      # Atomicity, Consistency, Isolation, Durability
│   ├── 04-isolation-levels/           # Read Uncommitted, Read Committed, Repeatable Read, Serializable
│   ├── 05-concurrency-control/        # MVCC, Pessimistic Locking (`FOR UPDATE`), Optimistic Locking (`version` check)
│   ├── 06-scaling-and-sharding/       # Read replicas, Replication lag, Sharding, Consistent hashing
│   └── 07-nosql-engines/              # DynamoDB (Single Table Design), MongoDB, TimescaleDB
│
├── 05-REDIS/
│   ├── 01-internals/                  # Single-threaded event loop, In-memory memory allocator (jemalloc)
│   ├── 02-data-structures/            # Strings, Hashes, Sets, Sorted Sets, HyperLogLog, Streams
│   ├── 03-persistence-replication/    # RDB vs AOF, Sentinel failover, Redis Cluster hash slots
│   ├── 04-distributed-patterns/       # Redlock vs Single-instance locks, Token bucket rate limiting, Deduplication
│   └── 05-failure-modes/              # Cache stampede, Thundering herd, Eviction policies (LRU/LFU), OOM
│
├── 06-DISTRIBUTED-SYSTEMS/
│   ├── 01-core-metrics/               # Latency (p99/p99.9), Throughput (RPS), Availability (99.99%), CAP/PACELC
│   ├── 02-message-brokers/            # SQS (Visibility timeout, DLQ) vs Kafka (Partitions, Consumer Groups, Offsets)
│   ├── 03-reliability-patterns/       # Circuit breaker, Exponential backoff with jitter, Dead Letter Queue
│   ├── 04-distributed-consistency/    # Dual-write problem, Outbox pattern, 2PC, Eventual consistency
│   └── 05-caching-strategies/         # Cache-Aside, Write-Through, Write-Behind, Invalidation
│
├── 07-LLD/
│   ├── 01-oop-and-solid/              # Single Responsibility, Open-Closed, Liskov, ISP, Dependency Inversion
│   ├── 02-design-patterns/            # Factory, Strategy, Observer, Decorator, Adapter, Command
│   └── 03-clean-architecture/         # Domain-Driven Design (DDD), Hexagonal architecture, Repository & Unit of Work
│
├── 08-HLD/
│   ├── 01-social-publishing-platform/ # High-throughput feed, rate limiting, distributed scheduling
│   ├── 02-payment-wallet-system/      # Strict double-entry ledger, idempotency, Stripe webhooks
│   ├── 03-distributed-media-pipeline/ # Asynchronous video transcoding, HLS packaging, S3 + CloudFront CDN
│   ├── 04-realtime-chat-websocket/    # Connection state management, Redis Pub/Sub backplane, Horizontal scaling
│   └── 05-enterprise-rag-platform/    # 1M+ document ingestion, Hybrid search, Reranker, Tenant isolation
│
├── 09-AWS/
│   ├── 01-compute/                    # Lambda vs ECS/Fargate (Container lifecycle)
│   ├── 02-storage-cdn/                # S3 (Multipart upload, lifecycle), CloudFront (Cache behaviors, Edge lambdas)
│   ├── 03-messaging-eventing/         # SQS (Standard vs FIFO), SNS (Fan-out), EventBridge
│   ├── 04-databases-cache/            # RDS Aurora (Multi-AZ, Read Replicas), DynamoDB, ElastiCache
│   └── 05-networking-security/        # VPC, Subnets (Public/Private), NAT Gateway, Security Groups, IAM Roles & Policies
│
├── 10-AI/
│   ├── 01-fundamentals/               # Attention mechanism, Transformer architecture, Tokenization, Embedding spaces
│   ├── 02-llm-mechanics/              # Context window limits, Temperature, Top-p, Structured outputs (JSON Schema)
│   ├── 03-rag-architecture/           # Chunking strategies, Vector DBs (pgvector/Pinecone/Milvus), HNSW, BM25 Hybrid, Reranking
│   ├── 04-agentic-systems/            # State machines, LangGraph cyclic graphs, Human-in-the-loop, Checkpointing
│   └── 05-production-ai-engineering/  # Model routing, Semantic caching, Token cost optimization, Ragas evaluation
│
├── 11-COMPUTER-VISION/                # OpenCV, FFmpeg, HLS, Bitrate optimization, Transcoding
├── 12-PRODUCTION-ENGINEERING/         # Structured JSON logging, Correlation IDs, OpenTelemetry, Grafana/Loki, SLOs
├── 13-PRODUCT-ENGINEERING/            # PRD translation, Trade-off analysis (Latency vs Cost), Build vs Buy
├── 14-TECH-LEADERSHIP/                # Architecture Decision Records (ADRs), High-signal Code Reviews, Mentoring
└── 15-REVIEWS-AND-TRACKING/           # Daily drills, weekly audits, monthly career reviews
```
