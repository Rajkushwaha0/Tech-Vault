# 🧩 PROBLEM 01: MINIMUM SIZE SUBARRAY SUM (VARIABLE SLIDING WINDOW)

**Date:** 2026-08-25  
**Track:** 09-DSA-AND-ALGORITHMS / 01-sliding-window  
**Pattern:** Variable Size Sliding Window (Two Pointers - Monotonic Property)  
**Difficulty:** Medium (Core Interview Standard)  
**Strict Policy:** Zero Executable Code (Mental Model & Mechanics Only)

---

## 📋 Problem Statement
Given an array of positive integers `nums` and a positive integer `target`, find the **minimal length of a contiguous subarray** of which the sum is greater than or equal to `target`. If there is no such subarray, return `0`.

### Example
```text
Input: target = 7, nums = [2, 3, 1, 2, 4, 3]
Output: 2
Explanation: The subarray [4, 3] has the minimal length (2) with sum = 7 >= 7.
```

---

## 🎯 1. Pattern Recognition & Trigger Clues

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PATTERN DETECTION TRIGGER                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. "Contiguous Subarray"      -> Sliding Window or Prefix Sum               │
│ 2. "All Positive Integers"    -> Monotonic expansion (Adding elements ONLY  │
│                                  increases sum; removing elements ONLY      │
│                                  decreases sum)                             │
│ 3. "Minimal Length"           -> Variable size dynamic window               │
└─────────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Why Fixed Window FAILS here:**
> We do NOT know the size of the subarray beforehand (it could be 1 element like `[8]` or all $N$ elements). Hence, the window size must expand and contract dynamically.

---

## 🐢 2. Brute Force Evolution

### Naive Approach ($O(N^2)$)
1. Generate every possible subarray `(i, j)`.
2. Compute the sum from index `i` to `j`.
3. If `sum >= target`, record length `(j - i + 1)` and update the minimum length.

```text
i=0: [2], [2,3], [2,3,1], [2,3,1,2] (sum=8 >= 7, len=4)
i=1: [3], [3,1], [3,1,2], [3,1,2,4] (sum=10 >= 7, len=4)
i=2: [1], [1,2], [1,2,4] (sum=7 >= 7, len=3)
...
```

### The Bottleneck:
- Subarrays are re-evaluated from scratch repeatedly.
- When we find that `[2, 3, 1, 2]` satisfies the target, restarting the whole calculation at index 1 is redundant. We can simply **subtract the leftmost element (`2`)** and check if the remaining window `[3, 1, 2]` is still valid.

---

## ⚡ 3. Optimal Thought Process & Mechanics

### Pointer Roles & State Variables:
* `left` (or `start`): Left boundary of the current active window.
* `right` (or `end`): Right boundary being expanded across the array.
* `current_sum`: Running sum of elements currently inside the window `[left ... right]`.
* `min_len`: Tracks the smallest valid window length found so far (initialized to $\infty$).

---

### 🔄 The Two Operational Phases

```
   Phase 1: EXPAND (Right Pointer moves)
   Keep adding nums[right] to current_sum until current_sum >= target.

   Phase 2: SHRINK (Left Pointer moves incrementally)
   While current_sum >= target:
     a) Update min_len = min(min_len, right - left + 1)
     b) Subtract nums[left] from current_sum
     c) left = left + 1 (contract window)
```

> [!CAUTION]
> **Common Trap / Bug:**  
> Never jump `left` directly to `right` when a valid window is found! You must shrink `left` **one element at a time in a `while` loop** to discover shorter valid sub-windows embedded inside.

---

## 🔍 4. Step-by-Step Dry Run Trace

**Input:** `target = 7`, `nums = [2, 3, 1, 2, 4, 3]`

| Step | `right` | `nums[right]` | Window Elements | `current_sum` | `current_sum >= 7`? | Action / `min_len` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 0 | 2 | `[2]` | 2 | ❌ No | Expand `right` |
| 2 | 1 | 3 | `[2, 3]` | 5 | ❌ No | Expand `right` |
| 3 | 2 | 1 | `[2, 3, 1]` | 6 | ❌ No | Expand `right` |
| 4 | 3 | 2 | `[2, 3, 1, 2]` | **8** | ✅ **Yes** | `min_len = min(∞, 4) = 4`<br>Shrink: subtract `2`, `left` $\rightarrow$ 1 |
| 5 | 3 | — | `[3, 1, 2]` | 6 | ❌ No | Stop shrinking. Expand `right` |
| 6 | 4 | 4 | `[3, 1, 2, 4]` | **10** | ✅ **Yes** | `min_len = min(4, 4) = 4`<br>Shrink: subtract `3`, `left` $\rightarrow$ 2 |
| 7 | 4 | — | `[1, 2, 4]` | **7** | ✅ **Yes** | `min_len = min(4, 3) = 3`<br>Shrink: subtract `1`, `left` $\rightarrow$ 3 |
| 8 | 4 | — | `[2, 4]` | 6 | ❌ No | Stop shrinking. Expand `right` |
| 9 | 5 | 3 | `[2, 4, 3]` | **9** | ✅ **Yes** | `min_len = min(3, 3) = 3`<br>Shrink: subtract `2`, `left` $\rightarrow$ 4 |
| 10 | 5 | — | `[4, 3]` | **7** | ✅ **Yes** | `min_len = min(3, 2) = 2`<br>Shrink: subtract `4`, `left` $\rightarrow$ 5 |
| 11 | 5 | — | `[3]` | 3 | ❌ No | Array ended. |

**Final Result:** `min_len = 2` (corresponding to subarray `[4, 3]`).

---

## ⏱️ 5. Complexity Analysis

* **Time Complexity: $O(N)$**  
  Although there is a nested `while` loop inside the outer `for` loop, each element is visited at most **twice** (once when added by `right`, and once when removed by `left`).  
  Total pointer movements $\le 2N \rightarrow O(N)$.

* **Space Complexity: $O(1)$**  
  Only four scalar variables (`left`, `right`, `current_sum`, `min_len`) are maintained in memory.

---

## 💡 Key Interview Takeaway
Whenever you see **"contiguous subarray + all positive numbers + minimize/maximize window size"**, the default mental model should always be **Two-Pointer Variable Sliding Window with incremental `while` shrinkage**.
