// @ts-ignore
import express from 'express';
import { GoogleGenAI } from '@google/genai';

export const debugRouter = express.Router();

// JSON Cleaner Utility: Fixes the Gemini Markdown Bug
export const cleanJsonResponse = (text: string): string => {
    if (!text) return "{}";
    // Strip markdown code blocks
    let clean = text.replace(/```json/g, "").replace(/```/g, "");
    return clean.trim();
};

debugRouter.get('/integration-check', async (req: any, res: any) => {
    const startTime = Date.now();
    const report: any = {
        status: 'PENDING',
        stages: {},
        finalData: null,
        errors: []
    };

    try {
        // Step 1: Codeforces Connection Check
        const cfStart = Date.now();
        const cfRes = await fetch('https://codeforces.com/api/problemset.problems?tags=implementation');

        if (!cfRes.ok) {
            throw new Error(`Codeforces API Error: ${cfRes.status}`);
        }
        const cfData = await cfRes.json();

        if (cfData.status !== 'OK' || !cfData.result.problems || cfData.result.problems.length === 0) {
            throw new Error('Codeforces returned empty or invalid problem list.');
        }

        // Pick a random problem
        const randomIdx = Math.floor(Math.random() * Math.min(100, cfData.result.problems.length));
        const problem = cfData.result.problems[randomIdx];

        const cfEnd = Date.now();
        report.stages.codeforces = `SUCCESS (${((cfEnd - cfStart) / 1000).toFixed(2)}s)`;

        // Step 2: Gemini Mutation Check
        const geminiStart = Date.now();
        // Support Vite env variables and Node.js env variables
        const env = (import.meta as any).env || process.env || {};
        const apiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error("Missing Gemini API Key");
        }

        const aiClient = new GoogleGenAI({ apiKey });

        const prompt = `
      Take the following competitive programming problem and mutate it into a realistic software engineering task.
      Original Title: ${problem.name}
      Original Tags: ${problem.tags.join(', ')}
      
      Output ONLY valid JSON with no markdown formatting.
      Format: { "newTitle": "string", "newDescription": "string" }
    `;

        const response = await aiClient.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt
        });

        const geminiEnd = Date.now();
        report.stages.gemini = `SUCCESS (${((geminiEnd - geminiStart) / 1000).toFixed(2)}s)`;

        // Step 3: Parsing and Latency Guard
        const parseStart = Date.now();
        const rawText = response.text || "";

        // Crucial Fix: Clean the markdown backticks
        const cleanedText = cleanJsonResponse(rawText);

        const parsedData = JSON.parse(cleanedText);

        if (!parsedData.newTitle || !parsedData.newDescription) {
            throw new Error("Missing required fields in Gemini JSON output.");
        }

        const parseEnd = Date.now();
        report.stages.parsing = `SUCCESS (${((parseEnd - parseStart) / 1000).toFixed(2)}s)`;

        report.finalData = parsedData;

        // Latency Guard
        const totalTime = Date.now() - startTime;
        if (totalTime > 8000) {
            report.status = 'WARNING: SLOW';
        } else {
            report.status = 'PASS';
        }

        return res.json(report);

    } catch (error: any) {
        report.status = 'FAIL';
        report.errors.push(error.message || "Unknown error occurred");
        return res.status(500).json(report);
    }
});
