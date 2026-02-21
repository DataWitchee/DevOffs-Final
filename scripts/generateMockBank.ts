import fs from 'fs';
import path from 'path';

const domains = ['DSA', 'Machine Learning', 'Backend', 'Frontend'];
const numQuestionsPerDomain = 200;

const dsaTemplates = [
    { t: "Reverse a Linked List", desc: "Given the head of a singly linked list, reverse the list, and return the reversed list." },
    { t: "Valid Parentheses", desc: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid." },
    { t: "Merge Intervals", desc: "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals." },
    { t: "LRU Cache", desc: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache." },
    { t: "Alien Dictionary", desc: "Return a string of the unique letters in the new alien language sorted in lexicographically increasing order." }
];

const mlTemplates = [
    { t: "Tensor Reshape", desc: "Implement the core tensor reshaping logic for a Multi-Head Attention block." },
    { t: "Metrics Calculation", desc: "Write a function to calculate the F1 score given arrays of true and predicted labels." },
    { t: "Gradient Descent", desc: "Implement a single step of batch gradient descent for linear regression." },
    { t: "K-Means Clustering", desc: "Implement the assignment step of the K-Means algorithm given centroids." },
    { t: "Activation Function", desc: "Implement the Softmax function and its derivative." }
];

const backendTemplates = [
    { t: "Rate Limiter", desc: "Design and implement a scalable, thread-safe rate limiter (Token Bucket or Sliding Window)." },
    { t: "Consistent Hashing", desc: "Implement a consistent hashing ring with virtual nodes for load balancing." },
    { t: "URL Shortener", desc: "Implement the core encoding and decoding logic for a URL shortener service." },
    { t: "Connection Pool", desc: "Design a thread-safe strict connection pool with a maximum size." },
    { t: "Message Queue", desc: "Implement an in-memory Pub/Sub message broker supporting topics." }
];

const frontendTemplates = [
    { t: "Event Emitter", desc: "Implement a generic Event Emitter class with on, off, and emit methods." },
    { t: "Debounce Function", desc: "Implement a robust debounce function that limits the rate at which a function can fire." },
    { t: "Virtual DOM Diff", desc: "Write a function that compares two generic vDOM trees and returns a list of patch operations." },
    { t: "State Container", desc: "Implement a simple Redux-like state container with subscribe and dispatch." },
    { t: "Reactive Signals", desc: "Implement a reactive primitive (Signal) that automatically updates dependents." }
];

const templatesMap: Record<string, typeof dsaTemplates> = {
    'DSA': dsaTemplates,
    'Machine Learning': mlTemplates,
    'Backend': backendTemplates,
    'Frontend': frontendTemplates
};

const questions: any[] = [];
let globalId = 1000;

for (const domain of domains) {
    const templates = templatesMap[domain];
    for (let i = 0; i < numQuestionsPerDomain; i++) {
        const template = templates[i % templates.length];

        // Slight variation to make them unique
        const variantId = Math.floor(i / templates.length) + 1;
        const variationScale = Math.floor(Math.random() * 100) + 10;

        questions.push({
            id: `OFFLINE-${globalId++}`,
            type: "Code",
            category: domain,
            questionText: `### ${template.t} (Variant ${variantId})\n\n${template.desc}\n\n**Constraints:**\n- Inputs scaled by a factor of ${variationScale}\n- Must handle edge cases securely.`,
            starterCode: `function solution(args) {\n  // Your JS code here\n}`,
            testCases: [
                { input: 'Variant ' + variantId, expectedOutput: 'Success' }
            ],
            constraints: [`O(N) time complexity`, `O(1) auxiliary space`]
        });
    }
}

const outputPath = path.join(process.cwd(), 'data', 'LocalQuestionBank.ts');
const fileContent = `export const localQuestions = ${JSON.stringify(questions, null, 2)};`;
fs.writeFileSync(outputPath, fileContent);

console.log(`Successfully generated ${questions.length} mock questions into data/LocalQuestionBank.ts`);
