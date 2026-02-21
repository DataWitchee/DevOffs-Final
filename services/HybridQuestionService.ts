import axios from 'axios';
import { GoogleGenAI } from '@google/genai';

export class HybridQuestionService {
    private ai: GoogleGenAI;
    private model: string;

    constructor() {
        const apiKey = process.env.VITE_GEMINI_API_KEY || '';
        this.ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });
        this.model = 'gemini-1.5-flash';
    }

    async fetchLeetCodeProblem(slug: string) {
        const query = `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          content
          codeSnippets {
            lang
            langSlug
            code
          }
          mysqlSchemas
        }
      }
    `;

        try {
            const response = await axios.post('https://leetcode.com/graphql', {
                query,
                variables: { titleSlug: slug }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Referer': 'https://leetcode.com/'
                }
            });

            return response.data.data.question;
        } catch (error) {
            console.error('LeetCode Fetch Error:', error);
            throw new Error('Failed to fetch from LeetCode');
        }
    }

    async fetchAndMutateRandomProblem() {
        const slugs = [
            "two-sum",
            "valid-parentheses",
            "merge-intervals",
            "climbing-stairs",
            "maximum-subarray",
            "best-time-to-buy-and-sell-stock",
            "contains-duplicate",
            "reverse-linked-list",
            "invert-binary-tree",
            "valid-anagram"
        ];

        const randomSlug = slugs[Math.floor(Math.random() * slugs.length)];
        const questionData = await this.fetchLeetCodeProblem(randomSlug);

        if (!questionData || !questionData.content) {
            throw new Error("Failed to retrieve question content.");
        }

        const prompt = `Rewrite this coding problem description into a Cyberpunk scenario. Keep constraints and input/output logic identical. Return ONLY the new description text.

Original Problem:
${questionData.content}
`;

        try {
            const response = await this.ai.models.generateContent({
                model: this.model,
                contents: prompt,
                config: {
                    temperature: 0.7,
                }
            });

            const mutatedDescription = response.text || "Failed to mutate description.";

            return {
                title: randomSlug,
                mutatedDescription: mutatedDescription,
                originalQuestion: questionData
            };
        } catch (error) {
            console.error("Gemini Mutation Error:", error);
            // Fallback to original description if mutation fails
            return {
                title: randomSlug,
                mutatedDescription: questionData.content,
                originalQuestion: questionData
            };
        }
    }
}

export const hybridQuestionService = new HybridQuestionService();
