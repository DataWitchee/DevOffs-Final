import { GoogleGenAI } from '@google/genai';
import { localQuestions } from '../data/LocalQuestions';

// ---------------------------------------------------------
// 1. Standardized Types and Interfaces
// ---------------------------------------------------------

export interface QuestionRequest {
    topic: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Hard' | 'Expert';
    type: 'MCQ' | 'Theory' | 'Code' | 'System Design';
    count?: number; // Optional, default 1
}

export interface QuestionResponse {
    id: string;
    type: string;
    questionText: string;
    // For MCQs
    options?: string[];
    correctAnswer?: string; // Should be kept on backend ideally, but returned here for evaluation
    // For Code
    starterCode?: string;
    testCases?: Array<{ input: string; expectedOutput: string }>;
    constraints?: string[];
    // For Theory / System Design
    rubric?: string[];
}

export interface IQuestionProvider {
    generateQuestions(request: QuestionRequest): Promise<QuestionResponse[]>;
}

// ---------------------------------------------------------
// 2. Mock Provider (For Local Testing / Zero Cost)
// ---------------------------------------------------------

export class MockProvider implements IQuestionProvider {
    async generateQuestions(request: QuestionRequest): Promise<QuestionResponse[]> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const count = request.count || 1;
        const results: QuestionResponse[] = [];

        for (let i = 0; i < count; i++) {
            if (request.type === 'MCQ') {
                results.push({
                    id: `mock-mcq-${Date.now()}-${i}`,
                    type: 'MCQ',
                    questionText: `Mock Question: What is the primary purpose of ${request.topic} at the ${request.difficulty} level?`,
                    options: ['A', 'B', 'C', 'D'],
                    correctAnswer: 'A'
                });
            } else if (request.type === 'Code') {
                results.push({
                    id: `mock-code-${Date.now()}-${i}`,
                    type: 'Code',
                    questionText: `Mock Challenge: Implement a generic algorithm for ${request.topic}.`,
                    starterCode: `function solve() {\n  // Your code here\n}`,
                    testCases: [{ input: 'test', expectedOutput: 'success' }],
                    constraints: ['O(n) time complexity']
                });
            } else {
                results.push({
                    id: `mock-theory-${Date.now()}-${i}`,
                    type: request.type,
                    questionText: `Mock Theory: Explain the nuances of ${request.topic}.`,
                    rubric: ['Mentions core concepts', 'Provides an example']
                });
            }
        }
        return results;
    }
}

// ---------------------------------------------------------
// 3. Gemini Provider (Primary)
// ---------------------------------------------------------

export class GeminiProvider implements IQuestionProvider {
    private ai: GoogleGenAI;
    private model: string;

    constructor() {
        const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("GeminiProvider: Missing VITE_GEMINI_API_KEY. Calls will fail.");
        }
        this.ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });
        this.model = 'gemini-1.5-flash'; // Optimized for speed
    }

    async generateQuestions(request: QuestionRequest): Promise<QuestionResponse[]> {
        const prompt = `
System Instruction: You are a coding interview engine. Generate a unique coding problem in strictly valid JSON format. Do not include markdown formatting (like \`\`\`json). Return ONLY the JSON object.

User Prompt: Generate ${request.count || 1} ${request.difficulty} difficulty ${request.type} problem(s) about ${request.topic}.
Structure as a strictly valid JSON array exactly like this:
[
  {
    "id": "uuid-or-unique-string",
    "type": "${request.type}",
    "questionText": "Problem Statement... (Markdown supported). Keep description concise (under 200 words).",
    "options": ["string"] (ONLY IF TYPE IS MCQ),
    "correctAnswer": "string" (ONLY IF TYPE IS MCQ),
    "starterCode": "function solution(args) { ... }" (ONLY IF TYPE IS Code),
    "testCases": [{"input": "...", "expectedOutput": "..."}] (ONLY IF TYPE IS Code),
    "constraints": ["Constraint 1", "Constraint 2"] (ONLY IF TYPE IS Code),
    "rubric": ["string"] (ONLY IF TYPE IS Theory or System Design)
  }
]
`;

        let attempts = 0;
        const maxAttempts = 2;

        while (attempts < maxAttempts) {
            try {
                const response = await this.ai.models.generateContent({
                    model: this.model,
                    contents: prompt,
                    config: {
                        temperature: 0.4,
                    }
                });

                const text = response.text || "[]";
                // Sanitize potential markdown wrap
                const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

                const parsed = JSON.parse(cleanText);

                if (!Array.isArray(parsed)) {
                    throw new Error("Gemini returned JSON but it is not an array.");
                }

                return parsed as QuestionResponse[];

            } catch (error) {
                attempts++;
                console.error(`GeminiProvider Error (Attempt ${attempts}):`, error);
                if (attempts >= maxAttempts) {
                    throw new Error(`Failed to generate ${request.type} questions via Gemini after ${attempts} attempts.`);
                }
            }
        }
        return [];
    }
}

// ---------------------------------------------------------
// 4. OpenAI Provider (Scaffold)
// ---------------------------------------------------------

export class OpenAIProvider implements IQuestionProvider {
    // private openai: OpenAI;

    constructor() {
        // Scaffold: Initialize OpenAI client here
        // this.openai = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY });
    }

    async generateQuestions(request: QuestionRequest): Promise<QuestionResponse[]> {
        console.warn("OpenAIProvider is a scaffold and not yet fully implemented. Returning mock data.");
        return new MockProvider().generateQuestions(request);
    }
}

// ---------------------------------------------------------
// 4.5. Local Provider (Instant, 100% Guaranteed Success)
// ---------------------------------------------------------

export class LocalProvider implements IQuestionProvider {
    async generateQuestions(request: QuestionRequest): Promise<QuestionResponse[]> {
        // Instant visual wait for drama
        await new Promise(resolve => setTimeout(resolve, 500));

        const count = request.count || 1;
        const results: QuestionResponse[] = [];

        for (let i = 0; i < count; i++) {
            // Pick a random question from local store
            const randomIndex = Math.floor(Math.random() * localQuestions.length);
            const questionData = localQuestions[randomIndex];

            results.push({
                id: `local-${Date.now()}-${i}`,
                ...questionData
            });
        }
        return results;
    }
}

// ---------------------------------------------------------
// 5. Factory / Service Manager
// ---------------------------------------------------------

export type ProviderType = 'GEMINI' | 'OPENAI' | 'MOCK' | 'LOCAL';

export class QuestionService {
    private provider: IQuestionProvider;

    constructor(providerType: ProviderType = 'GEMINI') {
        // Safe default assignment to suppress TS2564 before setProvider gives it the real one
        this.provider = new MockProvider();
        this.setProvider(providerType);
    }

    setProvider(type: ProviderType) {
        switch (type) {
            case 'GEMINI':
                this.provider = new GeminiProvider();
                break;
            case 'OPENAI':
                this.provider = new OpenAIProvider();
                break;
            case 'LOCAL':
                this.provider = new LocalProvider();
                break;
            case 'MOCK':
            default:
                this.provider = new MockProvider();
                break;
        }
    }

    async getQuestions(request: QuestionRequest): Promise<QuestionResponse[]> {
        const timeoutError = new Error("Provider Timeout");
        const timeoutMs = 3000; // Strict 3-second timeout for Gemini
        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(timeoutError), timeoutMs)
        );

        // ML-Specific Generation
        const isML = request.topic.toLowerCase().includes('machine learning') || request.topic === 'ML' || request.topic === 'Machine Learning';
        const modifiedRequest = { ...request };
        if (isML) {
             modifiedRequest.topic = request.topic + " (Specifically focus on Tensor transformations or Backpropagation calculus for deep technical depth)";
        }

        try {
            // Attempt Gemini API first if configured
            return await Promise.race([
                this.provider.generateQuestions(modifiedRequest),
                timeout
            ]);
        } catch (e) {
            console.warn(`Primary provider failed or timed out (${timeoutMs}ms). Silently falling back to 900-question LOCAL_QUESTIONS bank.`);
            // Fallback strategy to guarantee zero-error UX
            const fallbackProvider = new LocalProvider();
            return await fallbackProvider.generateQuestions(request);
        }
    }
}

// Export a default singleton instance configured to use full AI
export const questionService = new QuestionService('GEMINI');
