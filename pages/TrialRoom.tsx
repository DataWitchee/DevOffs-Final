
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TrialSession, SkillDomain, AntiCheatLog } from '../types';
import { generateSkillTrial, evaluatePerformance, generateAdaptiveQuestion, evaluateCodeSubmission, simulateExecution, analyzeCodeComplexity } from '../services/gemini';
import { AlertTriangle, Clock, Eye, Send, Code, Cpu, ShieldAlert, XCircle, CheckCircle, ChevronRight, ChevronLeft, Lock, Loader2, Video, VideoOff, RotateCw, ShieldCheck, Sun, User as UserIcon, Smartphone, Terminal, Play, Maximize2, Minimize2 } from 'lucide-react';
import { SkillRadar } from '../components/SkillRadar';
import { useProctoring, WarningType } from '../hooks/useProctoring';
import { localQuestions } from '../data/LocalQuestionBank';
import Editor from '@monaco-editor/react';


interface Props {
  domain: SkillDomain;
  onComplete: (session: TrialSession) => void;
}

const TRIAL_DURATION = 3600; // 60 minutes
const EXACT_QUESTION_COUNT = 10;

// Strict thresholds for rejection
const MAX_TAB_SWITCHES = 2;
const MAX_PASTES = 5;
const MAX_FOCUS_LOST_TIME = 10000;

export const TrialRoom: React.FC<Props> = ({ domain, onComplete }) => {
  const [isTerminated, setIsTerminated] = useState(false);
  const [showReview, setShowReview] = useState<{ visible: boolean, logs: string[] }>({ visible: false, logs: [] });
  const [session, setSession] = useState<TrialSession>({
    id: crypto.randomUUID(),
    domain,
    status: 'generating',
  });
  const [timeLeft, setTimeLeft] = useState(TRIAL_DURATION);

  const [questions, setQuestions] = useState<{ id: string | number, text: string, category: string, type?: string, starterCode?: string, testCases?: any[], constraints?: any[] }[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Adaptive State
  const [iteration, setIteration] = useState(1);
  const [cumulativeScore, setCumulativeScore] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [adaptiveFeedback, setAdaptiveFeedback] = useState<string | null>(null);

  const [antiCheat, setAntiCheat] = useState<AntiCheatLog>({
    tabSwitchCount: 0,
    pasteCount: 0,
    focusLostTime: 0,
  });

  const [language, setLanguage] = useState<'python' | 'cpp'>('cpp');
  const [isCompiling, setIsCompiling] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<{ stdout: string, time: number, memory: number, complexity?: string } | null>(null);
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{ timeComplexity: string; spaceComplexity: string; review: string; suggestion: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customInput, setCustomInput] = useState(''); // User-provided stdin for custom test runs
  const [showCustomInput, setShowCustomInput] = useState(false);

  const currentQ = questions[currentQuestionIdx];

  const getLanguageBoilerplate = (lang: string, fallbackStarterCode?: string) => {
    // If AI gave us starter code, always use it (it's proper stdin-based main())
    if (fallbackStarterCode && fallbackStarterCode.trim() && !fallbackStarterCode.includes('solution(')) {
      return fallbackStarterCode;
    }
    switch (lang) {
      case 'cpp':
        return `#include <iostream>
#include <vector>
#include <string>
using namespace std;

int main() {
    // Read from cin, write to cout
    // Example: int n; cin >> n;
    
    
    return 0;
}`;
      case 'python':
        return `import sys

def main():
    # Read from input(), write with print()
    # Example: n = int(input())
    
    pass

main()`;
      default:
        return fallbackStarterCode || `#include <iostream>
using namespace std;
int main() { return 0; }`;
    }
  };

  const handleRunTests = async () => {
    setIsCompiling(true);
    setConsoleOutput(null);
    setAiAnalysis(null);
    setShowReview({ visible: false, logs: [] });

    try {
      const userCode = answers[`${currentQ?.id}_${language}`] || '';
      if (!userCode.trim()) {
        setConsoleOutput({ stdout: "No code provided.\nPlease write your solution in the editor before running.", time: 0, memory: 0 });
        setIsCompiling(false);
        return;
      }

      // Append the hidden driver block that parses input and calls the user's function
      const driverBlock = (currentQ as any)?.driverCode || '';
      const codeToRun = userCode + (driverBlock ? `\n\n${driverBlock}` : '');
      const wandboxCompiler = language === 'cpp' ? 'gcc-head' : 'cpython-3.10.4';
      const wandboxOptions = language === 'cpp' ? 'warning,c++17' : '';

      // Helper: run code with optional stdin via Wandbox
      const runWithInput = async (stdin: string) => {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 15000);
        try {
          const r = await fetch('https://wandbox.org/api/compile.json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: ctrl.signal,
            body: JSON.stringify({ code: codeToRun, compiler: wandboxCompiler, options: wandboxOptions, stdin })
          });
          clearTimeout(tid);
          if (r.ok) {
            const d = await r.json();
            return {
              compileError: d.compiler_error || '',
              stdout: (d.program_output || '').trim(),
              stderr: d.program_error || '',
              exitCode: d.status === '0' ? 0 : 1
            };
          }
        } catch { clearTimeout(tid); }
        // Fallback: Render backend
        try {
          const ctrl2 = new AbortController();
          const tid2 = setTimeout(() => ctrl2.abort(), 30000);
          const r2 = await fetch('https://devoffs-api.onrender.com/api/execute', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            signal: ctrl2.signal,
            body: JSON.stringify({ code: codeToRun, language, stdin })
          });
          clearTimeout(tid2);
          if (r2.ok) {
            const d2 = await r2.json();
            return { compileError: '', stdout: (d2.stdout || '').trim(), stderr: d2.stderr || '', exitCode: d2.stderr ? 1 : 0 };
          }
        } catch { /* all failed */ }
        throw new Error('All execution backends unavailable.');
      };

      const testCases: { input: string; expectedOutput: string }[] = (currentQ as any)?.testCases || [];

      if (testCases.length > 0) {
        // Run against every test case separately
        const results: { input: string; expected: string; actual: string; passed: boolean; error: string }[] = [];
        let compileError = '';

        for (const tc of testCases) {
          const result = await runWithInput(tc.input);
          if (result.compileError) { compileError = result.compileError; break; }
          const passed = result.stdout === tc.expectedOutput.trim();
          results.push({ input: tc.input, expected: tc.expectedOutput.trim(), actual: result.stdout, passed, error: result.stderr });
        }

        const allPassed = results.length > 0 && results.every(r => r.passed);
        const passCount = results.filter(r => r.passed).length;

        let terminalOutput = `[${language.toUpperCase()} COMPILER — DevOffs Engine]\n\n`;
        if (compileError) {
          terminalOutput += `COMPILATION ERROR:\n${compileError}`;
        } else {
          results.forEach((r, i) => {
            terminalOutput += `── Test ${i + 1} ${r.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
            terminalOutput += `   Input:    ${r.input.slice(0, 60)}\n`;
            terminalOutput += `   Expected: ${r.expected.slice(0, 60)}\n`;
            if (!r.passed) terminalOutput += `   Got:      ${r.actual.slice(0, 60)}\n`;
            if (r.error) terminalOutput += `   Error:    ${r.error.slice(0, 100)}\n`;
            terminalOutput += '\n';
          });
          terminalOutput += allPassed ? `🏆 All ${results.length} tests passed!` : `${passCount}/${results.length} tests passed`;
        }

        setConsoleOutput({ stdout: terminalOutput, time: 0, memory: 0 });
        setShowReview({
          visible: true,
          logs: [
            '[SYSTEM] Running test cases...',
            compileError ? '❌ Compilation Error' : allPassed ? `✅ ${passCount}/${testCases.length} Tests Passed!` : `⚠️ ${passCount}/${testCases.length} Tests Passed`,
            compileError ? '[ERROR] Fix compilation error first.' : allPassed ? '[SUCCESS] All tests passed! Submit to AI Judge.' : '[HINT] Fix failing test cases and run again.'
          ]
        });

        // AI complexity analysis on success
        if (!compileError) {
          setIsAnalyzing(true);
          analyzeCodeComplexity(codeToRun, language, currentQ?.text || '').then(r => setAiAnalysis(r)).catch(() => { }).finally(() => setIsAnalyzing(false));
        }

        // ✅ Auto-submit to AI Judge if all tests pass
        if (allPassed) {
          setTimeout(() => handleSubmit(), 1500);
        }

      } else {
        // No test cases — just run the code and show output
        const result = await runWithInput(customInput);
        const isError = !!result.compileError || !!result.stderr || result.exitCode !== 0;
        const terminalOutput =
          `[${language.toUpperCase()} COMPILER — DevOffs Engine]\n\n` +
          (result.compileError ? `COMPILATION ERROR:\n${result.compileError}\n` : '') +
          (!result.compileError && result.stderr ? `RUNTIME ERROR:\n${result.stderr}\n` : '') +
          (!isError && result.stdout ? `OUTPUT:\n${result.stdout}` : '') +
          (!isError && !result.stdout ? '(Program ran with no output)' : '');

        setConsoleOutput({ stdout: terminalOutput, time: 0, memory: 0 });
        setShowReview({
          visible: true,
          logs: [
            '[SYSTEM] Compiling solution...',
            isError ? '❌ Compilation / Runtime Error' : '✅ Code Compiled & Executed Successfully',
            isError ? '[ERROR] Fix the error shown in the console panel below.' : '[SUCCESS] Ready to Submit to AI Judge.'
          ]
        });

        if (!isError) {
          setIsAnalyzing(true);
          analyzeCodeComplexity(codeToRun, language, currentQ?.text || '').then(r => setAiAnalysis(r)).catch(() => { }).finally(() => setIsAnalyzing(false));
        }
      }

    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError';
      setConsoleOutput({
        stdout: isTimeout
          ? 'Execution Timed Out.\nHint: Check for infinite loops or very slow algorithms.'
          : `Compiler Error: ${err?.message || 'Unknown error'}`,
        time: 0, memory: 0
      });
      setShowReview({ visible: true, logs: ['[SYSTEM] Compiling...', '❌ Engine Error', '[ERROR] Check your internet connection.'] });
    } finally {
      setIsCompiling(false);
    }
  };


  // Proctoring State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const blurTimeRef = useRef<number | null>(null);

  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      if (stream) node.srcObject = stream;
      (videoRef as any).current = node;
    }
  }, [stream]);

  // New ML Proctor Hook
  const proctor = useProctoring(videoRef, {
    enabled: session.status === 'active',
    gazeThresholdMs: 3000,
    // Warnings are shown visually in the UI but NEVER block submission
    onWarning: () => { }
  });

  useEffect(() => {
    const init = async () => {
      try {
        setSession(prev => ({ ...prev, status: 'generating' }));
        const data = await generateAdaptiveQuestion(domain, cumulativeScore, iteration);

        setQuestions([data as any]);
        setCurrentQuestionIdx(0);

        setSession(prev => ({
          ...prev,
          status: 'setup',
          taskDescription: data.text,
          constraints: data.constraints || []
        }));

      } catch (err) {
        console.warn("AI Generation Failed or Key Missing. Falling back to High-Quality Local Bank.");
        // Fallback to offline God-Tier Questions
        let filteredBank = localQuestions.filter((q: any) => q.category === domain);
        if (filteredBank.length === 0) filteredBank = localQuestions.filter((q: any) => q.category === 'DSA');
        if (filteredBank.length === 0) filteredBank = localQuestions;

        const shuffledBank = [...filteredBank].sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffledBank.slice(0, Math.min(EXACT_QUESTION_COUNT, shuffledBank.length));

        const fallbackQuestions = selectedQuestions.map((q, idx) => ({
          id: `DEVOFFS-SR-${702 + idx}`,
          category: q.type === 'Code' ? "Practical" : "Theoretical",
          text: q.questionText || "Loading challenge details...",
          type: "coding",
          starterCode: q.starterCode || "",
          testCases: q.testCases || [],
          constraints: q.constraints || []
        }));

        setQuestions(fallbackQuestions as any);
        setSession(prev => ({
          ...prev,
          status: 'setup',
          taskDescription: JSON.stringify(fallbackQuestions),
          constraints: fallbackQuestions[0]?.constraints || ["O(N) time complexity"]
        }));
      }
    };
    init();
    // Fire-and-forget: wake the Render backend immediately on mount so it's warm when user runs code
    fetch('https://devoffs-api.onrender.com/api/test').catch(() => { });
  }, [domain]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setStream(mediaStream);
      setHasPermissions(true);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      alert("Camera permissions are required for proctored Skill Trials.");
    }
  };

  const beginActiveTrial = () => {
    setSession(prev => ({
      ...prev,
      status: 'active',
      startTime: Date.now()
    }));
  };

  // Removed unstable generic useEffect in favor of precise setVideoRef callback

  useEffect(() => {
    if (session.status !== 'active') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTerminated(true);
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      setAntiCheat(prev => ({ ...prev, pasteCount: prev.pasteCount + 1 }));
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("paste", handlePaste);
    };
  }, [session.status]);



  const handleSubmit = useCallback(async () => {
    // STRICT INTEGRITY CHECK
    const violations: string[] = [];
    if (antiCheat.pasteCount > MAX_PASTES) violations.push(`Clipboard misuse detected.`);
    if (antiCheat.tabSwitchCount > MAX_TAB_SWITCHES) violations.push(`Excessive window switching.`);
    if (antiCheat.focusLostTime > MAX_FOCUS_LOST_TIME) violations.push(`Extended absence.`);
    // Note: camera violations are shown as warnings on-screen but never block submission

    if (violations.length > 0) {
      setSession(prev => ({
        ...prev,
        status: 'completed',
        endTime: Date.now(),
        score: {
          problemSolving: 0, executionSpeed: 0, conceptualDepth: 0, aiLeverage: 0, riskAwareness: 0, average: 0
        },
        feedback: `VERIFICATION REJECTED: ${violations.join(" ")}`
      }));
      return;
    }

    setIsEvaluating(true);
    setAdaptiveFeedback(null);

    try {
      const userCode = answers[`${currentQ?.id}_${language}`] || "";

      if (!userCode.trim()) {
        setAdaptiveFeedback("No code provided. Please write your solution in the editor before submitting.");
        setIsEvaluating(false);
        return;
      }

      const result = await evaluateCodeSubmission(domain, currentQ?.text || "", userCode, language);

      setCumulativeScore(result.score);
      setAdaptiveFeedback(result.feedback);
      setShowReview({
        visible: true,
        logs: [
          `[SYSTEM] Code Graded by AI...`,
          `✅ Score: ${result.score}/100`,
          `⏱ Time Complexity: ${result.timeComplexity || 'O(?)'}`,
          `📦 Space Complexity: ${result.spaceComplexity || 'O(?)'}`,
          `🧠 Analysis: ${result.analysis}`,
          `[NOTE] Prepare for Next Adaptive Challenge...`
        ]
      });

    } catch (err: any) {
      const msg = err?.message || 'Unknown error';
      setAdaptiveFeedback(`AI Evaluation Failed: ${msg.includes('VITE_GEMINI_API_KEY') ? 'API key missing in Vercel environment variables.' : msg}`);
    } finally {
      setIsEvaluating(false);
    }
  }, [questions, answers, language, antiCheat, domain, currentQ]);

  // Timer Effect that depends on handleSubmit
  useEffect(() => {
    if (session.status !== 'active' || isTerminated) return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [session.status, handleSubmit]);

  const handleAnswerChange = (text: string) => {
    setAnswers(prev => ({ ...prev, [`${questions[currentQuestionIdx].id}_${language}`]: text }));
  };

  const handleNext = async () => {
    setSession(prev => ({ ...prev, status: 'generating' }));
    try {
      const nextIter = iteration + 1;
      const data = await generateAdaptiveQuestion(domain, cumulativeScore, nextIter);
      setQuestions([data as any]);
      setCurrentQuestionIdx(0);
      setIteration(nextIter);
      setShowReview({ visible: false, logs: [] });
      setIsEvaluating(false);
      setSession(prev => ({ ...prev, status: 'active' }));
    } catch (e) {
      // Fallback to offline bank instead of aborting the endless loop
      const nextIter = iteration + 1;
      let filteredBank = localQuestions.filter((q: any) => q.category === domain);
      if (filteredBank.length === 0) filteredBank = localQuestions.filter((q: any) => q.category === 'DSA');
      if (filteredBank.length === 0) filteredBank = localQuestions;

      const randomFallback = filteredBank[Math.floor(Math.random() * filteredBank.length)] as any;
      setQuestions([{
        id: `FALLBACK-${Date.now()}`,
        text: randomFallback.questionText || "Solve this offline algorithmic challenge securely.",
        category: "Practical",
        starterCode: randomFallback.starterCode || "function solution(args) {\n  // Type code here\n}",
        constraints: randomFallback.constraints || ["Time: O(N)"]
      } as any]);

      setCurrentQuestionIdx(0);
      setIteration(nextIter);
      setShowReview({ visible: false, logs: [] });
      setIsEvaluating(false);
      setSession(prev => ({ ...prev, status: 'active' }));
    }
  };

  const preventCopy = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setAntiCheat(prev => ({ ...prev, pasteCount: prev.pasteCount + 1 }));
  };

  if (session.status === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
        <Loader2 size={64} className="text-cyan-500 animate-spin" />
        <h2 className="text-2xl font-bold text-white mb-2">Gemini AI is analyzing your skill DNA...</h2>
        <p className="text-slate-400 max-w-md">Synthesizing custom {domain} challenge...</p>
      </div>
    );
  }

  if (session.status === 'setup') {
    const isReady = hasPermissions;
    return (
      <div className="max-w-4xl mx-auto py-12 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Proctor Calibration</h1>
          <p className="text-slate-400">Environment verification is required for competitive skill certification.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">AI Vision Feed</h3>
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative border border-slate-700 shadow-2xl">
              <video ref={setVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
              {!hasPermissions && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md">
                  <VideoOff size={32} className="text-slate-600 mb-2" />
                  <span className="text-slate-400 text-sm font-medium">Camera Permissions Needed</span>
                </div>
              )}
            </div>
            {!hasPermissions && (
              <button onClick={startCamera} className="w-full mt-6 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                <Video size={18} /> Enable Secure Feed
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4">Security Parameters</h3>
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border flex items-center justify-between bg-green-900/20 border-green-500 text-green-400`}>
                  <div className="flex items-center gap-3"><Sun size={20} /> <span className="text-sm font-bold uppercase">Optimal Lighting</span></div>
                  <CheckCircle size={16} />
                </div>
                <div className={`p-4 rounded-xl border flex items-center justify-between ${hasPermissions ? 'bg-green-900/20 border-green-500 text-green-400' : 'bg-slate-900/40 border-slate-700 text-slate-500'}`}>
                  <div className="flex items-center gap-3"><UserIcon size={20} /> <span className="text-sm font-bold uppercase">Single Participant</span></div>
                  {hasPermissions && <CheckCircle size={16} />}
                </div>
                <div className={`p-4 rounded-xl border flex items-center justify-between bg-green-900/20 border-green-500 text-green-400`}>
                  <div className="flex items-center gap-3"><Eye size={20} /> <span className="text-sm font-bold uppercase">Gaze Tracking Live</span></div>
                  <CheckCircle size={16} />
                </div>
              </div>
            </div>

            <button
              disabled={!hasPermissions}
              onClick={beginActiveTrial}
              className="w-full py-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xl font-bold rounded-2xl shadow-xl shadow-cyan-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Start Certified Trial
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (session.status === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
        <div className="w-16 h-16 border-4 border-slate-700 border-t-purple-500 rounded-full animate-spin"></div>
        <h2 className="text-2xl font-bold text-white">Analyzing Skill DNA...</h2>
      </div>
    );
  }

  if (session.status === 'completed' && session.score) {
    const isRejected = session.score.average === 0;
    const isFailed = !isRejected && session.score.average < 60;

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
        <div className="text-center space-y-2">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isRejected ? 'bg-red-500/10 text-red-500' :
            isFailed ? 'bg-orange-500/10 text-orange-500' :
              'bg-green-500/10 text-green-400'
            }`}>
            {isRejected ? <ShieldAlert size={32} /> : isFailed ? <AlertTriangle size={32} /> : <CheckCircle size={32} />}
          </div>
          <h1 className="text-3xl font-bold text-white">
            {isRejected ? 'Verification Rejected' : isFailed ? 'Skill Not Verified' : 'Trial Passed'}
          </h1>
          <p className="text-slate-400">
            {isRejected ? 'Integrity violation detected.' :
              isFailed ? 'Score below 60% threshold.' :
                'Verified performance report.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className={`bg-slate-800 p-6 rounded-2xl border ${isRejected ? 'border-red-900/50' : isFailed ? 'border-orange-900/50' : 'border-slate-700'}`}>
            <h3 className="text-lg font-bold text-white mb-4">Skill DNA™ Result</h3>

            {isRejected ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-4">
                <XCircle size={64} className="text-red-500/50" />
                <div className="text-red-400 font-bold text-xl">VOID / 0</div>
              </div>
            ) : (
              <>
                <SkillRadar data={session.score} fullSize />
                <div className="mt-6 text-center">
                  <span className={`text-4xl font-bold ${isFailed ? 'text-orange-400' : 'text-cyan-400'}`}>{session.score.average.toFixed(1)}</span>
                </div>
              </>
            )}
          </div>

          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border ${isRejected ? 'bg-red-950/20 border-red-900/50' :
              'bg-slate-800 border-slate-700'
              }`}>
              <h3 className="text-lg font-bold mb-2 text-white">Analysis</h3>
              <p className="text-slate-300 leading-relaxed">{session.feedback}</p>
            </div>

            <button
              onClick={() => onComplete(session)}
              className={`w-full py-4 text-white font-bold rounded-xl transition-colors ${isRejected ? 'bg-slate-700 hover:bg-slate-600' : 'bg-cyan-600 hover:bg-cyan-500'
                }`}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isTerminated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/90 backdrop-blur-xl">
        <style>
          {`
            @keyframes severeShake {
              0%, 100% { transform: translateX(0); }
              10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
              20%, 40%, 60%, 80% { transform: translateX(10px); }
            }
            .animate-shake {
              animation: severeShake 0.4s cubic-bezier(.36,.07,.19,.97) both;
            }
          `}
        </style>
        <div className="animate-shake bg-slate-900 border-2 border-red-500 rounded-2xl p-8 max-w-2xl text-center shadow-[0_0_100px_rgba(239,68,68,0.5)]">
          <ShieldAlert size={80} className="text-red-500 mx-auto mb-6 animate-pulse" />
          <h2 className="text-4xl font-black text-white mb-4 tracking-tight">⚠️ ASSESSMENT TERMINATED</h2>
          <p className="text-xl text-red-200 mb-8 font-mono">EXTERNAL ACTIVITY DETECTED.</p>
          <button
            onClick={() => {
              setSession(prev => ({
                ...prev,
                status: 'completed',
                score: { problemSolving: 0, executionSpeed: 0, conceptualDepth: 0, aiLeverage: 0, riskAwareness: 0, average: 0 },
                feedback: "VERIFICATION REJECTED: Tab switching detected."
              }));
              setIsTerminated(false);
            }}
            className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
      <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-cyan-400 px-2 py-1 bg-cyan-950 rounded border border-cyan-900">{domain.toUpperCase()}</span>
          <div className="h-6 w-px bg-slate-700"></div>
          <div className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            Live Proctoring
          </div>
        </div>
        <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
          <Clock size={20} />
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm mr-2">
            Question {currentQuestionIdx + 1} of {questions.length}
          </span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">

        {/* Left: Task Content (4 cols) */}
        <div className="lg:col-span-4 bg-slate-800 rounded-xl border border-slate-700 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Category: {currentQ?.category}</span>
              <h2 className="text-lg font-bold text-white">Challenge #{currentQ?.id}</h2>
            </div>
            <div className="flex gap-2 text-xs font-mono text-cyan-400 border border-cyan-900 px-2 py-1 rounded bg-cyan-950">
              ITERATION {iteration}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="prose prose-invert max-w-none select-none cursor-default" onCopy={preventCopy} onContextMenu={(e) => e.preventDefault()}>
              <p className="text-lg text-slate-200 leading-relaxed whitespace-pre-wrap">
                {currentQ?.text
                  ?.replace(/^#{1,3}\s*/gm, '')      // remove ### headings
                  ?.replace(/\*\*(.*?)\*\*/g, '$1')  // remove **bold**
                  ?.replace(/\*(.*?)\*/g, '$1')       // remove *italic*
                  ?.trim()}
              </p>
            </div>
          </div>
          {/* PIP PROCTOR */}
          <div className="p-4 bg-slate-900/80 border-t border-slate-700 flex items-center gap-4">
            <div className="w-24 aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 relative">
              <video ref={setVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
              <div className="absolute top-1 left-1 bg-red-600 w-1.5 h-1.5 rounded-full animate-pulse"></div>
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Environmental Integrity</div>
              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 bg-green-900/20 text-green-400 text-[10px] font-bold rounded border border-green-500/20">SECURE</div>
                {antiCheat.environmentViolations && antiCheat.environmentViolations.length > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-red-400 animate-pulse font-bold">
                    <AlertTriangle size={10} /> Alert
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Workspace (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 rounded-xl border border-slate-700 flex flex-col overflow-hidden relative group">
          <div className="p-2 bg-[#1e293b] flex items-center justify-between border-b border-slate-700">
            <span className="text-xs text-slate-400 font-mono">workspace/solution_v1</span>
            <div className="flex items-center gap-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-md border border-slate-600 outline-none focus:border-cyan-500 font-mono"
              >
                <option value="cpp">C++ (GCC)</option>
                <option value="python">Python 3</option>
              </select>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{currentQ?.category} Engine</span>
            </div>
          </div>
          <div className="flex-1 w-full bg-[#0f172a] relative">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={answers[`${currentQ?.id}_${language}`] !== undefined ? answers[`${currentQ?.id}_${language}`] : getLanguageBoilerplate(language, currentQ?.starterCode || "")}
              onChange={(val) => handleAnswerChange(val || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                padding: { top: 16 }
              }}
            />
          </div>

          {showReview.visible && (
            <div className="absolute inset-x-4 bottom-24 bg-slate-800 rounded-lg border border-indigo-500/50 p-4 shadow-xl z-20">
              <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                <ShieldCheck className="text-indigo-400" size={16} /> Validation Report
              </h4>
              <div className="space-y-1 font-mono text-xs">
                {showReview.logs.map((log, i) => (
                  <div key={i} className={log.includes('FAIL') ? 'text-red-400' : 'text-green-400'}>{log}</div>
                ))}
              </div>
              <button
                onClick={() => setShowReview({ visible: false, logs: [] })}
                className="absolute top-2 right-2 text-slate-400 hover:text-white"
              >
                <XCircle size={16} />
              </button>
            </div>
          )}

          {/* TERMINAL + CUSTOM INPUT PANEL */}
          <div className={`absolute bottom-20 left-4 right-4 z-10 transition-all duration-300 ${terminalExpanded ? 'h-80' : 'h-44'}`}>
            <div className="h-full bg-slate-950 border border-slate-700 rounded-xl shadow-2xl font-mono text-xs flex flex-col">
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900 rounded-t-xl shrink-0">
                <div className="flex items-center gap-3">
                  {/* Tab: Output / Custom Input */}
                  <button
                    onClick={() => setShowCustomInput(false)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${!showCustomInput ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Terminal size={10} className="inline mr-1" />Output
                  </button>
                  <button
                    onClick={() => setShowCustomInput(true)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${showCustomInput ? 'bg-indigo-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    ⌨️ Custom Input
                  </button>
                  {isAnalyzing && <span className="text-cyan-400 animate-pulse text-[10px]">⚡ AI analyzing...</span>}
                </div>
                <div className="flex items-center gap-3">
                  {aiAnalysis && !showCustomInput && (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-cyan-900/30 text-cyan-300 rounded text-[10px] font-bold border border-cyan-500/20">⏱ {aiAnalysis.timeComplexity}</span>
                      <span className="px-2 py-0.5 bg-purple-900/30 text-purple-300 rounded text-[10px] font-bold border border-purple-500/20">🧠 {aiAnalysis.spaceComplexity}</span>
                    </div>
                  )}
                  <button onClick={() => setTerminalExpanded(e => !e)} className="text-slate-500 hover:text-white transition-colors">
                    {terminalExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                  </button>
                  <button onClick={() => { setConsoleOutput(null); setAiAnalysis(null); }} className="text-slate-500 hover:text-red-400 transition-colors">
                    <XCircle size={12} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-hidden">
                {showCustomInput ? (
                  // ── CUSTOM INPUT TAB ────────────────────────────────────
                  <div className="h-full flex flex-col p-2 gap-2">
                    <p className="text-slate-400 text-[10px]">Type your custom stdin input here. When you click <span className="text-white font-bold">Run Code</span>, this will be passed as input to your program.</p>
                    <textarea
                      value={customInput}
                      onChange={e => setCustomInput(e.target.value)}
                      placeholder={`Example for Two Sum:\n4 9\n2 7 11 15`}
                      className="flex-1 w-full bg-slate-900 text-slate-200 border border-slate-700 rounded p-2 text-xs font-mono resize-none outline-none focus:border-indigo-500 placeholder:text-slate-600"
                      spellCheck={false}
                    />
                    <p className="text-[10px] text-slate-600">Note: Custom input is used when there are no built-in test cases for the current question, or when you want to test a specific scenario.</p>
                  </div>
                ) : (
                  // ── OUTPUT TAB ──────────────────────────────────────────
                  <div className="h-full overflow-y-auto">
                    {consoleOutput ? (
                      <>
                        <pre className="p-3 text-slate-300 whitespace-pre-wrap leading-relaxed">{consoleOutput.stdout}</pre>
                        {aiAnalysis && (
                          <div className="mx-3 mb-3 p-2 bg-indigo-900/20 border border-indigo-500/20 rounded text-[10px]">
                            <div className="text-indigo-300 font-bold mb-1">🤖 AI Review</div>
                            <div className="text-slate-300">{aiAnalysis.review}</div>
                            <div className="text-amber-300 mt-1">💡 {aiAnalysis.suggestion}</div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-600 text-[11px]">
                        Click <span className="mx-1 text-white font-bold">Run Code</span> to see output here
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 z-10 flex gap-4">
            <button
              onClick={handleRunTests}
              disabled={isCompiling || isEvaluating}
              className={`py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-600 transition-all shadow-lg flex items-center justify-center gap-2 ${isCompiling || isEvaluating ? 'opacity-50 cursor-wait' : ''}`}
            >
              {isCompiling ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
              Run Code
            </button>

            {!showReview.visible ? (
              <button
                onClick={handleSubmit}
                disabled={isEvaluating || session.status !== 'active'}
                className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-900/30 flex items-center gap-2 transform active:scale-95 transition-transform disabled:opacity-50"
              >
                {isEvaluating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                Submit to AI Judge
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-cyan-900/30 flex items-center gap-2 transform active:scale-95 transition-transform"
              >
                Next Challenge <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
