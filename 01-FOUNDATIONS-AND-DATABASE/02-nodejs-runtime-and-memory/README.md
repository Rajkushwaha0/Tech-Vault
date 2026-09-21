# Node.js Runtime Internals & Performance

> **Track:** Foundations & Runtime Systems  
> **Target Level:** SDE-2 $\rightarrow$ Senior Engineer / Tech Lead  

This module covers the V8 engine, Libuv 6-phase event loop, stream backpressure, thread pool exhaustion, event loop starvation, and memory profiling.

---

## 🧭 Topic Index

1. [01_nodejs_event_loop_streams_and_backpressure.md](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/02-nodejs-runtime-and-memory/01_nodejs_event_loop_streams_and_backpressure.md)
   - V8 Call Stack vs Libuv Event Loop 6 Phases (`timers`, `poll`, `check`, etc.).
   - Microtasks vs Macrotasks execution ordering.
   - Stream Backpressure (`readable.pipe`, `.write()` returning `false`, `drain` event).
   - Diagnosing memory leaks with heap snapshots.

2. [02_concurrency_vs_parallelism_async_event_loop_starvation.md](file:///Users/flixstock/Desktop/personal%20project/learn/01-FOUNDATIONS-AND-DATABASE/02-nodejs-runtime-and-memory/02_concurrency_vs_parallelism_async_event_loop_starvation.md)
   - Concurrency vs Parallelism in Single-Threaded Event Loop Runtimes.
   - Event Loop Starvation & CPU-bound bottlenecks.
   - Offloading CPU workloads with `worker_threads` and pipelined worker architectures.
