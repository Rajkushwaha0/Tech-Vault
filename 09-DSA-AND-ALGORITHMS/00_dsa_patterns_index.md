# 🗺️ MASTER DSA PATTERNS INDEX

A structured reference of the top 20 algorithmic patterns tested in Senior / Tech Lead level technical interviews.

---

| # | Pattern Name | Key Trigger Clues | Typical Data Structures | Time Complexity Target |
| :- | :--- | :--- | :--- | :--- |
| **01** | **Sliding Window** | Contiguous subarrays/substrings, "longest/shortest subarray with sum K" (**strictly non-negative/monotonic**) | Array, String, Hash Map | $O(N)$ |
| **02** | **Two Pointers (Converging)** | Sorted array, pairs matching a target, palindrome check, container with most water | Array, Two index pointers | $O(N)$ |
| **03** | **Fast & Slow Pointers** | Cycle detection, linked list midpoint, happy numbers | Linked List, Cyclic arrays | $O(N)$ |
| **04** | **Prefix Sum + Hash Map** | Subarray sum equals K (with **negative numbers**), count of subarrays with sum % K == 0, Range Sum queries | Array, Hash Map | $O(N)$ |
| **04b** | **Prefix + Suffix (Two Passes)** | Product of array except self, Trapping Rain Water, Find Pivot Index (needs left and right context) | Two auxiliary arrays or running variables | $O(N)$ |
| **04c** | **Kadane's Algorithm (DP)** | **Maximum/Minimum sum** contiguous subarray (resets running sum to 0 when negative) | Running sum, Max sum variables | $O(N)$ |
| **05** | **Monotonic Stack / Queue** | Next greater/smaller element, daily temperatures, stock span, sliding window maximum | Stack, Deque | $O(N)$ |
| **06** | **Top 'K' Elements (Heaps)** | Kth largest/smallest, Top K frequent, stream of data | Min-Heap / Max-Heap | $O(N \log K)$ |
| **07** | **Two Heaps Pattern** | Find median from data stream, sliding window median | Min-Heap + Max-Heap | $O(\log N)$ insert |
| **08** | **Modified Binary Search** | Sorted array, rotated sorted array, search in mountain, matrix search | Array | $O(\log N)$ |
| **09** | **Binary Search on Answer** | Minimize maximum, maximize minimum, capacity to ship packages | Search space range | $O(N \log(\text{range}))$ |
| **10** | **Merge Intervals** | Overlapping time intervals, meeting rooms, insert interval | Array of Pairs | $O(N \log N)$ |
| **11** | **Breadth-First Search (BFS)** | Shortest path in unweighted graphs/grids, level-order traversal | Queue | $O(V + E)$ |
| **12** | **Depth-First Search (DFS / Backtracking)** | Generate all permutations/subsets, path finding, connected components | Recursion / Stack | $O(V + E)$ or $O(2^N)$ |
| **13** | **Topological Sort** | Course schedule, build order, dependency resolution in DAGs | Graph (Adjacency list) + In-degree array / Queue | $O(V + E)$ |
| **14** | **Union-Find (Disjoint Set Union)** | Dynamic connectivity, redundancy in graph, network connected | Parent & Rank arrays | $O(N \cdot \alpha(N)) \approx O(N)$ |
| **15** | **Trie (Prefix Tree)** | Autocomplete, dictionary search, prefix matching, word break | Tree of nodes with character maps | $O(L)$ per word |
| **16** | **Dynamic Programming (1D / 2D)** | Optimization (min/max), counting ways, overlapping subproblems | Array / Matrix / Memoization Map | $O(N)$ to $O(N \cdot M)$ |
| **17** | **0/1 & Unbounded Knapsack** | Subset sum, partition equal subset, coin change | 1D/2D DP table | $O(N \cdot W)$ |
| **18** | **Longest Common Subsequence / Edit Distance** | String matching, transformations, string alignment | 2D DP table | $O(N \cdot M)$ |
| **19** | **Bit Manipulation** | Single number, power of two, bitmasking states in DP | Bitwise XOR, AND, OR, bit shifts | $O(1)$ to $O(N)$ |
| **20** | **Matrix Traversal & 0/1 BFS** | Grid shortest path with 0/1 edge weights | Deque | $O(R \cdot C)$ |
