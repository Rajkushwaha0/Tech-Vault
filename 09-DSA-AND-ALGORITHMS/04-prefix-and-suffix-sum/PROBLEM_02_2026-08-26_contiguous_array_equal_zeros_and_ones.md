# 🧩 PROBLEM 02: Contiguous Array (Equal 0s and 1s)
**Difficulty:** Medium | **LeetCode:** 525  
**Core Pattern:** Pattern 04 — Prefix Sum + Hash Map (Zero Net Change / Elevation Invariant)

---

## 📋 Problem Statement

Given a binary array `nums` consisting solely of `0`s and `1`s, return the **maximum length** of a contiguous subarray that contains an **equal number of `0`s and `1`s**.

### 🧪 Constraints
- $1 \le \text{nums.length} \le 10^5$
- $\text{nums}[i]$ is either `0` or `1`.
- **Target Time Complexity:** $O(N)$
- **Target Space Complexity:** $O(N)$

---

## 🧭 PART 1: The First-Principles Mental Model

```
                    ┌────────────────────────────────────────────────────────┐
                    │     Find longest subarray with Equal 0s and 1s         │
                    └───────────────────────────┬────────────────────────────┘
                                                │
                                      The Fundamental Shift
                                                │
                                                ▼
                    ┌────────────────────────────────────────────────────────┐
                    │             Transform:  0 ──> -1  |  1 ──> +1          │
                    └───────────────────────────┬────────────────────────────┘
                                                │
                                                ▼
                    ┌────────────────────────────────────────────────────────┐
                    │    "Equal count of 0s & 1s"  ===  "Subarray Sum = 0"   │
                    └────────────────────────────────────────────────────────┘
```

### 1. The Scale-Balancing Insight
If you have three `1`s and three `0`s:
- With original numbers: $1 + 1 + 1 + 0 + 0 + 0 = 3$. The sum doesn't tell you if it's equal (you could have three 1s and zero 0s, which also sums to 3).
- **With transformation ($0 \rightarrow -1, 1 \rightarrow +1$):**
$$(+1) + (+1) + (+1) + (-1) + (-1) + (-1) = \mathbf{0}$$

Now, **every balanced subarray will sum to exactly zero**, and no unbalanced subarray can sum to zero.

---

### 2. The Mountain Hike / Elevation Analogy

Imagine tracking your altitude as you hike across the array index by index:
- Step on `1` $\rightarrow$ climb up $+1$ meter.
- Step on `0` $\rightarrow$ climb down $-1$ meter.

```text
Elevation
   +2 │                /\
   +1 │ ───●──────────/──\──────────●───  <-- Altitude +1 at Index 1 AND Index 7!
    0 │   / \        /    \        /
   -1 │  /   \______/      \______/
      └───────────────────────────────────
         Idx 1                      Idx 7
```

**The Core Invariant:**
- If your altitude at **Index 1** was **$+1$**, and later at **Index 7** your altitude is **still $+1$**:
$$\text{Elevation}(7) - \text{Elevation}(1) = (+1) - (+1) = \mathbf{0}$$
- That means between Index 2 and Index 7, **every step up was canceled by a step down**.
- Therefore, the contiguous slice from **Index 2 to Index 7** has an **exact equal number of 0s and 1s**!
- Length = $\text{Current Index} - \text{Earlier Index} = 7 - 1 = \mathbf{6}$.

---

## 🗄️ PART 2: Hash Map Design & The Crucial Base Case

### 1. What does the Hash Map Store?
To find the **longest** subarray, we want the earliest possible start:
- **Map Key:** `running_sum` (the current elevation).
- **Map Value:** `first_seen_index` (the **very first index** where this elevation was reached).

> [!IMPORTANT]
> **Never overwrite an existing key in the Map!**  
> If an elevation appears again at a later index, keeping the earliest recorded index maximizes the distance:
> $$\text{Length} = \text{current\_index} - \text{map}[\text{running\_sum}]$$

---

### 2. Why is the Base Case `map = { 0: -1 }` Mandatory?

Before you take a single step into the array (at conceptual index $-1$), your elevation is $0$.

**What happens if we omit `map = { 0: -1 }`?**
Consider `nums = [0, 1]` (length 2):
- Index 0: `0` $\rightarrow$ `running_sum = -1`. Store `map[-1] = 0`.
- Index 1: `1` $\rightarrow$ `running_sum = 0`.
  - Is `0` in the map? **No!** So the algorithm would store `map[0] = 1` and report `maxLength = 0` (WRONG! Correct is 2).

**With `map = { 0: -1 }`:**
- At Index 1, `running_sum = 0`.
- `0` is found in the map at index `-1`!
- $\text{Length} = 1 - (-1) = \mathbf{2}$ (Correct!).

---

## 🧪 PART 3: Comprehensive Dry Runs

---

### 🔎 Dry Run 1: The Zigzag Array (Multiple Peaks & Valleys)
**Input:** `nums = [0, 0, 1, 0, 0, 0, 1, 1]`  
**Transformed:** `[-1, -1, +1, -1, -1, -1, +1, +1]`  
**Initialization:** `map = { 0: -1 }`, `running_sum = 0`, `maxLength = 0`

| Index | Value | Step | `running_sum` | Seen in Map? | Action / Calculation | Max Length | Map State After Step |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Start** | - | - | **0** | - | Base case initialization | 0 | `{ 0: -1 }` |
| **0** | `0` | $-1$ | **$-1$** | ❌ No | First time seeing $-1 \to$ save index 0 | 0 | `{ 0: -1, -1: 0 }` |
| **1** | `0` | $-1$ | **$-2$** | ❌ No | First time seeing $-2 \to$ save index 1 | 0 | `{ 0: -1, -1: 0, -2: 1 }` |
| **2** | `1` | $+1$ | **$-1$** | ✅ **YES** (at idx 0) | Subarray `(0..2]` $\to$ len $2 - 0 = \mathbf{2}$ | **2** | Keep earliest idx 0 for $-1$ |
| **3** | `0` | $-1$ | **$-2$** | ✅ **YES** (at idx 1) | Subarray `(1..3]` $\to$ len $3 - 1 = \mathbf{2}$ | **2** | Keep earliest idx 1 for $-2$ |
| **4** | `0` | $-1$ | **$-3$** | ❌ No | First time seeing $-3 \to$ save index 4 | 2 | `..., -3: 4` |
| **5** | `0` | $-1$ | **$-4$** | ❌ No | First time seeing $-4 \to$ save index 5 | 2 | `..., -4: 5` |
| **6** | `1` | $+1$ | **$-3$** | ✅ **YES** (at idx 4) | Subarray `(4..6]` $\to$ len $6 - 4 = \mathbf{2}$ | 2 | Keep earliest idx 4 for $-3$ |
| **7** | `1` | $+1$ | **$-2$** | ✅ **YES** (at idx 1) | Subarray `(1..7]` $\to$ len $7 - 1 = \mathbf{6}$ 🔥 | **6** | Keep earliest idx 1 for $-2$ |

#### Result:
The longest valid window is from index $2 \to 7$: `[1, 0, 0, 0, 1, 1]` with **three 0s and three 1s** $\implies \mathbf{6}$.

---

### 🔎 Dry Run 2: Full-Array Match (Starts at Index 0)
**Input:** `nums = [0, 1, 1, 0, 1, 0]`  
**Transformed:** `[-1, +1, +1, -1, +1, -1]`  
**Initialization:** `map = { 0: -1 }`, `running_sum = 0`, `maxLength = 0`

| Index | Value | Step | `running_sum` | Seen in Map? | Calculation | Max Length | Subarray Discovered |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Start** | - | - | **0** | - | Base case | 0 | - |
| **0** | `0` | $-1$ | **$-1$** | ❌ No | Store `map[-1] = 0` | 0 | - |
| **1** | `1` | $+1$ | **$0$** | ✅ **YES** (at idx `-1`) | $1 - (-1) = \mathbf{2}$ | **2** | `[0, 1]` (indices 0..1) |
| **2** | `1` | $+1$ | **$+1$** | ❌ No | Store `map[+1] = 2` | 2 | - |
| **3** | `0` | $-1$ | **$0$** | ✅ **YES** (at idx `-1`) | $3 - (-1) = \mathbf{4}$ | **4** | `[0, 1, 1, 0]` (indices 0..3) |
| **4** | `1` | $+1$ | **$+1$** | ✅ **YES** (at idx `2`) | $4 - 2 = \mathbf{2}$ | 4 | `[0, 1]` (indices 3..4) |
| **5** | `0` | $-1$ | **$0$** | ✅ **YES** (at idx `-1`) | $5 - (-1) = \mathbf{6}$ 🔥 | **6** | Entire array `[0, 1, 1, 0, 1, 0]` |

#### Result:
The entire array of length **$6$** is completely balanced.

---

### 🔎 Dry Run 3: Monotonic Unbalanced Array (No Valid Subarray)
**Input:** `nums = [1, 1, 1, 1]`  
**Transformed:** `[+1, +1, +1, +1]`  
**Initialization:** `map = { 0: -1 }`, `running_sum = 0`, `maxLength = 0`

| Index | Value | Step | `running_sum` | Seen in Map? | Action | Max Length |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Start** | - | - | **0** | - | Base case | 0 |
| **0** | `1` | $+1$ | **$+1$** | ❌ No | Store `map[1] = 0` | 0 |
| **1** | `1` | $+1$ | **$+2$** | ❌ No | Store `map[2] = 1` | 0 |
| **2** | `1` | $+1$ | **$+3$** | ❌ No | Store `map[3] = 2` | 0 |
| **3** | `1` | $+1$ | **$+4$** | ❌ No | Store `map[4] = 3` | 0 |

#### Result:
Elevation strictly ascends. No elevation ever repeats $\implies \mathbf{maxLength = 0}$.

---

## 🛡️ PART 4: Edge Cases & Boundary Handling

1. **Single Element Array (`[0]` or `[1]`):**
   - Cannot form a pair. Loop runs once, sum becomes $-1$ or $+1$, not in map $\implies$ returns `0`.
2. **Alternating Short Array (`[0, 1]` or `[1, 0]`):**
   - Hits `running_sum = 0` at index 1 $\implies 1 - (-1) = 2$. Correctly returns `2`.
3. **Array with Multiple Valid Subarrays of Different Lengths:**
   - Because we **never overwrite** the map value for an existing key, the algorithm greedily measures distance from the *earliest possible occurrence*, guaranteeing maximum length.

---

## ⚡ PART 5: Complexity Analysis

- **Time Complexity:** $\mathcal{O}(N)$
  - Single pass through array of length $N$.
  - Hash Map lookups and insertions are $\mathcal{O}(1)$ average time.
- **Space Complexity:** $\mathcal{O}(N)$
  - In the worst-case (strictly monotonic array), the Hash Map stores up to $N + 1$ unique prefix sum values.
