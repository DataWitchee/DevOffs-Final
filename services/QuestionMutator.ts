import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

export interface BaseProblem {
    id: string;
    title: string;
    type: string;
    originalDescription: string;
    inputFormat: string;
    outputFormat: string;
    constraints: string;
}

export interface MutatedProblem {
    id: string;
    originalTitle: string;
    mutatedTitle: string;
    type: string;
    description: string;
    inputFormat: string;
    outputFormat: string;
    constraints: string;
    flavor: string; // e.g. "Cyberpunk", "Space", etc.
}

export const SEED_PROBLEMS: BaseProblem[] = [
    {
        id: "p1_two_sum",
        title: "Two Sum",
        type: "Array / Hash Table",
        originalDescription: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
        inputFormat: "nums: Array of integers, target: Integer",
        outputFormat: "Array of two integers (indices)",
        constraints: "2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9, -10^9 <= target <= 10^9"
    },
    {
        id: "p2_knapsack",
        title: "0/1 Knapsack",
        type: "Dynamic Programming",
        originalDescription: "Given weights and values of n items, put these items in a knapsack of capacity W to get the maximum total value in the knapsack.",
        inputFormat: "W: Integer (capacity), weights: Array of integers, values: Array of integers",
        outputFormat: "Integer (maximum value)",
        constraints: "1 <= n <= 1000, 1 <= W <= 10^5, 1 <= weights[i] <= W"
    },
    {
        id: "p3_valid_parens",
        title: "Valid Parentheses",
        type: "Stack",
        originalDescription: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Open brackets must be closed by the same type of brackets and in the correct order.",
        inputFormat: "s: String",
        outputFormat: "Boolean",
        constraints: "1 <= s.length <= 10^4, s consists of parentheses only"
    },
    {
        id: "p4_binary_search",
        title: "Binary Search",
        type: "Binary Search",
        originalDescription: "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1. You must write an algorithm with O(log n) runtime complexity.",
        inputFormat: "nums: Array of integers (sorted), target: Integer",
        outputFormat: "Integer (index or -1)",
        constraints: "1 <= nums.length <= 10^4, -10^4 <= nums[i], target <= 10^4, All integers in nums are unique."
    },
    {
        id: "p5_merge_intervals",
        title: "Merge Intervals",
        type: "Sorting / Arrays",
        originalDescription: "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
        inputFormat: "intervals: Array of Arrays of integers",
        outputFormat: "Array of Arrays of integers",
        constraints: "1 <= intervals.length <= 10^4, intervals[i].length == 2, 0 <= starti <= endi <= 10^4"
    }
];

const FAST_MODEL = 'gemini-2.0-flash';

// Shared instance getter locally to decouple from gemini.ts if needed
let aiClient: GoogleGenAI | null = null;
const getAiClient = () => {
    if (!aiClient) {
        const key = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.VITE_GEMINI_API_KEY;
        if (!key) throw new Error("Missing VITE_GEMINI_API_KEY in environment variables.");
        aiClient = new GoogleGenAI({ apiKey: key });
    }
    return aiClient;
};

const FLAVORS = ["Cyberpunk", "Deep Space Exploration", "High Finance / Wall Street", "Molecular Biology", "Ancient Magic Systems"];

export const mutateQuestion = async (problem: BaseProblem): Promise<MutatedProblem> => {
    const ai = getAiClient();
    const randomFlavor = FLAVORS[Math.floor(Math.random() * FLAVORS.length)];

    const prompt = `
    Act as a Senior Interviewer. I am going to provide you with a standard algorithmic coding problem.
    I need you to rewrite this problem into an elaborate, real-world narrative scenario using the theme: "${randomFlavor}".
    
    CRITICAL INSTRUCTIONS:
    - Do NOT change the underlying logic, time complexity requirements, or constraints.
    - Do NOT change the input or output format.
    - Only change the 'Flavor Text' (the story). Translate the abstract variables (like 'nums' or 'target') into thematic concepts (like 'navigational vectors' or 'warp coordinates').
    - Make it sound like a high-stakes engineering ticket for a specialized role.
    
    Original Problem title: "${problem.title}"
    Original Description: "${problem.originalDescription}"
    Input Format: ${problem.inputFormat}
    Output Format: ${problem.outputFormat}
    Constraints: ${problem.constraints}
    
    Return a JSON object containing the new narrative title and the new narrative description.
  `;

    try {
        const response = await ai.models.generateContent({
            model: FAST_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.8, // Slightly higher creative temp for better stories
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        mutatedTitle: { type: Type.STRING },
                        description: { type: Type.STRING }
                    },
                    required: ["mutatedTitle", "description"]
                }
            }
        });

        let cleanJson = response.text?.replace(/```json/g, "").replace(/```/g, "").trim() || "{}";
        const result = JSON.parse(cleanJson);

        return {
            id: problem.id,
            originalTitle: problem.title,
            type: problem.type,
            inputFormat: problem.inputFormat,
            outputFormat: problem.outputFormat,
            constraints: problem.constraints,
            flavor: randomFlavor,
            mutatedTitle: result.mutatedTitle || problem.title,
            description: result.description || problem.originalDescription
        };

    } catch (err) {
        console.error("Mutation failed, falling back to original:", err);
        return {
            id: problem.id,
            originalTitle: problem.title,
            mutatedTitle: problem.title,
            type: problem.type,
            description: problem.originalDescription,
            inputFormat: problem.inputFormat,
            outputFormat: problem.outputFormat,
            constraints: problem.constraints,
            flavor: "Standard"
        };
    }
};
