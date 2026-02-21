import { GoogleGenAI, Type } from "@google/genai";

export interface CoreProblem {
    id: string;
    title: string;
    difficulty: string;
    type: string;
    logicDescription: string;
}

export interface MutatedProblem {
    newTitle: string;
    newDescriptionMarkdown: string;
}

export const standardProblems: CoreProblem[] = [
    {
        id: "p1_two_sum",
        title: "Two Sum",
        difficulty: "Easy",
        type: "Array",
        logicDescription: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. Constraints: 2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9, -10^9 <= target <= 10^9. Output format: Array of two integers."
    },
    {
        id: "p2_valid_parens",
        title: "Valid Parentheses",
        difficulty: "Easy",
        type: "Stack",
        logicDescription: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Open brackets must be closed by the same type of brackets and in the correct order. Constraints: 1 <= s.length <= 10^4, s consists of parentheses only. Output format: Boolean."
    },
    {
        id: "p3_merge_intervals",
        title: "Merge Intervals",
        difficulty: "Medium",
        type: "Sorting",
        logicDescription: "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input. Constraints: 1 <= intervals.length <= 10^4, intervals[i].length == 2, 0 <= starti <= endi <= 10^4. Output format: Array of arrays."
    }
];

const THEMES = ['Cyberpunk', 'Space Exploration', 'Medieval Fantasy', 'Bio-Research'];

export class QuestionMutatorService {
    private aiClient: GoogleGenAI;

    constructor() {
        const key = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
        if (!key) {
            throw new Error("Missing Gemini API Key in environment.");
        }
        this.aiClient = new GoogleGenAI({ apiKey: key });
    }

    async mutateProblem(problemId: string, theme?: string): Promise<MutatedProblem> {
        const coreProblem = standardProblems.find(p => p.id === problemId) || standardProblems[0];
        const selectedTheme = theme || THEMES[Math.floor(Math.random() * THEMES.length)];

        const prompt = `
      Act as a Senior Technical Interviewer. Rewrite the following coding problem description into a ${selectedTheme} theme.
      
      Original Problem Title: ${coreProblem.title}
      Original Logic & Constraints: ${coreProblem.logicDescription}
      
      CRITICAL CONSTRAINT: Do NOT change the input/output format, constraints, or the underlying algorithmic logic. Only change the 'Flavor Text' (the story/context) to match the theme. Note the constraints explicitly in the new description.
      
      Return the result as a JSON object with this exact structure:
      {
        "newTitle": "string",
        "newDescriptionMarkdown": "string"
      }
    `;

        try {
            const response = await this.aiClient.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.8,
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            newTitle: { type: Type.STRING },
                            newDescriptionMarkdown: { type: Type.STRING }
                        },
                        required: ["newTitle", "newDescriptionMarkdown"]
                    }
                }
            });

            const text = response.text || "{}";
            const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const result = JSON.parse(cleanJson);

            if (!result.newTitle || !result.newDescriptionMarkdown) {
                throw new Error("Invalid schema returned by AI");
            }

            return {
                newTitle: result.newTitle,
                newDescriptionMarkdown: result.newDescriptionMarkdown
            };

        } catch (error) {
            console.error("[QuestionMutatorService] Failed to mutate problem. Triggering fallback.", error);
            // Fallback Mechanism
            return {
                newTitle: coreProblem.title,
                newDescriptionMarkdown: coreProblem.logicDescription
            };
        }
    }
}

export const questionMutatorService = new QuestionMutatorService();
