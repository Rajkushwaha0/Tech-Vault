# 🧩 DSA LEARNING & INTUITION PROTOCOL

This document defines the strict operating standard for all Data Structures & Algorithms (DSA) sessions in your vault.

---

## 🎯 Core Philosophy: "Build the Mental Model, Not Code Muscle Memory"

> [!IMPORTANT]
> **Zero Code Policy by Default!**  
> We do NOT jump straight to code solutions. Real interview mastery and engineering depth come from:
> 1. **Pattern Detection**: Spotting the hidden triggers that tell you which paradigm applies.
> 2. **Intuitive Evolution**: Moving systematically from naive Brute Force $\rightarrow$ identifying bottlenecks $\rightarrow$ crafting the Optimal solution.
> 3. **Mental Walkthrough**: Understanding pointer movement, loop invariants, and termination conditions before writing a single line.

---

## 🕹️ Two Primary DSA Modes

### 1. Mode A: Problem Analysis (When You Provide a Problem)
When you share a question (from LeetCode, Codeforces, or an interview), the response will follow this exact 5-step breakdown:

1. **Problem Intuition & Mental Model:**
   - Plain-English / visual breakdown of what the problem actually asks.
   - Clarifying edge cases, boundary constraints, and implicit constraints.

2. **Pattern Recognition (The Core Step):**
   - Identify the exact algorithmic pattern (*Sliding Window*, *Two Pointers*, *Fast & Slow*, *Monotonic Stack*, *Prefix Sum + Hash Map*, *0/1 BFS*, *Topological Sort*, *DP state transitions*, etc.).
   - **Why this pattern?** What specific keywords/clues in the problem statement triggered it?

3. **Brute Force Evolution:**
   - The intuitive naive approach.
   - Time & Space complexity of brute force ($O(N^2)$, $O(2^N)$, etc.).
   - Where the redundant work or bottleneck happens.

4. **Optimized Approach & Mechanics:**
   - Step-by-step logic of the optimal solution.
   - Pointer / Variable roles: What each variable holds and why.
   - Loop Invariants: Why loops start, step, and terminate.
   - Conditional Checks: Why specific bounds or conditions are necessary.
   - Step-by-step dry run on a sample test case.

5. **Complexity Justification:**
   - Final Time and Space complexities ($O(N)$, $O(\log N)$, etc.) with mathematical intuition.

---

### 2. Mode B: Interactive Practice & Question Prompts
When you ask for a practice problem on a topic/pattern:
1. **Step 1 (Problem Delivery Only):** Present the problem statement, constraints, examples, and expected complexity targets — without spoiling the solution or creating documentation yet.
2. **Step 2 (Your Input & Review):** You explain your mental model, identify the pattern, outline the brute force vs optimal mechanics, and trace edge cases. I review your answer, critique loop invariants/complexity, and address edge cases.
3. **Step 3 (Vault Documentation):** Once reviewed, the full zero-code structured document is generated in the vault under `09-DSA-AND-ALGORITHMS/`.

---

### 3. Mode C: Pattern Deep Dive (When You Provide a Pattern)
When you give a pattern (e.g., *"Fast & Slow Pointers"* or *"Monotonic Stack"*):
- **Core Mechanism:** How the pattern works conceptually.
- **Trigger Clues:** What keywords in problem descriptions signal this pattern.
- **Curated High-Yield Problem List:**
  - 🟢 **Foundation (Easy):** Baseline understanding.
  - 🟡 **Standard (Medium):** The most common interview variations.
  - 🔴 **Advanced (Hard):** Edge-case heavy or combined patterns.

---

## 📂 Topic Vault Storage
All future DSA topic breakdowns and pattern guides will be stored under:
```text
/Users/flixstock/Desktop/personal project/learn/09-DSA-AND-ALGORITHMS/
```
And viewable directly on your Web Dashboard at [http://localhost:3333](http://localhost:3333).
