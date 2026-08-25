# 🧩 PROBLEM 01: SEARCH IN ROTATED SORTED ARRAY (MODIFIED BINARY SEARCH)

**Date:** 2026-08-25  
**Track:** 09-DSA-AND-ALGORITHMS / 08-binary-search  
**Pattern:** Modified Binary Search (Invariant Elimination & Sorted Half Detection)  
**Difficulty:** Medium (FAANG Standard Core Problem)  
**Strict Policy:** Zero Executable Code (Mental Model & Mechanics Only)

---

## 📋 Problem Statement
There is an integer array `nums` sorted in ascending order with distinct values. 

Prior to being passed to your function, `nums` is possibly rotated at an unknown pivot index `k` (`1 <= k < nums.length`) such that the resulting array is `[nums[k], nums[k+1], ..., nums[n-1], nums[0], nums[1], ..., nums[k-1]]`.

Given the array `nums` after the possible rotation and an integer `target`, return the **index of `target`** if it is in `nums`, or `-1` if it is not in `nums`.

You must write an algorithm with **$O(\log N)$** runtime complexity.

### Example 1
```text
Input: nums = [4, 5, 6, 7, 0, 1, 2], target = 0
Output: 4
```

### Example 2
```text
Input: nums = [4, 5, 6, 7, 0, 1, 2], target = 3
Output: -1
```

---

## 🎯 1. Pattern Recognition & Trigger Clues

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PATTERN DETECTION TRIGGER                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. "Sorted Array (even if rotated)" -> Logarithmic Search Property          │
│ 2. "Time Complexity O(log N)"       -> Binary Search Variation              │
│ 3. "Distinct Elements"              -> Deterministic Half-Partition Invariant│
└─────────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **The Core Invariant of Rotated Sorted Arrays:**
> If you divide a rotated sorted array at ANY midpoint `mid`, **at least one of the two halves (`[low...mid]` or `[mid...high]`) is ALWAYS strictly sorted in ascending order.**
>
> 1. If `nums[low] <= nums[mid]`, the **left half is strictly sorted**.
> 2. Otherwise (`nums[low] > nums[mid]`), the **right half is strictly sorted**.

---

## 🐢 2. Brute Force vs. Optimal Evolution

### Naive Linear Scan ($O(N)$)
* Scan from index `0` to `N-1`. If `nums[i] == target`, return `i`.
* **Why it fails interview expectations:** Fails the mandatory $O(\log N)$ constraint by ignoring the underlying sorted structure.

### The Bottleneck & Optimization ($O(\log N)$)
* Traditional binary search assumes the entire search space is monotonic.
* Here, monotonicity is broken at the rotation point. However, because **one half is always sorted**, we can check whether `target` falls inside the clean sorted half using simple boundary inequalities:
  $$\text{Is } \text{nums}[\text{low}] \le \text{target} < \text{nums}[\text{mid}] \text{ ?}$$
* If yes $\rightarrow$ search only in the left half (`high = mid - 1`).
* If no $\rightarrow$ discard the left half entirely and search in the right half (`low = mid + 1`).

---

## ⚡ 3. Optimal Thought Process & Mechanics

### Pointer Roles & State Variables:
* `low`: Left boundary of current active search space.
* `high`: Right boundary of current active search space.
* `mid`: Calculated as $\text{low} + \lfloor(\text{high} - \text{low}) / 2\rfloor$ (prevents integer overflow).

---

### 🔄 The Decision Tree at Each Midpoint

```
                                 nums[mid] == target?
                                    /           \
                                 YES             NO
                              [Found!]            |
                                                  v
                                     Is nums[low] <= nums[mid]?
                                    /                          \
                                  YES                           NO
                        (Left Half is Sorted)         (Right Half is Sorted)
                                 |                              |
                Is target in [nums[low], nums[mid])?   Is target in (nums[mid], nums[high]]?
                     /                      \                 /                      \
                   YES                       NO             YES                       NO
           high = mid - 1              low = mid + 1    low = mid + 1            high = mid - 1
```

> [!CAUTION]
> **Common Boundary Trap:**  
> When checking if target lies within the sorted half, make sure to include the outer boundary:
> - Left half sorted: `nums[low] <= target && target < nums[mid]`
> - Right half sorted: `nums[mid] < target && target <= nums[high]`

---

## 🔍 4. Step-by-Step Dry Run Trace

**Input:** `nums = [4, 5, 6, 7, 0, 1, 2]`, `target = 0`

| Step | `low` | `high` | `mid` | `nums[mid]` | Sorted Half Identified | Target within Sorted Half? | Action Taken |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | 0 (`4`) | 6 (`2`) | 3 (`7`) | 7 | **Left** (`4 <= 7` $\rightarrow$ `[4, 5, 6, 7]`) | ❌ No (`0` is not in `[4, 7)`) | Discard Left: `low = mid + 1 = 4` |
| **2** | 4 (`0`) | 6 (`2`) | 5 (`1`) | 1 | **Left** (`0 <= 1` $\rightarrow$ `[0, 1]`) | ✅ Yes (`0` is in `[0, 1)`) | Search Left: `high = mid - 1 = 4` |
| **3** | 4 (`0`) | 4 (`0`) | 4 (`0`) | 0 | `nums[mid] == target` ✅ | Target Matched | **Return index 4** |

---

## ⏱️ 5. Complexity Analysis

* **Time Complexity: $O(\log N)$**  
  Every iteration cuts the search space exactly in half, guaranteeing at most $\lceil \log_2 N \rceil$ comparisons.

* **Space Complexity: $O(1)$**  
  Iterative pointer modification requires zero auxiliary memory or recursion stack frames.

---

## 💡 Key Interview Takeaways
1. **Never search blindly in the unsorted half.** Always identify the sorted half first, test the target against its known range, and decide whether to step inside or discard it.
2. **Rotation Invariant:** A single rotation creates at most two sorted sequences. Any midpoint bisects at least one fully sorted segment.
