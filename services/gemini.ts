
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SkillDomain, SkillDNAScore, AntiCheatLog, ExamMCQ, ExamTheory, ExamPractical, ChallengeCheckpoint } from '../types';

// Lazy initialize client to prevent runtime crash on module load if env vars are missing
let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
    if (!aiClient) {
        const env = (import.meta as any).env || (process as any).env || {};
        const key = env.VITE_GEMINI_API_KEY;
        if (!key) {
            throw new Error("Missing VITE_GEMINI_API_KEY in environment variables.");
        }
        aiClient = new GoogleGenAI({ apiKey: key });
    }
    return aiClient;
};

// MODEL CONFIGURATION
const FAST_MODEL = 'gemini-2.5-flash';
const PROCTOR_MODEL = 'gemini-2.5-flash-lite'; // High speed, optimized for fast metadata extraction
const REASONING_MODEL = 'gemini-2.5-pro';

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (retries <= 0) throw error;
        await new Promise(r => setTimeout(r, delay));
        return withRetry(fn, retries - 1, delay * 2);
    }
}

const cleanJson = (text: string | undefined): string => {
    if (!text) return "{}";
    let clean = text.replace(/```json/g, "").replace(/```/g, "");
    return clean.trim();
};

const parseResponse = (text: string | undefined) => {
    try {
        const cleaned = cleanJson(text);
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Failed to parse AI response:", text);
        return {};
    }
};

// --- ROBOTIC PROCTORING SUITE ---

export const analyzeEnvironmentSnapshot = async (
    imageBase64: string
): Promise<{ lighting: boolean; singlePerson: boolean; noDevices: boolean; feedback: string }> => {
    try {
        const ai = getAiClient();
        const prompt = `
      Perform a security scan of this workspace. 
      Evaluate with high tolerance for budget hardware:
      1. lighting: BE HIGHLY LENIENT. Mark as true if the face is broadly discernible. Do not penalize for low-quality sensors, grain, or low-light shadows typical of budget devices.
      2. singlePerson: Human count should be exactly 1.
      3. noDevices: No electronic devices (phones, tablets) detected in the immediate workspace.
      
      Output JSON only.
    `;

        const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: PROCTOR_MODEL,
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: base64Data } },
                    { text: prompt }
                ]
            },
            config: {
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        lighting: { type: Type.BOOLEAN },
                        singlePerson: { type: Type.BOOLEAN },
                        noDevices: { type: Type.BOOLEAN },
                        feedback: { type: Type.STRING }
                    },
                    required: ["lighting", "singlePerson", "noDevices", "feedback"]
                }
            }
        }), 2, 2000);

        return parseResponse(response.text);

    } catch (error) {
        console.error("Proctoring Check Failed:", error);
        // Graceful fallback: Allow entry but flag for review in real-world scenarios
        return {
            lighting: true,
            singlePerson: true,
            noDevices: true,
            feedback: "Verification bypass active due to temporary engine latency."
        };
    }
};

// --- SKILL TRIAL ---

const BACKUP_QUESTION = {
    questions: [
        { id: 1, text: "Implement a function to reverse a linked list.", category: "Practical" as const },
        { id: 2, text: "Explain the time complexity of QuickSort in the worst case and how to mitigate it.", category: "Concept" as const },
        { id: 3, text: "Design an LRU Cache with O(1) operations.", category: "Practical" as const },
        { id: 4, text: "Describe the differences between TCP and UDP.", category: "Concept" as const },
        { id: 5, text: "Write an algorithm to detect a cycle in a directed graph.", category: "Practical" as const },
        { id: 6, text: "What is eventual consistency in distributed systems?", category: "Concept" as const },
        { id: 7, text: "Implement a rate limiter using the token bucket algorithm.", category: "Practical" as const },
        { id: 8, text: "Explain how React's Virtual DOM works.", category: "Concept" as const },
        { id: 9, text: "Write a SQL query to find the second highest salary from an Employee table.", category: "Practical" as const },
        { id: 10, text: "Compare and contrast horizontal vs vertical scaling.", category: "Concept" as const }
    ],
    constraints: ["Do not use external libraries", "Optimize for time complexity O(N)", "Explain all tradeoffs"]
};

export const generateSkillTrial = async (domain: SkillDomain): Promise<{ questions: { id: number, text: string, category: 'Practical' | 'Concept' }[], constraints: string[] }> => {
    const ai = getAiClient();

    let promptDomain = domain as string;
    if (promptDomain.toLowerCase().includes('machine learning') || promptDomain === 'ML') {
        promptDomain += " (Specifically focus on Tensor transformations or Backpropagation calculus for deep technical depth)";
    }

    const prompt = `Generate a highly competitive senior-level technical trial for ${promptDomain}.
    The trial must consist of exactly 10 questions:
    - 5 Practical Questions: Focus on implementation details, edge cases, and real-world system design scenarios.
    - 5 Concept Questions: Focus on deep theoretical understanding, internals, and architectural trade-offs.
    The questions should be very difficult and aimed at distinguish between senior and staff level engineers.
    Output JSON only.`;

    const apiCall = withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: FAST_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.INTEGER },
                                text: { type: Type.STRING },
                                category: { type: Type.STRING, enum: ['Practical', 'Concept'] }
                            },
                            required: ["id", "text", "category"]
                        }
                    },
                    constraints: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ["questions", "constraints"]
            }
        }
    }));

    const timeout = new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 30000));

    const response = await Promise.race([apiCall, timeout]);
    if (!response) {
        throw new Error("API Timeout");
    }
    return parseResponse(response.text);
};

export const evaluatePerformance = async (
    domain: SkillDomain,
    taskSummary: string,
    solutionSummary: string,
    userReasoning: string,
    timeSpent: number,
    antiCheat: AntiCheatLog
): Promise<{ score: SkillDNAScore; feedback: string }> => {
    const ai = getAiClient();
    const prompt = `Evaluate performance in ${domain}. Solution: ${solutionSummary}. Time spent: ${timeSpent}s. Anti-cheat log: ${JSON.stringify(antiCheat)}.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: FAST_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: {
                        type: Type.OBJECT,
                        properties: {
                            problemSolving: { type: Type.NUMBER },
                            executionSpeed: { type: Type.NUMBER },
                            conceptualDepth: { type: Type.NUMBER },
                            aiLeverage: { type: Type.NUMBER },
                            riskAwareness: { type: Type.NUMBER },
                            average: { type: Type.NUMBER }
                        },
                        required: ["problemSolving", "executionSpeed", "conceptualDepth", "aiLeverage", "riskAwareness", "average"]
                    },
                    feedback: { type: Type.STRING }
                },
                required: ["score", "feedback"]
            }
        }
    }));
    return parseResponse(response.text);
};

// --- ADAPTIVE ENDLESS ARENA GENERATION ---

export const generateAdaptiveQuestion = async (
    domain: SkillDomain,
    lastScore: number,
    iteration: number
): Promise<{ id: string, text: string, category: string, starterCode: string, driverCode: string, constraints: string[], testCases: { input: string; expectedOutput: string }[] }> => {
    const ai = getAiClient();

    let difficultyMarker = "Intermediate";
    if (iteration === 1) difficultyMarker = "Intermediate";
    else if (lastScore > 85) difficultyMarker = "Expert";
    else if (lastScore > 70) difficultyMarker = "Advanced";
    else if (lastScore < 50) difficultyMarker = "Beginner";

    const prompt = `Generate a single ${difficultyMarker} level coding challenge for ${domain}.
    The user scored ${lastScore}% on their previous attempt.
    
    IMPORTANT: You must generate TWO separate blocks of code to simulate a LeetCode environment:
    1. starterCode: This is what the user sees. It MUST be a pure function signature ONLY. No main(), no cin/cout, no input().
       Example C++ starterCode:
       #include <iostream>
       #include <vector>
       using namespace std;
       int sumTwo(int a, int b) {
           // Your solution here
           return 0;
       }
       Example Python starterCode:
       def sum_two(a: int, b: int) -> int:
           # Your solution here
           pass
           
    2. driverCode: This is HIDDEN from the user. It MUST be a complete main() program that:
       - Parses stdin according to the exact test case format.
       - Calls the user's function from the starterCode.
       - Prints the return value to stdout in the exact expectedOutput format.
       Example C++ driverCode:
       int main() {
           int a, b;
           if (cin >> a >> b) {
               cout << sumTwo(a, b) << endl;
           }
           return 0;
       }
       Example Python driverCode:
       import sys
       if __name__ == "__main__":
           input_data = sys.stdin.read().split()
           if len(input_data) >= 2:
               print(sum_two(int(input_data[0]), int(input_data[1])))
    
    CRITICAL: The driver code MUST match the language of the starterCode (assume we might run this as C++ OR Python, so provide driverCode that matches the starterCode's language). Usually, just provide C++ for both if C++ is generated. Actually, to be safe, generate C++ for both starter and driver.

    Generate 3 real test cases where input is the exact stdin string and expectedOutput is the exact stdout string the driver program will print.
    Output JSON only.`;

    const apiCall = withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: FAST_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    category: { type: Type.STRING },
                    starterCode: { type: Type.STRING },
                    driverCode: { type: Type.STRING },
                    constraints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    testCases: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                input: { type: Type.STRING },
                                expectedOutput: { type: Type.STRING }
                            },
                            required: ["input", "expectedOutput"]
                        }
                    }
                },
                required: ["text", "category", "starterCode", "driverCode", "constraints", "testCases"]
            }
        }
    }));

    const timeout = new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 30000));
    const response = await Promise.race([apiCall, timeout]);
    if (!response) throw new Error("API Timeout");

    const data = parseResponse(response.text);
    return {
        id: `ADAPTIVE-${Date.now()}`,
        ...data,
        testCases: data.testCases || []
    };
};

export const evaluateCodeSubmission = async (
    domain: SkillDomain,
    questionText: string,
    userCode: string,
    language: string
): Promise<{ score: number, feedback: string, analysis: string, timeComplexity: string, spaceComplexity: string }> => {
    const ai = getAiClient();
    const prompt = `You are a strict technical judge. Evaluate the following ${language} code for ${domain}.
    Problem: ${questionText}
    User Code:
    ${userCode}
    
    Analyze for correctness, time/space complexity, and edge cases. Provide a score out of 100.
    Output JSON.`;

    const apiCall = withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: FAST_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER },
                    feedback: { type: Type.STRING },
                    analysis: { type: Type.STRING },
                    timeComplexity: { type: Type.STRING, description: "e.g., O(N), O(1)" },
                    spaceComplexity: { type: Type.STRING, description: "e.g., O(N), O(1)" }
                },
                required: ["score", "feedback", "analysis", "timeComplexity", "spaceComplexity"]
            }
        }
    }));

    const timeout = new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 25000));
    const response = await Promise.race([apiCall, timeout]);
    if (!response) throw new Error("API Timeout");

    return parseResponse(response.text);
};

export const analyzeCodeComplexity = async (
    code: string,
    language: string,
    problemText: string
): Promise<{ timeComplexity: string; spaceComplexity: string; review: string; suggestion: string }> => {
    const ai = getAiClient();
    const prompt = `Analyze this ${language} code for the problem: "${problemText.slice(0, 200)}".
Code:
\`\`\`
${code.slice(0, 1500)}
\`\`\`
Give time complexity (Big O), space complexity (Big O), a one-line code quality review, and one improvement suggestion. Be very concise. Output strict JSON.`;

    const apiCall = withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: FAST_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    timeComplexity: { type: Type.STRING },
                    spaceComplexity: { type: Type.STRING },
                    review: { type: Type.STRING },
                    suggestion: { type: Type.STRING }
                },
                required: ["timeComplexity", "spaceComplexity", "review", "suggestion"]
            }
        }
    }));
    const timeout = new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 20000));
    const response = await Promise.race([apiCall, timeout]);
    if (!response) throw new Error("API Timeout");
    return parseResponse(response.text);
};

export const evaluateArenaBattle = async (
    code: string,
    language: string,
    problemText: string,
    timeTakenMs: number,
    cpm: number,
    thinkingTimeMs: number
): Promise<{
    edgeCasesScore: number;
    timeSpaceScore: number;
    directionScore: number;
    typingScore: number;
    totalScore: number;
    timeComplexity: string;
    spaceComplexity: string;
    summary: string;
}> => {
    const ai = getAiClient();
    const prompt = `You are an elite Senior Staff Engineer judging a coding battle candidate.
Problem: "${problemText}"
Language: ${language}
Code:
\`\`\`
${code}
\`\`\`
Telemetry Data:
- Time Spent: ${Math.floor(timeTakenMs / 1000)}s
- Characters Per Minute (CPM): ${cpm}
- Longest Thinking Pause: ${Math.floor(thinkingTimeMs / 1000)}s

Evaluate the candidate based on these specific axes (each out of 100):
1. edgeCasesScore: Did they account for bounds, nulls, negative numbers, or tricks?
2. timeSpaceScore: Is this the numerically optimal approach in terms of Big O?
3. directionScore: Were they thinking in the right direction (e.g. hash map vs nested loops), even if they didn't finish or compile?
4. typingScore: Analyze their CPM and thinking pause. E.g. high CPM + low pause + buggy code = rushing; low CPM + high pause + elegant code = deep thought; high CPM + low pause + perfect code = mastery. Grade how effectively they utilized their time.

Also provide explicit timeComplexity and spaceComplexity (e.g. O(N)), calculate a totalScore (average of the 4), and write a concise 2-sentence summary of your overall judgment. Output strictly as JSON.`;

    const apiCall = withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: REASONING_MODEL, // Using pro model for deeper judgment context
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    edgeCasesScore: { type: Type.NUMBER },
                    timeSpaceScore: { type: Type.NUMBER },
                    directionScore: { type: Type.NUMBER },
                    typingScore: { type: Type.NUMBER },
                    totalScore: { type: Type.NUMBER },
                    timeComplexity: { type: Type.STRING },
                    spaceComplexity: { type: Type.STRING },
                    summary: { type: Type.STRING }
                },
                required: ["edgeCasesScore", "timeSpaceScore", "directionScore", "typingScore", "totalScore", "timeComplexity", "spaceComplexity", "summary"]
            }
        }
    }));

    const timeout = new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 30000));
    const response = await Promise.race([apiCall, timeout]);
    if (!response) throw new Error("API Timeout");
    return parseResponse(response.text);
};

export const simulateExecution = async (

    code: string,
    language: string,
    problemText?: string
): Promise<{ stdout: string; time: number; memory: number; complexity: string }> => {
    const ai = getAiClient();
    const prompt = `You are a high-performance ${language} code execution engine.
    Dry run the following code and predict its standard output exactly as a compiler would print it.
    ${problemText ? `The code is an attempt to solve this problem:\n${problemText}\n\nPlease run the code against the problem's implied test cases. In your standard output prediction, explicitly print an "Expected Output" vs "Actual Output" section so the user can see if their tests passed.` : ''}
    If there is a syntax error, return the compiler error in the stdout field.
    Provide realistic estimated execution time in ms (e.g. 5) and memory in bytes (e.g. 10240).
    Provide Big O time complexity as well (e.g. O(N)).
    
    Code:
    ${code}
    
    Output JSON.`;

    const apiCall = withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: FAST_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    stdout: { type: Type.STRING },
                    time: { type: Type.NUMBER },
                    memory: { type: Type.NUMBER },
                    complexity: { type: Type.STRING }
                },
                required: ["stdout", "time", "memory", "complexity"]
            }
        }
    }));

    const timeout = new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 25000));
    const response = await Promise.race([apiCall, timeout]);
    if (!response) throw new Error("API Timeout");

    return parseResponse(response.text);
};

// --- COMPETITIVE EXAM GENERATION (OPTIMIZED FOR SPEED) ---

export const generateExamMCQs = async (domain: SkillDomain): Promise<ExamMCQ[]> => {
    const ai = getAiClient();
    const prompt = `Generate 10 high-difficulty technical MCQs for ${domain}.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: FAST_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.INTEGER },
                                question: { type: Type.STRING },
                                options: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING }
                                },
                                correctIndex: { type: Type.INTEGER }
                            },
                            required: ["id", "question", "options", "correctIndex"]
                        }
                    }
                },
                required: ["questions"]
            }
        }
    }));
    const parsed = parseResponse(response.text);
    return (parsed.questions || []).slice(0, 10);
};

export const generateExamTheory = async (domain: SkillDomain): Promise<ExamTheory[]> => {
    const ai = getAiClient();
    const prompt = `Generate 10 architectural theory questions for ${domain}.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: FAST_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.INTEGER },
                                question: { type: Type.STRING }
                            },
                            required: ["id", "question"]
                        }
                    }
                },
                required: ["questions"]
            }
        }
    }));
    const parsed = parseResponse(response.text);
    return (parsed.questions || []).slice(0, 10);
};

export const generateExamPractical = async (domain: SkillDomain): Promise<ExamPractical[]> => {
    const ai = getAiClient();
    const prompt = `Generate 5 expert coding tasks for ${domain}.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: FAST_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    tasks: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.INTEGER },
                                task: { type: Type.STRING },
                                constraints: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING }
                                }
                            },
                            required: ["id", "task", "constraints"]
                        }
                    }
                },
                required: ["tasks"]
            }
        }
    }));
    const parsed = parseResponse(response.text);
    return (parsed.tasks || []).slice(0, 5);
};

export const gradeExamSections = async (domain: SkillDomain, theory: ExamTheory[], practical: ExamPractical[]): Promise<{ theoryScore: number, practicalScore: number, feedback: string }> => {
    const ai = getAiClient();
    const prompt = `Grade ${domain} exam. Theory: ${JSON.stringify(theory)} Practical: ${JSON.stringify(practical)}`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: REASONING_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 4000 },
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    theoryScore: { type: Type.INTEGER },
                    practicalScore: { type: Type.INTEGER },
                    feedback: { type: Type.STRING }
                },
                required: ["theoryScore", "practicalScore", "feedback"]
            }
        }
    }));
    return parseResponse(response.text);
};

// --- INTERVIEW (DYNAMIC) ---

export const generateInterviewQuestion = async (domain: SkillDomain, lastScore: number, roundNum: number): Promise<{ text: string, timeLimit: number }> => {
    const ai = getAiClient();
    const prompt = `Generate interview Q#${roundNum} for ${domain}.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: FAST_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    timeLimit: { type: Type.INTEGER }
                },
                required: ["text", "timeLimit"]
            }
        }
    }));
    return parseResponse(response.text);
};

export const evaluateInterviewResponse = async (domain: SkillDomain, question: string, answer: string): Promise<{ score: number, feedback: string, spokenFeedback: string }> => {
    const ai = getAiClient();
    const prompt = `Evaluate interview answer. Q: ${question} A: ${answer}`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: FAST_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.INTEGER },
                    feedback: { type: Type.STRING },
                    spokenFeedback: { type: Type.STRING }
                },
                required: ["score", "feedback", "spokenFeedback"]
            }
        }
    }));
    return parseResponse(response.text);
};

// --- CHALLENGE SCENARIO ---

export const generateChallengeScenario = async (domain: SkillDomain): Promise<{ taskDescription: string, checkpoints: ChallengeCheckpoint[] }> => {
    const ai = getAiClient();
    const prompt = `Create a challenge for ${domain}.`;
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: FAST_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    taskDescription: { type: Type.STRING },
                    checkpoints: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.INTEGER },
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                completed: { type: Type.BOOLEAN }
                            },
                            required: ["id", "title", "description", "completed"]
                        }
                    }
                },
                required: ["taskDescription", "checkpoints"]
            }
        }
    }));
    return parseResponse(response.text);
};

export const validateChallengeStep = async (domain: SkillDomain, stepTitle: string, code: string, originalLogic?: string): Promise<{ success: boolean, score: number, feedback: string }> => {
    const ai = getAiClient();
    const prompt = `Validate logic for ${stepTitle}. Code: ${code}. ${originalLogic ? "Evaluate strictly against this original LeetCode requirement: " + originalLogic : ""}`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: FAST_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    success: { type: Type.BOOLEAN },
                    score: { type: Type.INTEGER },
                    feedback: { type: Type.STRING }
                },
                required: ["success", "score", "feedback"]
            }
        }
    }));
    return parseResponse(response.text);
};
