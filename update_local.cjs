const fs = require('fs');

const file = fs.readFileSync('data/LocalQuestionBank.ts', 'utf8');

// The strategy is to parse the LocalQuestionBank, update each object, and write it back.
// Since it's a TS file exporting an array, we can extract the array, modify it, and write it back as a string,
// or we can just use regex replacements to inject driverCode for each specific question.
// Given the file format is very uniform, let's just do text replacement.

let newContent = file;

// 1. Two Sum
newContent = newContent.replace(
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n, target;\n    cin >> n >> target;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n\n    // Your solution here\n\n    return 0;\n}\`,`,
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nvoid twoSum(vector<int>& nums, int target) {\n    // Your solution here\n    // Print the two indices separated by a space\n}\`,
    driverCode: \`int main() {\n    int n, target;\n    if (!(cin >> n >> target)) return 0;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n    twoSum(nums, target);\n    return 0;\n}\`,`
);

// 2. Maximum Subarray
newContent = newContent.replace(
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n\n    // Your solution here\n\n    return 0;\n}\`,`,
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nint maxSubArray(vector<int>& nums) {\n    // Your solution here\n    return 0;\n}\`,
    driverCode: \`int main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n    cout << maxSubArray(nums) << endl;\n    return 0;\n}\`,`
);

// 3. Valid Parentheses
newContent = newContent.replace(
  `    starterCode: \`#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n\n    // Your solution here\n\n    return 0;\n}\`,`,
  `    starterCode: \`#include <iostream>\n#include <string>\nusing namespace std;\n\nbool isValid(string s) {\n    // Your solution here\n    return false;\n}\`,
    driverCode: \`int main() {\n    string s;\n    if (cin >> s) {\n        cout << (isValid(s) ? "true" : "false") << endl;\n    }\n    return 0;\n}\`,`
);

// 4. Binary Search
newContent = newContent.replace(
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n, target;\n    cin >> n >> target;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n\n    // Your solution here\n\n    return 0;\n}\`,`,
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nint binarySearch(vector<int>& nums, int target) {\n    // Your solution here\n    return -1;\n}\`,
    driverCode: \`int main() {\n    int n, target;\n    if (!(cin >> n >> target)) return 0;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n    cout << binarySearch(nums, target) << endl;\n    return 0;\n}\`,`
);

// 5. Merge Two Sorted Arrays
newContent = newContent.replace(
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int m, n;\n    cin >> m >> n;\n    vector<int> a(m), b(n);\n    for (int i = 0; i < m; i++) cin >> a[i];\n    for (int i = 0; i < n; i++) cin >> b[i];\n\n    // Your solution here: merge and print sorted\n\n    return 0;\n}\`,`,
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nvoid mergeArrays(vector<int>& a, vector<int>& b) {\n    // Your solution here: merge and print sorted elements separated by space\n}\`,
    driverCode: \`int main() {\n    int m, n;\n    if (!(cin >> m >> n)) return 0;\n    vector<int> a(m), b(n);\n    for (int i = 0; i < m; i++) cin >> a[i];\n    for (int i = 0; i < n; i++) cin >> b[i];\n    mergeArrays(a, b);\n    return 0;\n}\`,`
);

// 6. Reverse a String
newContent = newContent.replace(
  `    starterCode: \`#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n\n    // Your solution here\n\n    return 0;\n}\`,`,
  `    starterCode: \`#include <iostream>\n#include <string>\nusing namespace std;\n\nstring reverseString(string s) {\n    // Your solution here\n    return "";\n}\`,
    driverCode: \`int main() {\n    string s;\n    if (cin >> s) cout << reverseString(s) << endl;\n    return 0;\n}\`,`
);

// 7. Check Palindrome
newContent = newContent.replace(
  `    starterCode: \`#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n\n    // Your solution here\n\n    return 0;\n}\`,`,
  `    starterCode: \`#include <iostream>\n#include <string>\nusing namespace std;\n\nbool isPalindrome(string s) {\n    // Your solution here\n    return false;\n}\`,
    driverCode: \`int main() {\n    string s;\n    if (cin >> s) cout << (isPalindrome(s) ? "true" : "false") << endl;\n    return 0;\n}\`,`
);

// 8. Count Vowels
newContent = newContent.replace(
  `    starterCode: \`#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n\n    // Your solution here\n\n    return 0;\n}\`,`,
  `    starterCode: \`#include <iostream>\n#include <string>\nusing namespace std;\n\nint countVowels(string s) {\n    // Your solution here\n    return 0;\n}\`,
    driverCode: \`int main() {\n    string s;\n    if (cin >> s) cout << countVowels(s) << endl;\n    return 0;\n}\`,`
);

// 9. Fibonacci Number
newContent = newContent.replace(
  `    starterCode: \`#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n\n    // Your solution here\n\n    return 0;\n}\`,`,
  `    starterCode: \`#include <iostream>\nusing namespace std;\n\nint fibonacci(int n) {\n    // Your solution here\n    return 0;\n}\`,
    driverCode: \`int main() {\n    int n;\n    if (cin >> n) cout << fibonacci(n) << endl;\n    return 0;\n}\`,`
);

// 10. FizzBuzz
newContent = newContent.replace(
  `    starterCode: \`#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n\n    // Your solution here\n\n    return 0;\n}\`,`,
  `    starterCode: \`#include <iostream>\nusing namespace std;\n\nvoid fizzBuzz(int n) {\n    // Your solution here\n    // Print each value on a new line\n}\`,
    driverCode: \`int main() {\n    int n;\n    if (cin >> n) fizzBuzz(n);\n    return 0;\n}\`,`
);

// 11. Sort an Array
newContent = newContent.replace(
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n\n    // Your solution here\n\n    return 0;\n}\`,`,
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nvoid sortArray(vector<int>& nums) {\n    // Your solution here\n    // Print the sorted array (space-separated)\n}\`,
    driverCode: \`int main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n    sortArray(nums);\n    return 0;\n}\`,`
);

// 12. Find Kth Largest Element
newContent = newContent.replace(
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n, k;\n    cin >> n >> k;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n\n    // Your solution here\n\n    return 0;\n}\`,`,
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nint findKthLargest(vector<int>& nums, int k) {\n    // Your solution here\n    return 0;\n}\`,
    driverCode: \`int main() {\n    int n, k;\n    if (!(cin >> n >> k)) return 0;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n    cout << findKthLargest(nums, k) << endl;\n    return 0;\n}\`,`
);

// 13. Reverse a Linked List (Array simulated)
newContent = newContent.replace(
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> vals(n);\n    for (int i = 0; i < n; i++) cin >> vals[i];\n\n    // Your solution here: reverse vals and print\n\n    return 0;\n}\`,`,
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nvoid reverseList(vector<int>& vals) {\n    // Your solution here. Print reversed values space-separated.\n}\`,
    driverCode: \`int main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> vals(n);\n    for (int i = 0; i < n; i++) cin >> vals[i];\n    reverseList(vals);\n    return 0;\n}\`,`
);

// 14. Climbing Stairs
newContent = newContent.replace(
  `    starterCode: \`#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n\n    // Your solution here\n\n    return 0;\n}\`,`,
  `    starterCode: \`#include <iostream>\nusing namespace std;\n\nint climbStairs(int n) {\n    // Your solution here\n    return 0;\n}\`,
    driverCode: \`int main() {\n    int n;\n    if (cin >> n) cout << climbStairs(n) << endl;\n    return 0;\n}\`,`
);

// 15. Coin Change
newContent = newContent.replace(
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n, amount;\n    cin >> n >> amount;\n    vector<int> coins(n);\n    for (int i = 0; i < n; i++) cin >> coins[i];\n\n    // Your solution here (DP recommended)\n\n    return 0;\n}\`,`,
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nint coinChange(vector<int>& coins, int amount) {\n    // Your solution here\n    return 0;\n}\`,
    driverCode: \`int main() {\n    int n, amount;\n    if (!(cin >> n >> amount)) return 0;\n    vector<int> coins(n);\n    for (int i = 0; i < n; i++) cin >> coins[i];\n    cout << coinChange(coins, amount) << endl;\n    return 0;\n}\`,`
);

// 16. Anagram Check
newContent = newContent.replace(
  `    starterCode: \`#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s, t;\n    cin >> s >> t;\n\n    // Your solution here\n\n    return 0;\n}\`,`,
  `    starterCode: \`#include <iostream>\n#include <string>\nusing namespace std;\n\nbool isAnagram(string s, string t) {\n    // Your solution here\n    return false;\n}\`,
    driverCode: \`int main() {\n    string s, t;\n    if (cin >> s >> t) cout << (isAnagram(s, t) ? "true" : "false") << endl;\n    return 0;\n}\`,`
);

// 17. First Non-Repeating Character
newContent = newContent.replace(
  `    starterCode: \`#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n\n    // Your solution here\n\n    return 0;\n}\`,`,
  `    starterCode: \`#include <iostream>\n#include <string>\nusing namespace std;\n\nint firstUniqChar(string s) {\n    // Your solution here\n    return -1;\n}\`,
    driverCode: \`int main() {\n    string s;\n    if (cin >> s) cout << firstUniqChar(s) << endl;\n    return 0;\n}\`,`
);

// 18. Find Duplicate Number
newContent = newContent.replace(
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> nums(n + 1);\n    for (int i = 0; i <= n; i++) cin >> nums[i];\n\n    // Your solution here\n\n    return 0;\n}\`,`,
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nint findDuplicate(vector<int>& nums) {\n    // Your solution here\n    return 0;\n}\`,
    driverCode: \`int main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> nums(n + 1);\n    for (int i = 0; i <= n; i++) cin >> nums[i];\n    cout << findDuplicate(nums) << endl;\n    return 0;\n}\`,`
);

// 19. Stock Buy and Sell
newContent = newContent.replace(
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> prices(n);\n    for (int i = 0; i < n; i++) cin >> prices[i];\n\n    // Your solution here\n\n    return 0;\n}\`,`,
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nint maxProfit(vector<int>& prices) {\n    // Your solution here\n    return 0;\n}\`,
    driverCode: \`int main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> prices(n);\n    for (int i = 0; i < n; i++) cin >> prices[i];\n    cout << maxProfit(prices) << endl;\n    return 0;\n}\`,`
);

// 20. Missing Number
newContent = newContent.replace(
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n\n    // Your solution here (hint: Gauss formula sum = n*(n+1)/2)\n\n    return 0;\n}\`,`,
  `    starterCode: \`#include <iostream>\n#include <vector>\nusing namespace std;\n\nint missingNumber(vector<int>& nums) {\n    // Your solution here\n    return 0;\n}\`,
    driverCode: \`int main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n    cout << missingNumber(nums) << endl;\n    return 0;\n}\`,`
);

fs.writeFileSync('data/LocalQuestionBank.ts', newContent);
console.log('Done!');
