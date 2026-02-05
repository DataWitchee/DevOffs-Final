
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TrialSession, SkillDomain, AntiCheatLog } from '../types';
import { generateSkillTrial, evaluatePerformance } from '../services/gemini';
import { AlertTriangle, Clock, Eye, Send, Code, Cpu, ShieldAlert, XCircle, CheckCircle, ChevronRight, ChevronLeft, Lock, Loader2 } from 'lucide-react';
import { SkillRadar } from '../components/SkillRadar';

interface Props {
  domain: SkillDomain;
  onComplete: (session: TrialSession) => void;
}

const TRIAL_DURATION = 900; // 15 minutes
const EXACT_QUESTION_COUNT = 10;

// Strict thresholds for rejection
const MAX_TAB_SWITCHES = 2; 
const MAX_PASTES = 0; 
const MAX_FOCUS_LOST_TIME = 5000; 

export const TrialRoom: React.FC<Props> = ({ domain, onComplete }) => {
  const [session, setSession] = useState<TrialSession>({
    id: crypto.randomUUID(),
    domain,
    status: 'generating',
  });
  const [timeLeft, setTimeLeft] = useState(TRIAL_DURATION);
  
  const [questions, setQuestions] = useState<{id: number, text: string}[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  const [antiCheat, setAntiCheat] = useState<AntiCheatLog>({
    tabSwitchCount: 0,
    pasteCount: 0,
    focusLostTime: 0,
  });
  const blurTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const init = async () => {
      // Force generating 10 questions
      const data = await generateSkillTrial(domain);
      const exactQuestions = data.questions.slice(0, EXACT_QUESTION_COUNT);
      
      setQuestions(exactQuestions);
      setSession(prev => ({
        ...prev,
        status: 'active',
        startTime: Date.now(),
        taskDescription: JSON.stringify(exactQuestions),
        constraints: data.constraints
      }));
    };
    init();
  }, [domain]);

  useEffect(() => {
    if (session.status !== 'active') return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [session.status]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        blurTimeRef.current = Date.now();
      } else {
        if (blurTimeRef.current) {
          const lostTime = Date.now() - blurTimeRef.current;
          setAntiCheat(prev => ({
            ...prev,
            tabSwitchCount: prev.tabSwitchCount + 1,
            focusLostTime: prev.focusLostTime + lostTime
          }));
          blurTimeRef.current = null;
        }
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
  }, []);

  const handleSubmit = useCallback(async () => {
    // STRICT INTEGRITY CHECK
    const violations: string[] = [];
    if (antiCheat.pasteCount > MAX_PASTES) violations.push(`Clipboard misuse detected.`);
    if (antiCheat.tabSwitchCount > MAX_TAB_SWITCHES) violations.push(`Excessive window switching.`);
    if (antiCheat.focusLostTime > MAX_FOCUS_LOST_TIME) violations.push(`Extended absence.`);

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

    setSession(prev => ({ ...prev, status: 'analyzing', endTime: Date.now() }));
    
    const taskSummary = questions.map(q => `Q${q.id}: ${q.text}`).join("\n");
    const solutionSummary = questions.map(q => `A${q.id}: ${answers[q.id] || "(No Answer)"}`).join("\n");

    const result = await evaluatePerformance(
      domain,
      taskSummary,
      solutionSummary,
      "N/A", 
      TRIAL_DURATION - timeLeft,
      antiCheat
    );

    setSession(prev => ({
      ...prev,
      status: 'completed',
      score: result.score,
      feedback: result.feedback
    }));

  }, [questions, answers, timeLeft, antiCheat, domain]);

  const handleAnswerChange = (text: string) => {
     setAnswers(prev => ({ ...prev, [questions[currentQuestionIdx].id]: text }));
  };

  const handleNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
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
        <h2 className="text-2xl font-bold text-white">Generating 10-Question Trial...</h2>
        <p className="text-slate-400 max-w-md">Our AI is constructing unique technical scenarios for {domain}.</p>
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
           <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
             isRejected ? 'bg-red-500/10 text-red-500' : 
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
              <div className={`p-6 rounded-2xl border ${
                  isRejected ? 'bg-red-950/20 border-red-900/50' : 
                  'bg-slate-800 border-slate-700'
                }`}>
                <h3 className="text-lg font-bold mb-2 text-white">Analysis</h3>
                <p className="text-slate-300 leading-relaxed">{session.feedback}</p>
              </div>

              <button 
                onClick={() => onComplete(session)}
                className={`w-full py-4 text-white font-bold rounded-xl transition-colors ${
                  isRejected ? 'bg-slate-700 hover:bg-slate-600' : 'bg-cyan-600 hover:bg-cyan-500'
                }`}
              >
                Return to Dashboard
              </button>
           </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIdx];

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
      <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div className="flex items-center gap-3">
           <span className="text-sm font-mono text-cyan-400 px-2 py-1 bg-cyan-950 rounded border border-cyan-900">{domain.toUpperCase()}</span>
        </div>
        <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
           <Clock size={20} />
           {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}
        </div>
        <div className="flex items-center gap-2">
           <span className="text-slate-400 text-sm mr-2">
             Question {currentQuestionIdx + 1} of {questions.length}
           </span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col overflow-hidden">
           <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
             <h2 className="text-lg font-bold text-white">Challenge #{currentQ?.id}</h2>
             <div className="flex gap-2">
                <button onClick={handlePrev} disabled={currentQuestionIdx === 0} className="p-1 rounded hover:bg-slate-700 disabled:opacity-30"><ChevronLeft /></button>
                <button onClick={handleNext} disabled={currentQuestionIdx === questions.length - 1} className="p-1 rounded hover:bg-slate-700 disabled:opacity-30"><ChevronRight /></button>
             </div>
           </div>
           <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="prose prose-invert max-w-none select-none cursor-default" onCopy={preventCopy} onContextMenu={(e) => e.preventDefault()}>
                <p className="text-lg text-slate-200">{currentQ?.text}</p>
              </div>
           </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-700 flex flex-col overflow-hidden relative group">
           <div className="p-2 bg-[#1e293b] flex items-center gap-2 border-b border-slate-700">
              <span className="text-xs text-slate-400 font-mono">answer_q{currentQ?.id}.txt</span>
           </div>
           <textarea 
              value={answers[currentQ?.id] || ""}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="flex-1 w-full bg-[#0f172a] text-slate-200 p-4 font-mono text-sm outline-none resize-none"
              placeholder="// Write your solution..."
              spellCheck={false}
           />
           {currentQuestionIdx === questions.length - 1 && (
              <div className="absolute bottom-6 right-6 z-10">
                 <button onClick={handleSubmit} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-900/30 flex items-center gap-2">
                   Submit All 10 Answers <Send size={18} />
                 </button>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
