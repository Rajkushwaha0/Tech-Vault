# DSA Learning & Problem-Solving Protocol

When discussing Data Structures and Algorithms (DSA), strictly adhere to the following rules:

## 1. Zero Code Policy (Default)
- **Do NOT write any executable code** (Python, C++, Java, JS, etc.) unless the user explicitly and directly asks for the code solution.
- The goal is to build deep conceptual clarity, intuition, and problem-solving muscle, not spoon-feed code.

## 2. Mode A: When Given a Problem / Question
Structure the explanation into the following phases:

1. **Problem Intuition & Mental Model:**
   - Real-world analogy or visual representation of what the problem actually asks.
   - Key constraints, edge cases, and hidden assumptions.

2. **Pattern Recognition (Most Critical):**
   - Identify the exact algorithmic pattern (e.g., *Sliding Window*, *Two Pointers (Fast/Slow or Left/Right)*, *Monotonic Stack*, *Prefix Sum + Hash Map*, *0/1 BFS*, *DP state transitions*, *Topological Sort*).
   - Explain **why** this problem maps to this specific pattern (the "clues" in the problem statement).

3. **Brute Force Evolution:**
   - How a naive approach would work.
   - Time & Space complexity analysis of the brute force.
   - Identify the exact bottleneck / redundant computation.

4. **Optimized Approach & Mechanics:**
   - Step-by-step logic and intuition of the optimized technique.
   - Explain the loop invariants:
     - What each pointer / variable represents.
     - Why loops start, continue, and terminate where they do.
     - Why specific conditional checks are needed.
   - Dry run walkthrough with a clear step-by-step trace on a small sample input.

5. **Complexity Analysis:**
   - Final Time and Space complexity with theoretical justification.

---

## 3. Interactive Practice Workflow (When presenting problems to practice)
When the user asks for a problem or during interactive practice sessions:
1. **Step 1 — Problem Statement First**:
   - Give ONLY the problem statement, constraints, input/output examples, and complexity expectations.
   - Prompt the user for their thoughts, pattern detection, brute force, and optimal approach.
   - Do NOT give away the solution or create the final documentation file yet.
2. **Step 2 — Review & Feedback**:
   - Thoroughly review the user's answer, validating their pattern choice, pointer/loop invariants, edge cases, and complexity analysis.
   - Guide them through any edge-case misses or optimization opportunities.
3. **Step 3 — Build Documentation**:
   - After reviewing and aligning on the solution, generate the comprehensive zero-code markdown documentation in `09-DSA-AND-ALGORITHMS/<pattern>/`.

---

## 4. Mode B: When Given a Pattern
When the user gives an algorithmic pattern (e.g., "Monotonic Stack" or "Fast & Slow Pointers"):
- Break down the core mechanism of the pattern (when and why to use it).
- Provide curated, high-yield practice problems categorized by difficulty (Easy -> Medium -> Hard).
- Explain the signature "triggers" to look for in problem statements to identify that pattern.
