import { QuestionResponse } from "../services/questionProvider";

export const localQuestions: (Omit<QuestionResponse, "id"> & { category: string })[] = [
  {
    type: "Code",
    category: "Backend",
    questionText: "### Distributed API Rate Limiting\n\nDesign and implement a scalable, thread-safe rate limiter. You must allow a maximum of `limit` requests per `window_size` seconds per `user_id`.\n\nImplement the `isAllowed(user_id, timestamp)` function. It should return `true` if the request is allowed, or `false` if it is dropped.\n\n**Constraints:**\n- `1 <= total requests <= 10^5`\n- `1 <= limit <= 1000`\n- `1 <= window_size <= 3600` (in seconds)",
    starterCode: `// C++
/*
#include <iostream>
#include <unordered_map>
using namespace std;

class RateLimiter {
public:
    RateLimiter(int limit, int window_size) {}
    bool isAllowed(int user_id, int timestamp) {
        // Implement logic
        return true;
    }
};
*/

# Python
class RateLimiter:
    def __init__(self, limit: int, window_size: int):
        pass

    def is_allowed(self, user_id: int, timestamp: int) -> bool:
        pass`,
    testCases: [
      { input: 'limit=2, window=10, reqs=[(1,1), (1,5), (1,10), (1,12)]', expectedOutput: '[true, true, false, true]' },
      { input: 'limit=1, window=5, reqs=[(2,1), (2,6), (2,7)]', expectedOutput: '[true, true, false]' },
      { input: 'limit=5, window=60, reqs=[(1,1), (1,2), (1,3), (1,4), (1,5), (1,6)]', expectedOutput: '[true, true, true, true, true, false]' }
    ],
    constraints: ["O(1) time complexity per request", "O(U * L) space complexity where U is users, L is limit"]
  },
  {
    type: "Code",
    category: "Machine Learning",
    questionText: "### Tensor Shape Manipulation (Self-Attention)\n\nImplement the core tensor reshaping logic for a Multi-Head Attention block. Given an input tensor `X` of shape `[batch_size, seq_len, d_model]` and `num_heads`, reshape it into `[batch_size, num_heads, seq_len, d_k]` where `d_k = d_model // num_heads`.\n\nReturn the flattened dimensions of the resulting tensor to verify correctness. If `d_model` is not divisible by `num_heads`, return `[-1]`.",
    starterCode: `// C++
/*
#include <vector>
using namespace std;

vector<int> reshapeAttention(vector<int> X_shape, int num_heads) {
    // Return resulting dimensions
    return {};
}
*/

# Python
def reshape_attention(X_shape: list, num_heads: int) -> list:
    batch_size, seq_len, d_model = X_shape
    # Implement derivation
    pass`,
    testCases: [
      { input: 'X_shape=[32, 512, 768], num_heads=12', expectedOutput: '[32, 12, 512, 64]' },
      { input: 'X_shape=[16, 128, 512], num_heads=8', expectedOutput: '[16, 8, 128, 64]' },
      { input: 'X_shape=[8, 64, 100], num_heads=3', expectedOutput: '[-1]' }
    ],
    constraints: ["Return [-1] if indivisible.", "Must reflect standard PyTorch/TensorFlow head splitting."]
  },
  {
    type: "Code",
    category: "DSA",
    questionText: "### Alien Dictionary (Topological Sort)\n\nThere is a new alien language that uses the English alphabet. However, the order among the letters is unknown to you.\n\nYou are given a list of strings `words` from the alien language's dictionary, where the strings in `words` are **sorted lexicographically** by the rules of this new language.\n\nReturn a string of the unique letters in the new alien language sorted in **lexicographically increasing order** by the new language's rules. If there is no valid ordering, return `\"\"`.",
    starterCode: `// C++
/*
#include <string>
#include <vector>
using namespace std;

string alienOrder(vector<string>& words) {
    // Implement Topological Sort
    return "";
}
*/

# Python
def alien_order(words: list[str]) -> str:
    # Build graph and traverse
    pass`,
    testCases: [
      { input: '["wrt","wrf","er","ett","rftt"]', expectedOutput: '"wertf"' },
      { input: '["z","x"]', expectedOutput: '"zx"' },
      { input: '["z","x","z"]', expectedOutput: '""' }
    ],
    constraints: ["1 <= words.length <= 100", "1 <= words[i].length <= 100", "Contains only lowercase English letters"]
  },
  {
    type: "Code",
    category: "DSA",
    questionText: "### Optimal Network Routing (Dijkstra + DP)\n\nYou are given a network of `n` servers labeled `0` to `n-1`, connected by `edges` where `edges[i] = [u, v, latency, packet_loss_prob]`. \n\nFind the path from server `0` to server `n-1` that minimizes the total latency. If there are multiple paths with the exact same minimum latency, choose the one that minimizes the total accumulated packet loss probability.\n\nReturn the optimal packet loss probability (as a float, 2 decimal places). If no path exists, return `-1.00`.",
    starterCode: `// C++
/*
#include <vector>
using namespace std;

double optimalRouting(int n, vector<vector<double>>& edges) {
    // Implement
    return -1.0;
}
*/

# Python
def optimal_routing(n: int, edges: list[list[float]]) -> float:
    pass`,
    testCases: [
      { input: 'n=3, edges=[[0,1,10,0.1], [1,2,10,0.1], [0,2,20,0.5]]', expectedOutput: '"0.20"' },
      { input: 'n=4, edges=[[0,1,5,0.2], [1,3,10,0.2], [0,2,5,0.1], [2,3,10,0.1]]', expectedOutput: '"0.20"' },
      { input: 'n=2, edges=[]', expectedOutput: '"-1.00"' }
    ],
    constraints: ["1 <= n <= 1000", "0 <= edges.length <= 10000", "0 <= latency <= 100", "0.0 <= packet_loss <= 1.0"]
  },
  {
    type: "Theory",
    category: "Backend",
    questionText: "### Idempotent Post-Checkout Processing\n\nExplain how you would architect a payment processing webhook receiver to guarantee idempotency in a distributed environment.\n\nYour solution must handle:\n1. Duplicate webhook deliveries from Stripe.\n2. Concurrent requests for the same transaction.\n3. Handling database transaction failures midway.\n\nDiscuss the specific database locking mechanisms and caching layers you would use.",
    starterCode: `/*
Write your architectural reasoning here.
Focus on:
1. Idempotency Keys
2. Distributed Locks / Redis
3. Database ACID properties
*/`,
    testCases: [],
    constraints: ["Provide system-level design reasoning", "Address exactly the 3 core requirements"]
  }
];
