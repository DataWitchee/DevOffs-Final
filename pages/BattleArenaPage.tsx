import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Clock, Code2, Cpu, Play, CheckCircle, ShieldCheck, XCircle } from 'lucide-react';
import { localQuestions } from '../data/LocalQuestions';

// Grab the first DSA algorithm question dynamically
const activeQuestion = localQuestions.find(q => q.category === 'DSA') || localQuestions[0];
const TARGET_CODE = activeQuestion.starterCode || "";

export const BattleArenaPage: React.FC = () => {
  const [language, setLanguage] = useState<'javascript' | 'python' | 'cpp' | 'java' | 'plaintext'>('javascript');
  const [userCode, setUserCode] = useState(TARGET_CODE);
  const [userProgress, setUserProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  // Mock Runner State
  const [isCompiling, setIsCompiling] = useState(false);
  const [showReview, setShowReview] = useState<{ visible: boolean, logs: string[] }>({ visible: false, logs: [] });

  // MOCK SOCKET: Simulate opponent progress every 5 seconds
  const [ghostProgress, setGhostProgress] = useState(0);

  useEffect(() => {
    const mockSocket = setInterval(() => {
      setGhostProgress(prev => {
        if (prev >= 100) {
          clearInterval(mockSocket);
          return 100;
        }
        const jump = Math.floor(Math.random() * 15) + 5; // 5% to 20% jump
        return Math.min(100, prev + jump);
      });
    }, 5000);
    return () => clearInterval(mockSocket);
  }, []);

  const ghostCode = TARGET_CODE.substring(0, Math.floor((ghostProgress / 100) * TARGET_CODE.length));

  // Calculate User Progress (Mock logic: just based on code length relative to target)
  useEffect(() => {
    const calculatedProgress = Math.min(100, Math.floor((userCode.length / TARGET_CODE.length) * 100));
    setUserProgress(calculatedProgress);
  }, [userCode]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft < 60;

  // Handle Mock Runner
  const handleRunTests = () => {
    setIsCompiling(true);
    setShowReview({ visible: false, logs: [] });

    setTimeout(() => {
      setIsCompiling(false);

      if (language === 'plaintext') {
        setShowReview({
          visible: true,
          logs: [
            "[SYSTEM] Validating Pseudo Code Logic...",
            "✅ Structure Verified",
            "✅ Logic Flows Validated",
            "[SUCCESS] Conceptual solution approved."
          ]
        });
        return;
      }

      // Basic length check for mock validation
      const isLongEnough = userCode.length > TARGET_CODE.length - 20;

      if (isLongEnough) {
        setShowReview({
          visible: true,
          logs: [
            "[SYSTEM] Compiling solution...",
            "✅ Test Case 1 Passed",
            "✅ Test Case 2 Passed",
            "✅ Test Case 3 Passed (Hidden Limits)",
            "[SUCCESS] Verification Complete."
          ]
        });
        setUserProgress(100);
      } else {
        setShowReview({
          visible: true,
          logs: [
            "[SYSTEM] Compiling solution...",
            "❌ Test Case 1 FAILED: Output mismatch",
            "❌ Test Case 2 FAILED",
            "[ERROR] Review logic and try again."
          ]
        });
      }
    }, 1500);
  };

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-200 font-sans flex flex-col overflow-hidden selection:bg-cyan-900">

      {/* 1. TOP BAR / HUD */}
      <div className="h-16 shrink-0 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shadow-md relative z-10">

        {/* User Progress */}
        <div className="flex flex-col w-1/3 max-w-[300px]">
          <div className="flex justify-between items-end mb-1">
            <span className="font-bold text-cyan-400 text-sm flex items-center gap-1">
              <Code2 size={16} /> YOU
            </span>
            <span className="text-xs text-slate-400 font-mono">{userProgress}%</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-all duration-300"
              style={{ width: `${userProgress}%` }}
            />
          </div>
        </div>

        {/* Timer */}
        <div className="flex flex-col items-center">
          <div className={`flex items-center gap-2 text-3xl font-black font-mono tracking-widest ${isLowTime ? 'text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-slate-200'}`}>
            <Clock size={24} className={isLowTime ? 'animate-bounce' : ''} />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Ghost Progress */}
        <div className="flex flex-col w-1/3 max-w-[300px]">
          <div className="flex justify-between items-end mb-1">
            <span className="text-xs text-slate-400 font-mono">{ghostProgress}%</span>
            <span className="font-bold text-red-500 text-sm flex items-center gap-1">
              GHOST <Cpu size={16} />
            </span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex justify-end">
            <div
              className="h-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)] transition-all duration-300"
              style={{ width: `${ghostProgress}%` }}
            />
          </div>
        </div>

      </div>

      {/* 2. QUESTION HUD */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 shrink-0 flex gap-6">
        <div className="flex-1">
          <h2 className="text-white font-bold mb-2">{activeQuestion.questionText.split('\n')[0].replace('### ', '')}</h2>
          <p className="text-sm text-slate-400 whitespace-pre-wrap">{activeQuestion.questionText.split('\n').slice(1).join('\n')}</p>
        </div>
        <div className="w-1/3 bg-slate-950 p-4 rounded-lg border border-slate-800 self-start">
          <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Test Cases</div>
          <div className="font-mono text-xs text-slate-400 space-y-2">
            {activeQuestion.testCases?.slice(0, 2).map((tc, idx) => (
              <div key={idx}>
                <div><span className="text-cyan-500">Input:</span> {tc.input}</div>
                <div><span className="text-green-500">Output:</span> {tc.expectedOutput}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. SPLIT SCREEN EDITORS */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* User Editor */}
        <div className="flex-1 flex flex-col border-r border-slate-800 relative group">
          <div className="h-12 shrink-0 bg-[#1e1e1e] flex items-center justify-between px-4 border-b border-slate-800 z-10">
            <div className="font-mono text-xs text-cyan-400/70">solution.{language === 'javascript' ? 'js' : language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : 'txt'}</div>
            <select
              className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded px-2 py-1 outline-none"
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
            >
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="javascript">JavaScript</option>
              <option value="plaintext">Pseudo Code</option>
            </select>
          </div>
          {/* Cyberpunk Glow border element */}
          <div className="absolute inset-0 border-2 border-transparent group-focus-within:border-cyan-500/30 group-focus-within:shadow-[inset_0_0_20px_rgba(6,182,212,0.1)] pointer-events-none z-10 transition-all duration-500" />

          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={userCode}
              onChange={(val) => setUserCode(val || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'JetBrains Mono, monospace',
                padding: { top: 16 }
              }}
            />
          </div>
        </div>

        {/* Ghost Editor */}
        <div className="flex-1 flex flex-col relative bg-[#0a0a0a]">
          <div className="h-8 shrink-0 bg-[#121212] flex items-center px-4 font-mono text-xs text-red-500/50 border-b border-slate-800 z-10">
            opponent_sync.js <span className="ml-2 text-[10px] animate-pulse">(Live Stream)</span>
          </div>

          <div className="flex-1 relative opacity-70 pointer-events-none">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={ghostCode}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'JetBrains Mono, monospace',
                padding: { top: 16 },
                lineNumbers: 'off',
                glyphMargin: false,
                folding: false,
                matchBrackets: 'never',
                renderLineHighlight: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* 4. RUN / SUBMIT CONTROLS */}
      <div className="h-16 shrink-0 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-6 z-10 w-full">
        {showReview.visible && (
          <div className="absolute right-6 bottom-20 bg-slate-800 rounded-lg border border-indigo-500/50 p-4 shadow-xl z-20 w-80">
            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
              <ShieldCheck className="text-indigo-400" size={16} /> Run Report
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

        <div className="flex gap-4 ml-auto">
          <button
            disabled={isCompiling}
            onClick={handleRunTests}
            className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${isCompiling ? 'bg-slate-700 text-slate-400' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
          >
            {isCompiling ? 'Compiling...' : <><Play size={16} /> Run Tests</>}
          </button>
          <button
            onClick={handleRunTests}
            className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-900/20"
          >
            Submit Verification <CheckCircle size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
