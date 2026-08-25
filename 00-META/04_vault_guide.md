# WHERE AND HOW YOUR CONTEXT VAULT IS STORED

This document explains the physical location, structure, file naming standards, and access methods for your entire learning knowledge vault.

---

## 📍 1. Vault Directory Location & Structure

Your persistent learning documents are stored locally in your workspace at:

```text
/Users/flixstock/Desktop/personal project/learn/
```

### 📂 Directory Architecture
```text
├── 00-META/                           # Master roadmaps, skill matrix, session rules
├── 01-FOUNDATIONS-AND-DATABASE/       # SQL, MongoDB, Indexing, Concurrency, Locking
├── 02-SECURITY-BACKEND-AND-AI/        # Auth, JWT, RBAC, Web & AI security drills
├── 03-DISTRIBUTED-SYSTEMS-AND-QUEUES/ # Kafka, SQS, Idempotency, Outbox, Distributed locks
├── 04-AI-AND-AGENTS/                  # LangGraph, RAG, Evals, Latency & Cost guardrails
├── 05-AWS-AND-INFRASTRUCTURE/         # VPC, ECS, Lambda, CloudFront, S3
├── 06-LLD-AND-CLEAN-ARCHITECTURE/     # OOP, Design patterns, Refactoring, Clean code
├── 07-HLD-AND-PRODUCT-ARCHITECTURE/   # End-to-end System Designs, Trade-offs
├── 08-INTERVIEWS-AND-REVIEWS/         # Mock interview scorecards, Retrospectives
├── viewer/                            # Standalone Web Dashboard (Runs on port 3333)
└── scratch/                           # Practice code and temporary test scripts
```

---

## 🏷️ 2. File Naming Standard

To ensure clean chronological and numbered sorting across all subfolders and future nested directories:

1. **Top-level Meta Files**: `00_master_roadmap.md`, `01_skill_matrix.md`, `02_learning_queue.md`, etc.
2. **Topic & Lesson Files**: `TOPIC_01_2026-08-25_sql_window_functions_and_concurrency.md`
   - Format: `TOPIC_<NUMBER>_<YYYY-MM-DD>_<snake_case_topic_title>.md`
3. **Drills & Exercises**: `DRILL_01_2026-08-25_<title>.md` or `code/` subfolders.

---

## 🌐 3. Interactive Web Viewer Dashboard

A dedicated standalone web application is running locally to let you browse and read all markdown and code files with rich styling, syntax highlighting, and Mermaid diagrams:

* **URL**: [http://localhost:3333](http://localhost:3333)
* **To start manually anytime**:
  ```bash
  cd "/Users/flixstock/Desktop/personal project/learn/viewer" && node server.js
  ```
* **Features**:
  - 📂 **Recursive Tree View**: Supports nested directories of any depth.
  - 🔍 **Fuzzy Search & Filter**: Rapidly search across all topics.
  - 🎨 **Syntax Highlighting & Copy Buttons**: For SQL, TypeScript, Mongo, Python, Bash, and JSON.
  - 🔄 **Auto Tree Sync**: Click 🔄 to reload new topics dynamically without restarting.

---

## 🔄 4. How to Resume Context in Any Session

Whenever you open a new conversation or want to pick up right where we left off, simply send:

> **`"Load Tech Lead Mentor Context from TECH-LEAD-JOURNEY docs. Let's continue."`**

