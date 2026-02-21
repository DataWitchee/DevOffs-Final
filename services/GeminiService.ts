import { GoogleGenAI, Type } from "@google/genai";
import { localQuestions } from "../data/LocalQuestions.js";

export class GeminiService {
    private ai: GoogleGenAI;
    private model: string;

    constructor() {
        const apiKey = process.env.VITE_GEMINI_API_KEY || '';
        console.log("Gemini Key Loaded in GeminiService:", !!apiKey);
        this.ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });
        // Enforcing fast and fail-proof model per user requirements
        this.model = 'gemini-1.5-flash';
    }

    private getRandomLocalQuestion() {
        // Fallback to a random pre-defined question if Gemini fails
        const randomIndex = Math.floor(Math.random() * localQuestions.length);
        return localQuestions[randomIndex];
    }

    async generateQuestion(difficulty: string = "Medium") {
        const apiCall = async () => {
            const systemInstruction =
                "You are a coding interview engine. Generate a unique LeetCode-style problem in JSON. " +
                "Fields: title, description (Markdown), difficulty, constraints (Array), starterCode (C++ and Python), testCases (Array of {input, output}).";

            const prompt = `Generate a new, completely unique ${difficulty} difficulty coding problem.`;

            try {
                const response = await this.ai.models.generateContent({
                    model: this.model,
                    contents: prompt,
                    config: {
                        temperature: 0.9,
                        systemInstruction,
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                difficulty: { type: Type.STRING },
                                constraints: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING }
                                },
                                starterCode: {
                                    type: Type.OBJECT,
                                    properties: {
                                        cpp: { type: Type.STRING },
                                        python: { type: Type.STRING }
                                    },
                                    required: ["cpp", "python"]
                                },
                                testCases: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            input: { type: Type.STRING },
                                            output: { type: Type.STRING }
                                        },
                                        required: ["input", "output"]
                                    }
                                }
                            },
                            required: ["title", "description", "difficulty", "constraints", "starterCode", "testCases"]
                        }
                    }
                });

                if (!response.text) throw new Error("Empty response from Gemini.");

                return JSON.parse(response.text);

            } catch (error) {
                console.error("Gemini Generation Error:", error);
                throw error; // Rethrow to be caught by the Promise.race wrapper
            }
        };

        // Strict 5-second timeout for the demo per user requirements
        const timeout = new Promise<any>((resolve) =>
            setTimeout(() => {
                console.warn("Gemini generation took longer than 5000ms. Serving local fallback.");
                resolve(this.getRandomLocalQuestion());
            }, 5000)
        );

        try {
            return await Promise.race([apiCall(), timeout]);
        } catch (error) {
            console.error("Gemini Service Total Failure (caught fast):", error);
            return this.getRandomLocalQuestion();
        }
    }
}

export const geminiService = new GeminiService();
