# ACTIVE LEARNING QUEUE & PRIORITY DRILLS

> **Theme**: Systems Architecture & Backend Runtime Foundations: From Domain Modeling to OS Execution, Advanced Concurrency, and Distributed Processing.  
> **Target Progression**: SDE-1 $\rightarrow$ Strong SDE-2 $\rightarrow$ Senior Backend Engineer / Tech Lead.  
> **Core Rule**: Master plan remains the long-term anchor. This priority queue governs all active learning, interactive drills, and vault topic documents for the coming months before moving to AI systems.

---

## 🧭 Active Learning Order & Flow

```text
                    BACKEND ENGINEERING MASTER PRIORITY
                              │
                              ▼
                    ┌──────────────────┐
                    │ 1. OOP           │
                    │ Classes/Objects  │
                    │ 4 Principles     │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ 2. SOLID         │
                    │ Design Principles │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ 3. Design        │
                    │ Patterns         │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ 4. LLD           │
                    │ Backend Modeling │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ 5. DB Design     │
                    │ SQL + NoSQL      │
                    └────────┬─────────┘
                             ↓
              ┌──────────────┴──────────────┐
              ↓                             ↓
      ┌─────────────────┐          ┌─────────────────┐
      │ 6. OS           │          │ 7. Networking   │
      │ Process/Thread  │          │ TCP/HTTP/DNS    │
      │ Memory/CPU/I/O  │          │ TLS             │
      └────────┬────────┘          └────────┬────────┘
               └──────────────┬────────────┘
                              ↓
                    ┌──────────────────┐
                    │ 8. Concurrency   │
                    │ Locks/CAS        │
                    │ Deadlocks        │
                    │ Thread Pools     │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ 9. Runtime       │
                    │ JVM/Node/Python  │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ 10. Backend      │
                    │ Production       │
                    │ Caching/Workers  │
                    │ Observability    │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ 11. HLD          │
                    │ Distributed      │
                    │ Systems          │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ 12. Tech Lead    │
                    │ Architecture +   │
                    │ Tradeoffs        │
                    └──────────────────┘
```

---

## 🎯 The 10-Step First-Principles Teaching & Drill Format

Every topic must strictly follow this 10-step mechanical breakdown rather than theoretical definitions:

1. **Problem**: Why can bugs/failures happen? (e.g., Why can two threads corrupt shared state?)
2. **Mechanical Explanation**: What actually happens inside the CPU, registers, memory bus, and kernel?
3. **Primitive**: What does the language/system primitive actually do?
4. **Code**: Practical code examples in Node.js / Java / Python.
5. **Failure**: What happens if we misuse it or miss edge cases?
6. **Production Scenario**: Real-world high-scale outage / concurrency scenario (e.g., two workers updating the same wallet).
7. **Alternative**: Comparative evaluation (CAS vs Mutex vs DB Transaction vs Optimistic Locking vs Queue).
8. **Decision Tree**: When should a Senior/Tech Lead choose which approach?
9. **Interactive Interview / LLD Drill**: Problem scenario given to user to design/solve interactively.
10. **Vault Documentation**: Comprehensive markdown document saved to the vault upon explicit request.

---

## 🧱 STAGE 1: LLD & SOFTWARE DESIGN (P0 CURRENT FOCUS)

### Part 1: OOP From First Principles
- **Object-Oriented Thinking**: Object, Class, State, Behavior, Identity, Responsibility, Collaboration, Relationships, Message passing, Composition, Aggregation, Association.
  - *Core Question for every class*: *"What responsibility does this object own?"*
- **Encapsulation & State Invariants**:
  - Data hiding vs Behavioral encapsulation vs State protection.
  - Invariants & Mutable vs Immutable objects.
  - Why getters/setters are an anti-pattern (Anemic Domain Models vs Rich Domain Models).
  - "Tell, Don't Ask" principle & Law of Demeter.
  - Detecting bad state mutations (`order.status = "PAID"`) $\rightarrow$ Rich models (`order.markAsPaid()`).
- **Abstraction**:
  - Stable contracts, API boundaries, Domain abstractions vs Infrastructure abstractions.
  - Exposing behavior while completely isolating underlying data representation.
- **Inheritance & Its Perils**:
  - IS-A vs HAS-A relationship, Base/Abstract classes, Method overriding vs overloading.
  - Fragile Base-Class Problem & deep inheritance coupling.
  - When inheritance is justified vs when composition is superior.
- **Polymorphism in Production**:
  - Runtime vs Compile-time polymorphism, Dynamic dispatch, Interface polymorphism.
  - Replacing branching conditionals (`switch(type)` / `if(role)`) with Polymorphic Strategy & Factory patterns.

### Part 2: Object Relationships & Domain Modeling
- Association, Aggregation, Composition, Dependency, Cardinality, Ownership, and Lifecycle dependencies (e.g. `Order` $\rightarrow$ `OrderItems` vs `Payment`).

### Part 3: SOLID Principles Deep Dive
- **S (Single Responsibility)**: Class/Module/Service responsibility, God classes/services, Step-by-step splitting of monolithic classes.
- **O (Open/Closed)**: Extension without modification via Strategy, Factory, Plugin architectures, and configuration-driven design.
- **L (Liskov Substitution)**: Behavioral substitutability, Preconditions, Postconditions, Class invariants, Subtyping pitfalls.
- **I (Interface Segregation)**: Role-based interfaces over fat generic interfaces.
- **D (Dependency Inversion)**: High-level business logic depending on Domain Ports, Infrastructure as Adapters. Dependency Injection vs Inversion of Control (IoC).

### Part 4: General Design Principles
- DRY, KISS, YAGNI, Separation of Concerns, Principle of Least Knowledge, Favor Composition Over Inheritance, Program to an Interface, Principle of Least Surprise, Convention Over Configuration, Make Illegal States Unrepresentable, Fail Fast, Explicit Over Implicit, Locality of Behavior, Immutability, Idempotency.

### Part 5: Design Patterns as Problem-Solving Tools
- **Creational**: Factory Method, Abstract Factory, Builder, Prototype, Singleton (and why it is often problematic).
- **Structural**: Adapter, Decorator, Facade, Proxy, Composite, Bridge.
- **Behavioral**: Strategy, Observer, Command, State, Chain of Responsibility, Template Method, Iterator, Mediator.
- **Pattern Detection Trees**: Identifying exactly which pattern to choose based on structural bottlenecks.

### Part 6: LLD System Modeling (Step-by-Step Entity $\rightarrow$ State $\rightarrow$ Concurrency)
- **Beginner**: Parking Lot, Library, ATM, Elevator, Tic-Tac-Toe, Chess, Vending Machine.
- **Backend-Oriented**: Payment System, Notification System, File Storage System, Media Processing System, Email System, Coupon Engine, Subscription Billing, Credit/Wallet Ledger, Order Processing Engine, Job Scheduler, Distributed Rate Limiter, In-Memory Multi-level Cache, Resilient API Client with Retries.

### Part 7: Database Design as Part of LLD
- **Relational (SQL)**: Normalization/Denormalization, Primary/Foreign/Unique/Check constraints, B-Tree vs Composite vs Covering indexes, Query execution plans (`EXPLAIN ANALYZE`), Joins algorithms.
- **Transactions & ACID**: Atomicity, Consistency, Isolation, Durability, Isolation levels (`Read Committed`, `Repeatable Read`, `Serializable`), Anomalies (Dirty, Non-repeatable, Phantom reads, Lost updates), Row vs Table locking, Optimistic vs Pessimistic locking, Deadlocks.
- **NoSQL (Document/Key-Value)**: Embedding vs Referencing, Single Table Design, Atomic updates, WiredTiger/MongoDB internals, Aggregations.

---

## ⚙️ STAGE 2: COMPUTER SYSTEM + BACKEND RUNTIME

### Part 8: Computer Basics & Memory Topology
- CPU, Cores, Registers, Machine Code, Kernel Space vs User Space, System Calls.
- The path of code execution: `App Code` $\rightarrow$ `Runtime` $\rightarrow$ `System Call` $\rightarrow$ `Kernel` $\rightarrow$ `Hardware (CPU/RAM/Disk/NIC)`.

### Part 9: Process & Thread Mechanics
- Process address space: Text (Code), Data, BSS, Heap, Stack, Program Counter (PC), File Descriptors.
- Process lifecycle: `fork`, `exec`, `wait`, `exit`.
- Threads: User vs Kernel threads, Thread stacks, Thread-local storage, Shared heap, CPU scheduling.
- Context Switching Mechanics: Register saving, TLB flushing, Kernel mode transitions, Thread limits.

### Part 10: Memory Management & Debugging
- Stack overflow vs Heap OutOfMemory (OOM).
- Memory fragmentation, Memory leaks, GC pressure, Object allocation rates, Dangling references.
- Production Heap profiling: Heap dumps, Retaining objects, Reference chains, Lifecycle fixing.

### Part 11: CPU Caches & Hardware Realities
- L1, L2, L3 caches, Cache Lines (64 bytes), Cache locality (Spatial & Temporal), Cache misses.
- Cache Coherence Protocols (MESI) and False Sharing.
- Concurrency (Structure/Interleaving) vs Parallelism (Multi-core execution), Amdahl's Law, Gustafson's Law.

### Part 12: I/O Models & The C10K Problem
- Blocking I/O (BIO) vs Non-Blocking I/O (NIO) vs Asynchronous I/O (AIO).
- Kernel buffers, Sockets, and File Descriptors.
- I/O Multiplexing: `select`, `poll`, `epoll` (Linux) / `kqueue` (macOS).
- Thread-per-connection vs Event-driven reactive architectures (Nginx, Node.js, Netty).

---

## 🔀 STAGE 3: CONCURRENCY & MULTITHREADING

### Part 13: Concurrency Bugs & Race Conditions
- Critical sections, Lost updates, Dirty reads in memory, Check-then-act, Read-modify-write.
- Memory Visibility, Compiler/CPU instruction reordering, Memory barriers/fences, Happens-Before relationships, `volatile`.
- Deadlocks (Coffman 4 conditions), Livelocks, Thread Starvation, Priority Inversion.

### Part 14: Synchronization Primitives
- Mutexes, Monitors, `synchronized`, `ReentrantLock`, `ReentrantReadWriteLock` (95% Read / 5% Write optimization), Semaphores, Condition variables (`wait`/`notify`/`await`/`signal`).
- Lock-Free & Optimistic Concurrency: Hardware CAS (`Compare-And-Swap`), Atomic primitives (`AtomicInteger`, `AtomicReference`), ABA problem.
- Thread-safe data structures under the hood (e.g. `ConcurrentHashMap` bucket-level locking & CAS).

### Part 15: Production Thread Pool Engineering
- Thread Pool Internals: Core threads, Max threads, Keep-alive, Work queues (Bounded, Unbounded, `SynchronousQueue`).
- Rejection policies: `Abort`, `Discard`, `DiscardOldest`, `CallerRuns`.
- Pool Sizing Equation: $N_{\text{threads}} = N_{\text{CPU}} \times (1 + \frac{W}{C})$.
- Failure modes: Pool exhaustion, Queue explosion, Nested task deadlocks, CPU vs I/O saturation.

### Part 16: Language Runtime Internals
- **JVM**: JIT compiler, Platform threads (1:1 OS) vs Virtual Threads (Project Loom $M:N$ user-mode threads), Carrier thread unmounting on blocking I/O.
- **Node.js**: V8 + Libuv 6 event loop phases, Call stack, Microtasks (`process.nextTick`, Promises) vs Macrotasks, Libuv threadpool (`UV_THREADPOOL_SIZE`), `worker_threads`.
- **Python (CPython)**: Global Interpreter Lock (GIL), Threading vs Multiprocessing (IPC) vs `asyncio` coroutines.

---

## 🚀 STAGE 4: PRODUCTION BACKEND ENGINEERING

### Part 17: Networking & API Design
- TCP/UDP, DNS, HTTP/1.1 vs HTTP/2 vs HTTP/3, TLS 1.3 handshake, Connection pooling, Keep-alive, Timeouts.
- RESTful modeling, Idempotency keys, Pagination (Cursor vs Offset), Request/Response contracts, Error modeling.

### Part 18: Database Internals & Caching
- B-Tree vs LSM-Tree, WAL (Write-Ahead Log), Buffer pool, MVCC, Index lookup mechanics.
- Cache patterns: Cache-Aside, Read-Through, Write-Through, Write-Behind, TTL, Eviction (LRU/LFU).
- Cache Stampede, Cache Penetration, Cache Avalanche, Distributed Locks via Redis.

### Part 19: Background Workers & Failure Handling
- Worker processes, Job lifecycles, Visibility timeouts, Poison message handling, Dead Letter Queues (DLQ).
- The Tech Lead Failure Checklist:
  - What if DB succeeds but API crashes?
  - What if worker crashes halfway?
  - What if Redis disappears or network times out?
  - What if a duplicate webhook arrives concurrently?

### Part 20: Observability & Production Testing
- Structured logging, OpenTelemetry traces, Metrics (P50, P95, P99, Throughput, Error Rate, Saturation).
- Concurrency testing, Load testing, Chaos/Failure testing, Integration & Contract tests.

---

## 🌐 STAGE 5: HLD & DISTRIBUTED SYSTEMS

### Part 21: Distributed Foundations & Messaging
- Network partitions, Partial failures, Latency, CAP & PACELC theorems, Distributed clocks, Eventual consistency.
- Message Queues (SQS, RabbitMQ - Push model) vs Event Streaming (Kafka - Pull model, Partitioning, Consumer Groups, Commit Log, Offset management).
- At-least-once, At-most-once, Exactly-once processing guarantees.

### Part 22: Distributed Data & Transactions
- Replication (Leader/Follower, Quorum), Sharding, Consistent Hashing, Hot Partitions.
- Distributed Transactions: 2PC, Saga Pattern (Choreography vs Orchestration), Transactional Outbox & Inbox Patterns.

### Part 23: Scalability, Reliability & Security
- Vertical vs Horizontal scaling, Stateless services, CDN Edge caching, Database Read Replicas.
- Resilience: Circuit Breaker, Exponential Backoff with Jitter, Bulkhead, Rate Limiting, Load Shedding.
- Backend Security: OAuth2, JWT & Refresh Token Rotation, RBAC/ABAC, Secrets Management, SQLi/SSRF/CSRF protection.
