# 🧩 PROBLEM 02: MAX CONSECUTIVE ONES III (VARIABLE SLIDING WINDOW — MAXIMIZING)

**Date:** 2026-08-29  
**Track:** 09-DSA-AND-ALGORITHMS / 01-sliding-window  
**Pattern:** Variable Size Sliding Window (Maximizing Window Length with Constraint Counter)  
**Difficulty:** Medium (LeetCode 1004 / Core FAANG Standard)  
**Strict Policy:** Zero Executable Code (Mental Model & Mechanics Only)

---

## 🏛️ Real-World Scenario & Production Context

### The Situation
You are engineering the ingestion pipeline for a low-latency live video streaming client (e.g., Twitch, YouTube Live, Zoom). 
- Network packet frames stream in continuously. An intact packet frame is denoted as `1`, while a dropped, corrupted, or missing packet frame is denoted as `0`.
- The video player features an active hardware Error-Concealment Decoder capable of interpolating at most **`k` corrupted packet frames (`0`s)** in a contiguous sequence before playback stutters or drops frames.
- **The Engineering Goal:** Given the raw bitstream and decoder budget `k`, calculate the **maximum length of seamless, continuous video playback** achievable before stalling.

---

## 📋 Problem Statement

Given a binary array `nums` (consisting only of `0`s and `1`s) and an integer `k`, return the **maximum number of consecutive `1`s** in the array if you can flip at most `k` `0`s to `1`s.

### Examples

#### Example 1:
```text
Input: nums = [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], k = 2
Output: 6
Explanation: Flipping the zeros at index 5 and index 10 (or indices 4 and 5) produces a contiguous segment of six 1s: [1, 1, 1, 1, 1, 1].
```

#### Example 2:
```text
Input: nums = [0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1], k = 3
Output: 10
Explanation: Flipping 3 zeros (indices 5, 9, and either 4 or 12) yields 10 consecutive 1s.
```

---

## 🎯 1. Pattern Recognition & Trigger Clues

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PATTERN DETECTION TRIGGER                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. "Contiguous Subarray"          ──► Sliding Window / Two Pointers         │
│ 2. "At most K flips of 0 to 1"    ──► Reframe: "Longest subarray with       │
│                                       at most K zeros"                      │
│ 3. "Maximum length"               ──► Variable-size window (Greedy expand,  │
│                                       contract only when invalid)           │
└─────────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **The Key Mathematical Reframe:**
> Rather than thinking about "flipping bits" (modifying data), reframe the problem as:
> **"Find the longest contiguous subarray `[left ... right]` that contains at most `k` zeros."**
> This instantly maps the problem onto the classic Variable Sliding Window paradigm!

---

## 🐢 2. Brute Force Evolution

### Naive Approach ($O(N^2)$)
1. Iterate over every possible starting index `i` from $0$ to $N - 1$.
2. Expand a pointer `j` from `i` to $N - 1$, keeping a running count of zeros encountered.
3. If the count of zeros exceeds `k`, break and start over at `i + 1`.
4. Update `max_len = max(max_len, j - i + 1)`.

### The Bottleneck:
When a window `[i ... j]` violates the constraint (`zeros > k`), resetting `j` back to `i + 1` discards all valid subarray state already inspected. We do not need to restart from scratch; we only need to advance the `left` boundary forward until one zero falls outside the window.

---

## ⚡ 3. Optimal Thought Process & Mechanics

### Pointer Roles & State Variables:
* `left`: Left boundary of the current contiguous playback window.
* `right`: Right boundary expanding forward across the packet bitstream.
* `zero_count`: Tracks the count of `0`s currently inside `[left ... right]`.
* `max_len`: Tracks the longest valid window length found so far.

---

### 🔄 The Two Operational Phases

```
   Phase 1: EXPAND (Right Pointer moves forward)
   For each right from 0 to N-1:
     If nums[right] == 0:
       Increment zero_count by 1

   Phase 2: CONTRACT (Left Pointer moves incrementally)
   While zero_count > k:
     If nums[left] == 0:
       Decrement zero_count by 1
     Advance left by 1

   Phase 3: RECORD
   At this point, window [left ... right] is guaranteed valid (zero_count <= k).
   max_len = max(max_len, right - left + 1)
```

> [!CAUTION]
> **Common Trap / Bug:**  
> Do not jump `left` arbitrarily. Only decrement `zero_count` when the element being ejected from `left` is actually a `0`. If `nums[left]` was a `1`, `zero_count` remains unchanged as `left` advances.

---

## 🔍 4. Step-by-Step Dry Run Trace

**Input:** `nums = [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0]`, `k = 2`

| Step | `right` | `nums[right]` | `zero_count` | `zero_count > 2`? | Action / Shrinkage | Valid Window | `max_len` |
| :---: | :---: | :---: | :---: | :---: | :--- | :---: | :---: |
| 1 | 0 | 1 | 0 | ❌ No | Valid | `[1]` (len 1) | 1 |
| 2 | 1 | 1 | 0 | ❌ No | Valid | `[1, 1]` (len 2) | 2 |
| 3 | 2 | 1 | 0 | ❌ No | Valid | `[1, 1, 1]` (len 3) | 3 |
| 4 | 3 | 0 | 1 | ❌ No | Valid | `[1, 1, 1, 0]` (len 4) | 4 |
| 5 | 4 | 0 | 2 | ❌ No | Valid (budget exhausted) | `[1, 1, 1, 0, 0]` (len 5) | 5 |
| 6 | 5 | 0 | **3** | ✅ **Yes** | **Violation!** Shrink `left`:<br>- `nums[0]=1` $\rightarrow$ `left=1`<br>- `nums[1]=1` $\rightarrow$ `left=2`<br>- `nums[2]=1` $\rightarrow$ `left=3`<br>- `nums[3]=0` $\rightarrow$ `zero_count=2`, `left=4` | `[0, 0]` (indices 4..5) | 5 |
| 7 | 6 | 1 | 2 | ❌ No | Valid | `[0, 0, 1]` (len 3) | 5 |
| 8 | 7 | 1 | 2 | ❌ No | Valid | `[0, 0, 1, 1]` (len 4) | 5 |
| 9 | 8 | 1 | 2 | ❌ No | Valid | `[0, 0, 1, 1, 1]` (len 5) | 5 |
| 10 | 9 | 1 | 2 | ❌ No | Valid | `[0, 0, 1, 1, 1, 1]` (len 6) | **6** |
| 11 | 10 | 0 | **3** | ✅ **Yes** | **Violation!** Shrink `left`:<br>- `nums[4]=0` $\rightarrow$ `zero_count=2`, `left=5` | `[0, 1, 1, 1, 1, 0]` (len 6) | 6 |

**Final Result:** `max_len = 6` (achieved across indices `4` through `9`).

---

## ⏱️ 5. Complexity Analysis

- **Time Complexity: $O(N)$**  
  Although there is a nested `while` loop to shrink `left`, each pointer (`left` and `right`) travels from $0$ to $N - 1$ at most once.  
  Total pointer movements $\le 2N$, resulting in strict $O(N)$ linear runtime.

- **Space Complexity: $O(1)$**  
  Only scalar primitive variables (`left`, `right`, `zero_count`, `max_len`) are used. No auxiliary arrays, sets, or hash maps are required.

---

## 💡 Key Interview Takeaway
Whenever an interview question asks for **"max consecutive elements after at most $K$ changes/flips"**, never actually simulate changes in the array. **Reframe the problem as finding the longest contiguous window containing at most $K$ non-target elements**.
