import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Clock, Code2, Cpu } from 'lucide-react';
import { useGhostOpponent } from '../hooks/useGhostOpponent';

const TARGET_CODE = `function reverseLinkedList(head) {
  let prev = null;
  let current = head;
  
  while (current !== null) {
      let nextNode = current.next;
      current.next = prev;
      prev = current;
      current = nextNode;
  }
  
  return prev;
}`;

export const BattleArenaPage: React.FC = () => {
  const [userCode, setUserCode] = useState('// Your solution\nfunction reverseLinkedList(head) {\n\n}');
  const [userProgress, setUserProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

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

      {/* 2. SPLIT SCREEN EDITORS */}
      <div className="flex-1 flex overflow-hidden">

        {/* User Editor */}
        <div className="flex-1 flex flex-col border-r border-slate-800 relative group">
          <div className="h-8 shrink-0 bg-[#1e1e1e] flex items-center px-4 font-mono text-xs text-cyan-400/70 border-b border-slate-800 z-10">
            solution.js
          </div>
          {/* Cyberpunk Glow border element */}
          <div className="absolute inset-0 border-2 border-transparent group-focus-within:border-cyan-500/30 group-focus-within:shadow-[inset_0_0_20px_rgba(6,182,212,0.1)] pointer-events-none z-10 transition-all duration-500" />

          <div className="flex-1 relative">
            <Editor
              height="100%"
              defaultLanguage="javascript"
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
    </div>
  );
};
