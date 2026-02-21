import { GoogleGenAI } from "@google/genai";
import { localQuestions } from "../data/LocalQuestions.ts";

export class GeminiService {
    private ai: GoogleGenAI;
    private model: string;

    constructor() {
        const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
        console.log("Gemini Key Loaded in GeminiService:", !!apiKey);
        // Using the installed @google/genai SDK
        this.ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });
        // Faster and more reliable key
        this.model = 'gemini-1.5-flash';
    }

    private getRandomLocalQuestion() {
        const randomIndex = Math.floor(Math.random() * localQuestions.length);
        return localQuestions[randomIndex];
    }

    async generateQuestion(difficulty: string = "Medium", topic: string = "Algorithms") {
        try {
            const systemInstruction = "You are a coding interviewer. Output ONLY raw JSON. No markdown. No conversational text.";
            const prompt = `Generate a new, unique ${difficulty} difficulty coding problem about ${topic}. Return exactly this JSON schema: { "title": "string", "description": "string", "difficulty": "string", "starterCode": "string", "testCases": [{"input": "string", "expectedOutput": "string"}] }`;

            const response = await this.ai.models.generateContent({
                model: this.model,
                contents: prompt,
                config: {
                    temperature: 0.9,
                    systemInstruction,
                    responseMimeType: "application/json"
                }
            });

            if (!response.text) {
                throw new Error("Empty response from Gemini.");
            }

            // CRITICAL FIX: Strip markdown formatting
            const text = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(text);

            return parsedData;

        } catch (error) {
            console.error("Gemini API Failed:", error);
            // CRITICAL FIX: Do not throw. Return absolute fail-safe fallback.
            return this.getRandomLocalQuestion();
        }
    }
}

export const geminiService = new GeminiService();
