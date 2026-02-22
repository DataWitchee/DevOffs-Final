// Curated local question bank — 20 real DSA problems with proper stdin/stdout test cases
// StarterCode uses C++ main() with cin/cout for real compilation testing

export const localQuestions = [
  // ─── ARRAYS ──────────────────────────────────────────────────────────────
  {
    id: "OFFLINE-2000",
    type: "Code",
    category: "DSA",
    questionText: "Two Sum\n\nGiven an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target.\n\nConstraints:\n- Each input has exactly one solution\n- You may not use the same element twice\n- Output indices in ascending order separated by a space",
    starterCode: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int main() {
    int n, target;
    cin >> n >> target;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];

    // Your solution here: find two indices that sum to target
    unordered_map<int,int> seen;
    for (int i = 0; i < n; i++) {
        int comp = target - nums[i];
        if (seen.count(comp)) {
            cout << seen[comp] << " " << i << endl;
            return 0;
        }
        seen[nums[i]] = i;
    }
    return 0;
}`,
    testCases: [
      { input: "4 9\n2 7 11 15", expectedOutput: "0 1" },
      { input: "3 6\n3 2 4", expectedOutput: "1 2" },
      { input: "2 6\n3 3", expectedOutput: "0 1" }
    ],
    constraints: ["O(N) time complexity", "O(N) space complexity"]
  },

  {
    id: "OFFLINE-2001",
    type: "Code",
    category: "DSA",
    questionText: "Maximum Subarray (Kadane's Algorithm)\n\nGiven an integer array nums, find the subarray with the largest sum and return its sum.\n\nConstraints:\n- 1 <= nums.length <= 100000\n- -10000 <= nums[i] <= 10000",
    starterCode: `#include <iostream>
#include <vector>
#include <climits>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];

    // Kadane's Algorithm
    int maxSum = INT_MIN, curr = 0;
    for (int x : nums) {
        curr += x;
        maxSum = max(maxSum, curr);
        if (curr < 0) curr = 0;
    }
    cout << maxSum << endl;
    return 0;
}`,
    testCases: [
      { input: "9\n-2 1 -3 4 -1 2 1 -5 4", expectedOutput: "6" },
      { input: "1\n1", expectedOutput: "1" },
      { input: "5\n5 4 -1 7 8", expectedOutput: "23" }
    ],
    constraints: ["O(N) time", "O(1) space"]
  },

  {
    id: "OFFLINE-2002",
    type: "Code",
    category: "DSA",
    questionText: "Valid Parentheses\n\nGiven a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n- Open brackets are closed by the same type of brackets\n- Open brackets are closed in the correct order\n\nPrint 'true' or 'false'.",
    starterCode: `#include <iostream>
#include <stack>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '{' || c == '[') st.push(c);
        else {
            if (st.empty()) { cout << "false" << endl; return 0; }
            char top = st.top(); st.pop();
            if ((c == ')' && top != '(') || (c == '}' && top != '{') || (c == ']' && top != '['))
                { cout << "false" << endl; return 0; }
        }
    }
    cout << (st.empty() ? "true" : "false") << endl;
    return 0;
}`,
    testCases: [
      { input: "()", expectedOutput: "true" },
      { input: "()[]{}", expectedOutput: "true" },
      { input: "(]", expectedOutput: "false" }
    ],
    constraints: ["O(N) time", "O(N) space"]
  },

  {
    id: "OFFLINE-2003",
    type: "Code",
    category: "DSA",
    questionText: "Binary Search\n\nGiven an array of integers nums sorted in ascending order, and an integer target, return the index if target is found, or -1 if not found.\n\nYou must write an algorithm with O(log N) runtime complexity.",
    starterCode: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, target;
    cin >> n >> target;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];

    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] == target) { cout << mid << endl; return 0; }
        else if (nums[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    cout << -1 << endl;
    return 0;
}`,
    testCases: [
      { input: "6 9\n-1 0 3 5 9 12", expectedOutput: "4" },
      { input: "6 2\n-1 0 3 5 9 12", expectedOutput: "-1" },
      { input: "1 0\n5", expectedOutput: "-1" }
    ],
    constraints: ["O(log N) time", "O(1) space"]
  },

  {
    id: "OFFLINE-2004",
    type: "Code",
    category: "DSA",
    questionText: "Merge Sorted Arrays\n\nGiven two integer arrays nums1 and nums2, sorted in non-decreasing order, merge nums2 into nums1 as one sorted array and print the result.\n\nInput: First line has m and n. Second line has m numbers (nums1). Third line has n numbers (nums2).",
    starterCode: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int m, n;
    cin >> m >> n;
    vector<int> nums1(m), nums2(n);
    for (int i = 0; i < m; i++) cin >> nums1[i];
    for (int i = 0; i < n; i++) cin >> nums2[i];

    // Merge and sort
    for (int x : nums2) nums1.push_back(x);
    sort(nums1.begin(), nums1.end());
    for (int i = 0; i < m + n; i++) {
        cout << nums1[i];
        if (i < m + n - 1) cout << " ";
    }
    cout << endl;
    return 0;
}`,
    testCases: [
      { input: "3 3\n1 2 3\n2 5 6", expectedOutput: "1 2 2 3 5 6" },
      { input: "1 1\n2\n1", expectedOutput: "1 2" },
      { input: "0 1\n\n1", expectedOutput: "1" }
    ],
    constraints: ["O((m+n) log(m+n)) time", "O(1) extra space preferred"]
  },

  // ─── STRINGS ─────────────────────────────────────────────────────────────
  {
    id: "OFFLINE-2005",
    type: "Code",
    category: "DSA",
    questionText: "Reverse a String\n\nWrite a function that reverses a string. Print the reversed string.\n\nExample: 'hello' -> 'olleh'",
    starterCode: `#include <iostream>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    string s;
    cin >> s;
    reverse(s.begin(), s.end());
    cout << s << endl;
    return 0;
}`,
    testCases: [
      { input: "hello", expectedOutput: "olleh" },
      { input: "hannah", expectedOutput: "hannah" },
      { input: "OpenAI", expectedOutput: "IAnepO" }
    ],
    constraints: ["O(N) time", "O(1) extra space"]
  },

  {
    id: "OFFLINE-2006",
    type: "Code",
    category: "DSA",
    questionText: "Check Palindrome\n\nGiven a string s, return 'true' if it is a palindrome, or 'false' otherwise.\n\nA string is a palindrome if it reads the same forwards and backwards.",
    starterCode: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    string rev = s;
    reverse(rev.begin(), rev.end());
    cout << (s == rev ? "true" : "false") << endl;
    return 0;
}`,
    testCases: [
      { input: "racecar", expectedOutput: "true" },
      { input: "hello", expectedOutput: "false" },
      { input: "abcba", expectedOutput: "true" }
    ],
    constraints: ["O(N) time", "O(N) space"]
  },

  {
    id: "OFFLINE-2007",
    type: "Code",
    category: "DSA",
    questionText: "Count Vowels\n\nGiven a string, count and print the number of vowels (a, e, i, o, u — case insensitive) in it.",
    starterCode: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    int count = 0;
    string vowels = "aeiouAEIOU";
    for (char c : s)
        if (vowels.find(c) != string::npos) count++;
    cout << count << endl;
    return 0;
}`,
    testCases: [
      { input: "Hello", expectedOutput: "2" },
      { input: "rhythm", expectedOutput: "0" },
      { input: "beautiful", expectedOutput: "5" }
    ],
    constraints: ["O(N) time", "O(1) space"]
  },

  // ─── MATH ─────────────────────────────────────────────────────────────────
  {
    id: "OFFLINE-2008",
    type: "Code",
    category: "DSA",
    questionText: "Fibonacci Number\n\nGiven an integer n, return the nth Fibonacci number.\n\nF(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2)\n\nConstraints: 0 <= n <= 30",
    starterCode: `#include <iostream>
using namespace std;

int fib(int n) {
    if (n <= 1) return n;
    int a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        int c = a + b; a = b; b = c;
    }
    return b;
}

int main() {
    int n;
    cin >> n;
    cout << fib(n) << endl;
    return 0;
}`,
    testCases: [
      { input: "4", expectedOutput: "3" },
      { input: "10", expectedOutput: "55" },
      { input: "0", expectedOutput: "0" }
    ],
    constraints: ["O(N) time", "O(1) space"]
  },

  {
    id: "OFFLINE-2009",
    type: "Code",
    category: "DSA",
    questionText: "Power Function\n\nImplement pow(x, n) which calculates x raised to the power n (i.e., x^n).\n\nInput: two numbers x (float) and n (integer). Print the result with 5 decimal places.\n\nConstraints: -100 <= x <= 100, -10 <= n <= 10",
    starterCode: `#include <iostream>
#include <cmath>
#include <iomanip>
using namespace std;

int main() {
    double x;
    int n;
    cin >> x >> n;
    cout << fixed << setprecision(5) << pow(x, n) << endl;
    return 0;
}`,
    testCases: [
      { input: "2.0 10", expectedOutput: "1024.00000" },
      { input: "2.1 3", expectedOutput: "9.26100" },
      { input: "2.0 -2", expectedOutput: "0.25000" }
    ],
    constraints: ["O(log N) optimal with fast power", "Handle negative exponents"]
  },

  {
    id: "OFFLINE-2010",
    type: "Code",
    category: "DSA",
    questionText: "FizzBuzz\n\nGiven an integer n, print numbers from 1 to n. For multiples of 3 print 'Fizz', for multiples of 5 print 'Buzz', for multiples of both print 'FizzBuzz'. Each value on a new line.",
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    for (int i = 1; i <= n; i++) {
        if (i % 15 == 0) cout << "FizzBuzz";
        else if (i % 3 == 0) cout << "Fizz";
        else if (i % 5 == 0) cout << "Buzz";
        else cout << i;
        cout << "\n";
    }
    return 0;
}`,
    testCases: [
      { input: "3", expectedOutput: "1\n2\nFizz" },
      { input: "5", expectedOutput: "1\n2\nFizz\n4\nBuzz" },
      { input: "15", expectedOutput: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz" }
    ],
    constraints: ["O(N) time", "Classic interview question"]
  },

  // ─── SORTING ───────────────────────────────────────────────────────────────
  {
    id: "OFFLINE-2011",
    type: "Code",
    category: "DSA",
    questionText: "Sort an Array\n\nGiven an array of integers, sort it in ascending order and print the sorted array.\n\nInput: First line is n, second line has n space-separated integers.",
    starterCode: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    sort(nums.begin(), nums.end());
    for (int i = 0; i < n; i++) {
        cout << nums[i];
        if (i < n - 1) cout << " ";
    }
    cout << endl;
    return 0;
}`,
    testCases: [
      { input: "5\n5 2 3 1 4", expectedOutput: "1 2 3 4 5" },
      { input: "3\n3 1 2", expectedOutput: "1 2 3" },
      { input: "4\n-3 0 2 -1", expectedOutput: "-3 -1 0 2" }
    ],
    constraints: ["O(N log N) time", "O(1) extra space"]
  },

  {
    id: "OFFLINE-2012",
    type: "Code",
    category: "DSA",
    questionText: "Find Kth Largest Element\n\nGiven an integer array nums and an integer k, return the kth largest element in the array.\n\nNote: It is the kth largest element in sorted order, not the kth distinct element.",
    starterCode: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n, k;
    cin >> n >> k;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    sort(nums.begin(), nums.end(), greater<int>());
    cout << nums[k - 1] << endl;
    return 0;
}`,
    testCases: [
      { input: "6 2\n3 2 1 5 6 4", expectedOutput: "5" },
      { input: "4 4\n3 2 3 1", expectedOutput: "1" },
      { input: "5 1\n5 4 3 2 1", expectedOutput: "5" }
    ],
    constraints: ["O(N log N) with sort, O(N) with quickselect ideal"]
  },

  // ─── LINKED LISTS ──────────────────────────────────────────────────────────
  {
    id: "OFFLINE-2013",
    type: "Code",
    category: "DSA",
    questionText: "Reverse a Linked List\n\nGiven the head of a singly linked list as a space-separated sequence of integers, reverse the list and print the reversed sequence.\n\nInput: First line has n (length), second line has the values.",
    starterCode: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> vals(n);
    for (int i = 0; i < n; i++) cin >> vals[i];
    for (int i = n - 1; i >= 0; i--) {
        cout << vals[i];
        if (i > 0) cout << " ";
    }
    cout << endl;
    return 0;
}`,
    testCases: [
      { input: "5\n1 2 3 4 5", expectedOutput: "5 4 3 2 1" },
      { input: "2\n1 2", expectedOutput: "2 1" },
      { input: "1\n1", expectedOutput: "1" }
    ],
    constraints: ["O(N) time", "O(1) space with pointer manipulation"]
  },

  // ─── TREES ─────────────────────────────────────────────────────────────────
  {
    id: "OFFLINE-2014",
    type: "Code",
    category: "DSA",
    questionText: "Maximum Depth of Binary Tree (Array-based input)\n\nGiven an array representing a binary tree in level order (with -1 representing null nodes), find the maximum depth.\n\nInput: First line has n, second line has n values (-1 for null).",
    starterCode: `#include <iostream>
#include <vector>
#include <cmath>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> tree(n);
    for (int i = 0; i < n; i++) cin >> tree[i];

    if (n == 0 || tree[0] == -1) { cout << 0 << endl; return 0; }

    // Calculate max depth from level-order array
    int depth = 0, level_size = 1, idx = 0;
    while (idx < n) {
        bool has_node = false;
        for (int i = 0; i < level_size && idx < n; i++, idx++)
            if (tree[idx] != -1) has_node = true;
        if (has_node) depth++;
        level_size *= 2;
    }
    cout << depth << endl;
    return 0;
}`,
    testCases: [
      { input: "5\n3 9 20 -1 -1", expectedOutput: "2" },
      { input: "1\n1", expectedOutput: "1" },
      { input: "7\n1 2 3 4 5 -1 -1", expectedOutput: "3" }
    ],
    constraints: ["O(N) time", "O(N) space"]
  },

  // ─── DYNAMIC PROGRAMMING ───────────────────────────────────────────────────
  {
    id: "OFFLINE-2015",
    type: "Code",
    category: "DSA",
    questionText: "Climbing Stairs\n\nYou are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    if (n <= 2) { cout << n << endl; return 0; }
    int a = 1, b = 2;
    for (int i = 3; i <= n; i++) {
        int c = a + b; a = b; b = c;
    }
    cout << b << endl;
    return 0;
}`,
    testCases: [
      { input: "2", expectedOutput: "2" },
      { input: "3", expectedOutput: "3" },
      { input: "10", expectedOutput: "89" }
    ],
    constraints: ["O(N) time", "O(1) space"]
  },

  {
    id: "OFFLINE-2016",
    type: "Code",
    category: "DSA",
    questionText: "Coin Change\n\nGiven an array of coin denominations and a total amount, find the minimum number of coins needed to make up that amount. If impossible, print -1.\n\nInput: First line has n and amount. Second line has n coin denominations.",
    starterCode: `#include <iostream>
#include <vector>
#include <climits>
using namespace std;

int main() {
    int n, amount;
    cin >> n >> amount;
    vector<int> coins(n);
    for (int i = 0; i < n; i++) cin >> coins[i];

    vector<int> dp(amount + 1, INT_MAX);
    dp[0] = 0;
    for (int i = 1; i <= amount; i++)
        for (int c : coins)
            if (c <= i && dp[i - c] != INT_MAX)
                dp[i] = min(dp[i], dp[i - c] + 1);

    cout << (dp[amount] == INT_MAX ? -1 : dp[amount]) << endl;
    return 0;
}`,
    testCases: [
      { input: "3 11\n1 5 6", expectedOutput: "2" },
      { input: "2 3\n2 5", expectedOutput: "-1" },
      { input: "1 0\n1", expectedOutput: "0" }
    ],
    constraints: ["O(amount * n) time", "O(amount) space"]
  },

  // ─── HASHING ────────────────────────────────────────────────────────────────
  {
    id: "OFFLINE-2017",
    type: "Code",
    category: "DSA",
    questionText: "Find Duplicate Number\n\nGiven an array of n+1 integers where each integer is in [1, n], find and print the one duplicate number.\n\nConstraints:\n- Only one number is duplicated\n- Must use O(1) extra space",
    starterCode: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> nums(n + 1);
    for (int i = 0; i <= n; i++) cin >> nums[i];

    // Floyd's cycle detection
    int slow = nums[0], fast = nums[0];
    do { slow = nums[slow]; fast = nums[nums[fast]]; } while (slow != fast);
    slow = nums[0];
    while (slow != fast) { slow = nums[slow]; fast = nums[fast]; }
    cout << fast << endl;
    return 0;
}`,
    testCases: [
      { input: "4\n1 3 4 2 2", expectedOutput: "2" },
      { input: "4\n3 1 3 4 2", expectedOutput: "3" },
      { input: "1\n1 1", expectedOutput: "1" }
    ],
    constraints: ["O(N) time", "O(1) extra space (Floyd's algorithm)"]
  },

  {
    id: "OFFLINE-2018",
    type: "Code",
    category: "DSA",
    questionText: "Anagram Check\n\nGiven two strings s and t, print 'true' if t is an anagram of s, 'false' otherwise.\n\nAn anagram uses exactly the same characters as the original, just rearranged.",
    starterCode: `#include <iostream>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    string s, t;
    cin >> s >> t;
    sort(s.begin(), s.end());
    sort(t.begin(), t.end());
    cout << (s == t ? "true" : "false") << endl;
    return 0;
}`,
    testCases: [
      { input: "anagram nagaram", expectedOutput: "true" },
      { input: "rat car", expectedOutput: "false" },
      { input: "listen silent", expectedOutput: "true" }
    ],
    constraints: ["O(N log N) time with sort, O(N) with hashmap"]
  },

  {
    id: "OFFLINE-2019",
    type: "Code",
    category: "DSA",
    questionText: "First Non-Repeating Character\n\nGiven a string s, find the first non-repeating character in it and return its index. If it does not exist, return -1.",
    starterCode: `#include <iostream>
#include <string>
#include <unordered_map>
using namespace std;

int main() {
    string s;
    cin >> s;
    unordered_map<char, int> freq;
    for (char c : s) freq[c]++;
    for (int i = 0; i < (int)s.size(); i++)
        if (freq[s[i]] == 1) { cout << i << endl; return 0; }
    cout << -1 << endl;
    return 0;
}`,
    testCases: [
      { input: "leetcode", expectedOutput: "0" },
      { input: "loveleetcode", expectedOutput: "2" },
      { input: "aabb", expectedOutput: "-1" }
    ],
    constraints: ["O(N) time", "O(1) space (26 chars max)"]
  }
];