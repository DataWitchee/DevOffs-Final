// Curated local question bank — 20 real DSA problems with proper stdin/stdout test cases
// StarterCode is SCAFFOLDING ONLY — no solution logic, just input/output setup

export const localQuestions = [
  // ─── ARRAYS ──────────────────────────────────────────────────────────────
  {
    id: "OFFLINE-2000",
    type: "Code",
    category: "DSA",
    questionText: "Two Sum\n\nGiven an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target.\n\nConstraints:\n- Each input has exactly one solution\n- You may not use the same element twice\n- Output the two indices in ascending order separated by a space",
    starterCode: `#include <iostream>
#include <vector>
using namespace std;

void twoSum(vector<int>& nums, int target) {
    // Your solution here
    // Print the two indices separated by a space
}`,
    driverCode: `int main() {
    int n, target;
    if (!(cin >> n >> target)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    twoSum(nums, target);
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
using namespace std;

int maxSubArray(vector<int>& nums) {
    // Your solution here
    return 0;
}`,
    driverCode: `int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    cout << maxSubArray(nums) << endl;
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
    questionText: "Valid Parentheses\n\nGiven a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if open brackets are closed in the correct order.\n\nPrint 'true' or 'false'.",
    starterCode: `#include <iostream>
#include <string>
using namespace std;

bool isValid(string s) {
    // Your solution here
    return false;
}`,
    driverCode: `int main() {
    string s;
    if (cin >> s) {
        cout << (isValid(s) ? "true" : "false") << endl;
    }
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
    questionText: "Binary Search\n\nGiven an array of integers nums sorted in ascending order and an integer target, return the index if found, or -1 if not found.\n\nYou must write an algorithm with O(log N) runtime complexity.",
    starterCode: `#include <iostream>
#include <vector>
using namespace std;

int binarySearch(vector<int>& nums, int target) {
    // Your solution here
    return -1;
}`,
    driverCode: `int main() {
    int n, target;
    if (!(cin >> n >> target)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    cout << binarySearch(nums, target) << endl;
    return 0;
}`,
    testCases: [
      { input: "6 9\n-1 0 3 5 9 12", expectedOutput: "4" },
      { input: "6 2\n-1 0 3 5 9 12", expectedOutput: "-1" },
      { input: "1 5\n5", expectedOutput: "0" }
    ],
    constraints: ["O(log N) time", "O(1) space"]
  },

  {
    id: "OFFLINE-2004",
    type: "Code",
    category: "DSA",
    questionText: "Merge Two Sorted Arrays\n\nGiven two integer arrays sorted in non-decreasing order, merge them into one sorted array and print all elements separated by spaces.\n\nInput: First line has m and n. Second line has m numbers. Third line has n numbers.",
    starterCode: `#include <iostream>
#include <vector>
using namespace std;

void mergeArrays(vector<int>& a, vector<int>& b) {
    // Your solution here: merge and print sorted elements separated by space
}`,
    driverCode: `int main() {
    int m, n;
    if (!(cin >> m >> n)) return 0;
    vector<int> a(m), b(n);
    for (int i = 0; i < m; i++) cin >> a[i];
    for (int i = 0; i < n; i++) cin >> b[i];
    mergeArrays(a, b);
    return 0;
}`,
    testCases: [
      { input: "3 3\n1 2 3\n2 5 6", expectedOutput: "1 2 2 3 5 6" },
      { input: "1 1\n2\n1", expectedOutput: "1 2" },
      { input: "3 0\n1 2 3\n", expectedOutput: "1 2 3" }
    ],
    constraints: ["O(m+n) time", "O(1) extra space optimal"]
  },

  // ─── STRINGS ─────────────────────────────────────────────────────────────
  {
    id: "OFFLINE-2005",
    type: "Code",
    category: "DSA",
    questionText: "Reverse a String\n\nWrite a function that reverses a string and prints the result.\n\nExample:\nInput: hello\nOutput: olleh",
    starterCode: `#include <iostream>
#include <string>
using namespace std;

string reverseString(string s) {
    // Your solution here
    return "";
}`,
    driverCode: `int main() {
    string s;
    if (cin >> s) cout << reverseString(s) << endl;
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
    questionText: "Check Palindrome\n\nGiven a string s, print 'true' if it is a palindrome, or 'false' otherwise.\n\nA string is a palindrome if it reads the same forwards and backwards.",
    starterCode: `#include <iostream>
#include <string>
using namespace std;

bool isPalindrome(string s) {
    // Your solution here
    return false;
}`,
    driverCode: `int main() {
    string s;
    if (cin >> s) cout << (isPalindrome(s) ? "true" : "false") << endl;
    return 0;
}`,
    testCases: [
      { input: "racecar", expectedOutput: "true" },
      { input: "hello", expectedOutput: "false" },
      { input: "abcba", expectedOutput: "true" }
    ],
    constraints: ["O(N) time", "O(1) space"]
  },

  {
    id: "OFFLINE-2007",
    type: "Code",
    category: "DSA",
    questionText: "Count Vowels\n\nGiven a string, count and print the number of vowels (a, e, i, o, u — case insensitive) in it.",
    starterCode: `#include <iostream>
#include <string>
using namespace std;

int countVowels(string s) {
    // Your solution here
    return 0;
}`,
    driverCode: `int main() {
    string s;
    if (cin >> s) cout << countVowels(s) << endl;
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
    questionText: "Fibonacci Number\n\nGiven an integer n, print the nth Fibonacci number.\n\nF(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2)\n\nConstraints: 0 <= n <= 30",
    starterCode: `#include <iostream>
using namespace std;

int fibonacci(int n) {
    // Your solution here
    return 0;
}`,
    driverCode: `int main() {
    int n;
    if (cin >> n) cout << fibonacci(n) << endl;
    return 0;
}`,
    testCases: [
      { input: "4", expectedOutput: "3" },
      { input: "10", expectedOutput: "55" },
      { input: "0", expectedOutput: "0" }
    ],
    constraints: ["O(N) iterative", "O(1) space"]
  },

  {
    id: "OFFLINE-2009",
    type: "Code",
    category: "DSA",
    questionText: "FizzBuzz\n\nGiven an integer n, print numbers from 1 to n.\n- For multiples of 3 print 'Fizz'\n- For multiples of 5 print 'Buzz'\n- For multiples of both print 'FizzBuzz'\n- Otherwise print the number\n\nEach value on a new line.",
    starterCode: `#include <iostream>
using namespace std;

void fizzBuzz(int n) {
    // Your solution here
    // Print each value on a new line
}`,
    driverCode: `int main() {
    int n;
    if (cin >> n) fizzBuzz(n);
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
    id: "OFFLINE-2010",
    type: "Code",
    category: "DSA",
    questionText: "Sort an Array\n\nGiven an array of integers, sort it in ascending order and print the sorted array (space-separated).\n\nInput: First line is n, second line has n integers.",
    starterCode: `#include <iostream>
#include <vector>
using namespace std;

void sortArray(vector<int>& nums) {
    // Your solution here
    // Print the sorted array (space-separated)
}`,
    driverCode: `int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    sortArray(nums);
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
    id: "OFFLINE-2011",
    type: "Code",
    category: "DSA",
    questionText: "Find Kth Largest Element\n\nGiven an integer array nums and an integer k, print the kth largest element.\n\nInput: First line has n and k. Second line has n integers.",
    starterCode: `#include <iostream>
#include <vector>
using namespace std;

int findKthLargest(vector<int>& nums, int k) {
    // Your solution here
    return 0;
}`,
    driverCode: `int main() {
    int n, k;
    if (!(cin >> n >> k)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    cout << findKthLargest(nums, k) << endl;
    return 0;
}`,
    testCases: [
      { input: "6 2\n3 2 1 5 6 4", expectedOutput: "5" },
      { input: "4 4\n3 2 3 1", expectedOutput: "1" },
      { input: "5 1\n5 4 3 2 1", expectedOutput: "5" }
    ],
    constraints: ["O(N log N) with sort, O(N) with quickselect"]
  },

  // ─── LINKED LISTS ──────────────────────────────────────────────────────────
  {
    id: "OFFLINE-2012",
    type: "Code",
    category: "DSA",
    questionText: "Reverse a Linked List\n\nGiven a sequence of integers representing a linked list, reverse it and print the reversed sequence space-separated.\n\nInput: First line has n, second line has the values.",
    starterCode: `#include <iostream>
#include <vector>
using namespace std;

void reverseList(vector<int>& vals) {
    // Your solution here. Print reversed values space-separated.
}`,
    driverCode: `int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> vals(n);
    for (int i = 0; i < n; i++) cin >> vals[i];
    reverseList(vals);
    return 0;
}`,
    testCases: [
      { input: "5\n1 2 3 4 5", expectedOutput: "5 4 3 2 1" },
      { input: "2\n1 2", expectedOutput: "2 1" },
      { input: "1\n1", expectedOutput: "1" }
    ],
    constraints: ["O(N) time", "O(1) space with pointer manipulation"]
  },

  // ─── DYNAMIC PROGRAMMING ───────────────────────────────────────────────────
  {
    id: "OFFLINE-2013",
    type: "Code",
    category: "DSA",
    questionText: "Climbing Stairs\n\nYou are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. Print the number of distinct ways you can climb to the top.",
    starterCode: `#include <iostream>
using namespace std;

int climbStairs(int n) {
    // Your solution here
    return 0;
}`,
    driverCode: `int main() {
    int n;
    if (cin >> n) cout << climbStairs(n) << endl;
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
    id: "OFFLINE-2014",
    type: "Code",
    category: "DSA",
    questionText: "Coin Change\n\nGiven coin denominations and a total amount, find the minimum number of coins needed to make up the amount. Print -1 if impossible.\n\nInput: First line has n and amount. Second line has n coin denominations.",
    starterCode: `#include <iostream>
#include <vector>
using namespace std;

int coinChange(vector<int>& coins, int amount) {
    // Your solution here
    return 0;
}`,
    driverCode: `int main() {
    int n, amount;
    if (!(cin >> n >> amount)) return 0;
    vector<int> coins(n);
    for (int i = 0; i < n; i++) cin >> coins[i];
    cout << coinChange(coins, amount) << endl;
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
    id: "OFFLINE-2015",
    type: "Code",
    category: "DSA",
    questionText: "Anagram Check\n\nGiven two strings s and t, print 'true' if t is an anagram of s, 'false' otherwise.\n\nAn anagram uses the exact same characters rearranged.",
    starterCode: `#include <iostream>
#include <string>
using namespace std;

bool isAnagram(string s, string t) {
    // Your solution here
    return false;
}`,
    driverCode: `int main() {
    string s, t;
    if (cin >> s >> t) cout << (isAnagram(s, t) ? "true" : "false") << endl;
    return 0;
}`,
    testCases: [
      { input: "anagram nagaram", expectedOutput: "true" },
      { input: "rat car", expectedOutput: "false" },
      { input: "listen silent", expectedOutput: "true" }
    ],
    constraints: ["O(N log N) with sort, O(N) with hashmap"]
  },

  {
    id: "OFFLINE-2016",
    type: "Code",
    category: "DSA",
    questionText: "First Non-Repeating Character\n\nGiven a string s, find the index of the first non-repeating character. If none exists, print -1.",
    starterCode: `#include <iostream>
#include <string>
using namespace std;

int firstUniqChar(string s) {
    // Your solution here
    return -1;
}`,
    driverCode: `int main() {
    string s;
    if (cin >> s) cout << firstUniqChar(s) << endl;
    return 0;
}`,
    testCases: [
      { input: "leetcode", expectedOutput: "0" },
      { input: "loveleetcode", expectedOutput: "2" },
      { input: "aabb", expectedOutput: "-1" }
    ],
    constraints: ["O(N) time", "O(1) space (26 chars)"]
  },

  {
    id: "OFFLINE-2017",
    type: "Code",
    category: "DSA",
    questionText: "Find Duplicate Number\n\nGiven an array of n+1 integers where each integer is in [1, n], find the one duplicate number.\n\nInput: First line has n. Second line has n+1 integers.",
    starterCode: `#include <iostream>
#include <vector>
using namespace std;

int findDuplicate(vector<int>& nums) {
    // Your solution here
    return 0;
}`,
    driverCode: `int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> nums(n + 1);
    for (int i = 0; i <= n; i++) cin >> nums[i];
    cout << findDuplicate(nums) << endl;
    return 0;
}`,
    testCases: [
      { input: "4\n1 3 4 2 2", expectedOutput: "2" },
      { input: "4\n3 1 3 4 2", expectedOutput: "3" },
      { input: "2\n1 1 2", expectedOutput: "1" }
    ],
    constraints: ["O(N) time", "O(1) extra space preferred (Floyd's cycle)"]
  },

  // ─── GREEDY ───────────────────────────────────────────────────────────────
  {
    id: "OFFLINE-2018",
    type: "Code",
    category: "DSA",
    questionText: "Stock Buy and Sell\n\nYou are given an array where prices[i] is the price of a stock on day i. You want to maximize your profit by choosing one day to buy and a later day to sell. Print the maximum profit. If no profit is possible, print 0.",
    starterCode: `#include <iostream>
#include <vector>
using namespace std;

int maxProfit(vector<int>& prices) {
    // Your solution here
    return 0;
}`,
    driverCode: `int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> prices(n);
    for (int i = 0; i < n; i++) cin >> prices[i];
    cout << maxProfit(prices) << endl;
    return 0;
}`,
    testCases: [
      { input: "6\n7 1 5 3 6 4", expectedOutput: "5" },
      { input: "5\n7 6 4 3 1", expectedOutput: "0" },
      { input: "3\n1 2 3", expectedOutput: "2" }
    ],
    constraints: ["O(N) time", "O(1) space"]
  },

  {
    id: "OFFLINE-2019",
    type: "Code",
    category: "DSA",
    questionText: "Missing Number\n\nGiven an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.\n\nInput: First line has n. Second line has n integers.",
    starterCode: `#include <iostream>
#include <vector>
using namespace std;

int missingNumber(vector<int>& nums) {
    // Your solution here
    return 0;
}`,
    driverCode: `int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    cout << missingNumber(nums) << endl;
    return 0;
}`,
    testCases: [
      { input: "3\n3 0 1", expectedOutput: "2" },
      { input: "1\n0", expectedOutput: "1" },
      { input: "9\n9 6 4 2 3 5 7 0 1", expectedOutput: "8" }
    ],
    constraints: ["O(N) time", "O(1) space using math trick"]
  }
];