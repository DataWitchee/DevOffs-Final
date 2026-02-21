import { QuestionResponse } from '../services/questionProvider';

export const localQuestions: Omit<QuestionResponse, 'id'>[] = [
    {
        type: 'Code',
        questionText: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
        starterCode: 'function reverseList(head) {\n  // Your code here\n}',
        testCases: [
            { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]' },
            { input: '[1,2]', expectedOutput: '[2,1]' },
            { input: '[]', expectedOutput: '[]' }
        ],
        constraints: [
            'The number of nodes in the list is the range [0, 5000].',
            '-5000 <= Node.val <= 5000'
        ]
    },
    {
        type: 'Code',
        questionText: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.\n\nGiven a string s, return true if it is a palindrome, or false otherwise.',
        starterCode: 'function isPalindrome(s) {\n  // Your code here\n}',
        testCases: [
            { input: '"A man, a plan, a canal: Panama"', expectedOutput: 'true' },
            { input: '"race a car"', expectedOutput: 'false' },
            { input: '" "', expectedOutput: 'true' }
        ],
        constraints: [
            '1 <= s.length <= 2 * 10^5',
            's consists only of printable ASCII characters.'
        ]
    },
    {
        type: 'Code',
        questionText: 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
        starterCode: 'function mergeIntervals(intervals) {\n  // Your code here\n}',
        testCases: [
            { input: '[[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]' },
            { input: '[[1,4],[4,5]]', expectedOutput: '[[1,5]]' }
        ],
        constraints: [
            '1 <= intervals.length <= 10^4',
            'intervals[i].length == 2',
            '0 <= starti <= endi <= 10^4'
        ]
    },
    {
        type: 'Code',
        questionText: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
        starterCode: 'function twoSum(nums, target) {\n  // Your code here\n}',
        testCases: [
            { input: 'nums = [2,7,11,15], target = 9', expectedOutput: '[0,1]' },
            { input: 'nums = [3,2,4], target = 6', expectedOutput: '[1,2]' },
            { input: 'nums = [3,3], target = 6', expectedOutput: '[0,1]' }
        ],
        constraints: [
            '2 <= nums.length <= 10^4',
            '-10^9 <= nums[i] <= 10^9',
            '-10^9 <= target <= 10^9',
            'Only one valid answer exists.'
        ]
    },
    {
        type: 'Code',
        questionText: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
        starterCode: 'function isValid(s) {\n  // Your code here\n}',
        testCases: [
            { input: '"()"', expectedOutput: 'true' },
            { input: '"()[]{}"', expectedOutput: 'true' },
            { input: '"(]"', expectedOutput: 'false' },
            { input: '"([)]"', expectedOutput: 'false' },
            { input: '"{[]}"', expectedOutput: 'true' }
        ],
        constraints: [
            '1 <= s.length <= 10^4',
            's consists of parentheses only "()[]{}".'
        ]
    }
];
