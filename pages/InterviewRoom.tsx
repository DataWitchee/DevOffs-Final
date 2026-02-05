
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkillDomain } from '../types';
import { generateInterviewQuestion, evaluateInterviewResponse, analyzeEnvironmentSnapshot } from '../services/gemini';
import { Video, VideoOff, Timer, ShieldAlert, CheckCircle, ChevronRight, BarChart2, Cpu, Mic, Sun, User as UserIcon, Smartphone, Loader2, XCircle, RotateCw } from 'lucide-react';

interface Props {
  onComplete: (data: any) => void;
}

const QUESTIONS_COUNT = 20; // STRICT REQUIREMENT

export const InterviewRoom: React.FC<Props> = ({ onComplete }) => {
  const navigate = useNavigate();
  
  // Setup State
  const [domain, setDomain] = useState<SkillDomain>(SkillDomain.ALGORITHMS);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<'setup' | 'scan_360' | 'intro' | 'active' | 'evaluating' | 'summary'>('setup');
  
  // Environment Check State
  const [isAnalyzingEnv, setIsAnalyzingEnv] = useState(false);
  const [envCheck, setEnvCheck] = useState<{lighting: boolean; singlePerson: boolean; noDevices: boolean; feedback: string} | null>(null);
  const [currentRoundViolations, setCurrentRoundViolations] = useState<string[]>([]);
  const [scanComplete, setScanComplete] = useState(false);

  // AI State
  const [aiState, setAiState] = useState<'idle' | 'speaking_question' | 'listening' | 'processing' | 'speaking_feedback'>('idle');
  
  // Interview State
  const [round, setRound] = useState(0); 
  const [currentQuestionText, setCurrentQuestionText] = useState<string>(""); 
  const [timeLeft, setTimeLeft] = useState(0);
  const [maxTime, setMaxTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  
  // Data State
  const [history, setHistory] = useState<any[]>([]);
  const [lastScore, setLastScore] = useState(0); 
  
  // Voice State
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);

  // --- UTILS: Text To Speech ---
  useEffect(() => {
    const loadVoices = () => {
      const vs = window.speechSynthesis.getVoices();
      setVoices(vs);
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const speak = (text: string, onEnd?: () => void) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      const utterance = new SpeechSynthesisUtterance(text);
      const preferredVoice = 
        voices.find(v => v.name.includes("Google US English")) || 
        voices.find(v => v.name.includes("Samantha")) || 
        voices.find(v => v.lang.startsWith("en-"));
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 0.95; 
      utterance.pitch = 1.0;
      utterance.onend = () => { if (onEnd) onEnd(); };
      utterance.onerror = () => { if (onEnd) onEnd(); };
      window.speechSynthesis.speak(utterance);
    } else {
      if (onEnd) onEnd();
    }
  };

  // 1. SETUP & PERMISSIONS
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      setHasPermissions(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      alert("Camera and Microphone permissions are required.");
    }
  };

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, status]);

  const analyzeEnvironment = async () => {
    if (!videoRef.current || !hasPermissions) return;
    setIsAnalyzingEnv(true);
    setEnvCheck(null);
    try {
       const canvas = document.createElement('canvas');
       canvas.width = videoRef.current.videoWidth;
       canvas.height = videoRef.current.videoHeight;
       const ctx = canvas.getContext('2d');
       if (ctx) {
         ctx.drawImage(videoRef.current, 0, 0);
         const base64 = canvas.toDataURL('image/jpeg', 0.9);
         const result = await analyzeEnvironmentSnapshot(base64);
         setEnvCheck(result);
       }
    } catch (e) {
       setEnvCheck({ lighting: false, singlePerson: false, noDevices: false, feedback: "Error." });
    } finally {
       setIsAnalyzingEnv(false);
    }
  };

  // 360 Scan Step
  const performScan = () => {
     // Simulate user rotating logic
     setStatus('scan_360');
  };

  const confirmScan = () => {
      setScanComplete(true);
      setStatus('setup'); // Go back to verify lighting one last time
  };

  // 1.5 CONTINUOUS MONITORING
  useEffect(() => {
    let monitorInterval: any;
    const performCheck = async () => {
      if (status !== 'active' && status !== 'evaluating') return;
      if (!videoRef.current) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0);
          const base64 = canvas.toDataURL('image/jpeg', 0.6); 
          analyzeEnvironmentSnapshot(base64).then(result => {
             const violations: string[] = [];
             if (!result.lighting) violations.push("Poor Lighting / Face Obscured");
             if (!result.singlePerson) violations.push("Presence Check Failed (Must be 1 person)");
             if (!result.noDevices) violations.push("Prohibited Device Detected");
             if (violations.length > 0) {
                 setCurrentRoundViolations(prev => Array.from(new Set([...prev, ...violations])));
             }
          }).catch(e => console.warn("Proctor check skipped:", e));
        }
      } catch (e) {}
    };
    if (status === 'active' || status === 'evaluating') {
       monitorInterval = setInterval(performCheck, 4000);
    }
    return () => clearInterval(monitorInterval);
  }, [status]);

  // Enforce Anti-Cheat (Global Listeners)
  useEffect(() => {
    const handleContext = (e: Event) => e.preventDefault();
    const handleCopyPaste = (e: ClipboardEvent) => e.preventDefault();
    const handleVisibility = () => {
      if (document.hidden && status === 'active') {
         speak("Warning. Please keep the tab open.");
         setCurrentRoundViolations(prev => [...prev, "Tab Switch"]);
      }
    };
    if (status !== 'setup' && status !== 'summary' && status !== 'scan_360') {
      document.addEventListener('contextmenu', handleContext);
      document.addEventListener('copy', handleCopyPaste);
      document.addEventListener('paste', handleCopyPaste);
      document.addEventListener('visibilitychange', handleVisibility);
    }
    return () => {
      document.removeEventListener('contextmenu', handleContext);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [status]);

  // 2. SPEECH RECOGNITION SETUP
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = 'en-US';
      recog.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        setTranscript(prev => finalTranscript || prev);
      };
      recognitionRef.current = recog;
      setRecognition(recog);
    } else {
      alert("Browser not supported. Use Chrome.");
    }
  }, []);

  // 3. GAME FLOW
  const startInterview = async () => {
    setStatus('intro');
    speak(`Welcome to the ${domain} interview. I will ask you exactly ${QUESTIONS_COUNT} questions. No skips. Let's begin.`, () => {
       nextQuestion(1);
    });
  };

  const nextQuestion = async (roundNum: number) => {
    setCurrentRoundViolations([]); 
    if (roundNum > QUESTIONS_COUNT) {
      finishInterview();
      return;
    }

    setTranscript(""); 
    setRound(roundNum);
    setAiState('processing'); 

    const qData = await generateInterviewQuestion(domain, lastScore, roundNum);
    setCurrentQuestionText(qData.text);
    setMaxTime(qData.timeLimit);
    setTimeLeft(qData.timeLimit);
    
    setStatus('active');
    setAiState('speaking_question');
    
    speak(qData.text, () => {
      startListeningPhase();
    });
  };

  const startListeningPhase = () => {
    setAiState('listening');
    setIsRecording(true);
    try { recognitionRef.current?.start(); } catch(e) {}
  };

  const stopListeningPhase = () => {
    setIsRecording(false);
    try { recognitionRef.current?.stop(); } catch(e) {}
  };

  const submitAnswer = async () => {
    stopListeningPhase();
    setAiState('processing');
    
    const finalTranscript = transcript.trim() || "(No audio detected)";
    let result = await evaluateInterviewResponse(domain, currentQuestionText, finalTranscript);
    
    if (currentRoundViolations.length > 0) {
       result = {
          score: 0,
          feedback: `VIOLATION DETECTED: ${currentRoundViolations.join(", ")}. Integrity compromised.`,
          spokenFeedback: "Security violation detected. Zero points awarded."
       };
    }
    
    const newHistory = [...history, {
        round,
        question: currentQuestionText,
        answer: finalTranscript,
        score: result.score,
        feedback: result.feedback
    }];
    setHistory(newHistory);
    setLastScore(result.score); 

    setAiState('speaking_feedback');
    speak(result.spokenFeedback || "Okay, moving on.", () => {
       setTimeout(() => nextQuestion(round + 1), 500);
    });
  };

  const finishInterview = () => {
    setStatus('summary');
    setAiState('idle');
    speak("Interview complete. Generating your report now.");
  };

  const handleReturn = () => {
     const avgScore = Math.round(history.reduce((a, b) => a + b.score, 0) / Math.max(history.length, 1));
     onComplete({
        domain,
        score: avgScore,
        history
     });
  };

  useEffect(() => {
    if (aiState !== 'listening') return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          submitAnswer();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [aiState]);

  // --- RENDER ---
  if (status === 'scan_360') {
      return (
         <div className="max-w-4xl mx-auto py-12 text-center animate-fade-in">
             <RotateCw size={64} className="mx-auto text-cyan-400 mb-6 animate-spin-slow" />
             <h1 className="text-3xl font-bold text-white mb-4">360° Environment Scan Required</h1>
             <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                 Please slowly rotate your camera or laptop to show your entire surroundings. 
                 Ensure no prohibited objects (phones, notes, secondary screens) are present.
             </p>
             <div className="w-full aspect-video bg-black rounded-xl overflow-hidden mb-8 border border-slate-700">
                 <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
             </div>
             <button 
                onClick={confirmScan}
                className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl"
             >
                 Scan Complete - Environment Secure
             </button>
         </div>
      )
  }

  if (status === 'setup') {
    const isReady = hasPermissions && envCheck?.lighting && envCheck?.singlePerson && envCheck?.noDevices && scanComplete;

    return (
      <div className="max-w-4xl mx-auto py-12 animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">AI Voice Interview Setup</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
               <h3 className="text-xl font-bold text-white mb-4">1. Select Domain</h3>
               <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.values(SkillDomain).map(d => (
                    <button key={d} onClick={() => setDomain(d)} className={`w-full text-left px-4 py-3 rounded-xl transition-all ${domain === d ? 'bg-cyan-900/40 border border-cyan-500 text-cyan-400' : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'}`}>
                        {d}
                    </button>
                  ))}
               </div>
            </div>

            <div className="space-y-6">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col items-center">
                    <h3 className="text-xl font-bold text-white mb-4">2. Environment Check</h3>
                    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-4 border border-slate-600 shadow-inner group">
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                        {!hasPermissions && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
                                <span className="text-slate-400 text-sm flex items-center gap-2">
                                  <VideoOff size={16} /> Camera Access Needed
                                </span>
                            </div>
                        )}
                    </div>
                    
                    {!hasPermissions ? (
                        <button onClick={startCamera} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                            <Video size={18} /> Enable Camera & Mic
                        </button>
                    ) : !scanComplete ? (
                        <button onClick={performScan} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                            <RotateCw size={18} /> Perform 360° Scan
                        </button>
                    ) : (
                      <div className="w-full space-y-4">
                         <div className="grid grid-cols-3 gap-2">
                            <div className={`p-2 rounded-lg border flex flex-col items-center text-center gap-1 ${envCheck?.lighting ? 'bg-green-900/20 border-green-500 text-green-400' : 'bg-slate-700/50 border-slate-600 text-slate-400'}`}>
                               <Sun size={20} /> <span className="text-xs font-bold">Lighting</span>
                               {envCheck?.lighting ? <CheckCircle size={12}/> : null}
                            </div>
                            <div className={`p-2 rounded-lg border flex flex-col items-center text-center gap-1 ${envCheck?.singlePerson ? 'bg-green-900/20 border-green-500 text-green-400' : 'bg-slate-700/50 border-slate-600 text-slate-400'}`}>
                               <UserIcon size={20} /> <span className="text-xs font-bold">Identity</span>
                               {envCheck?.singlePerson ? <CheckCircle size={12}/> : null}
                            </div>
                            <div className={`p-2 rounded-lg border flex flex-col items-center text-center gap-1 ${envCheck?.noDevices ? 'bg-green-900/20 border-green-500 text-green-400' : 'bg-slate-700/50 border-slate-600 text-slate-400'}`}>
                               <Smartphone size={20} /> <span className="text-xs font-bold">Secure</span>
                               {envCheck?.noDevices ? <CheckCircle size={12}/> : null}
                            </div>
                         </div>
                         {!isReady && (
                            <button onClick={analyzeEnvironment} disabled={isAnalyzingEnv} className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-600">
                              {isAnalyzingEnv ? <Loader2 size={18} className="animate-spin" /> : <ShieldAlert size={18} />}
                              {envCheck ? "Retry Verification" : "Verify Environment"}
                            </button>
                         )}
                      </div>
                    )}
                </div>

                <button disabled={!isReady} onClick={startInterview} className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    Start Voice Interview ({QUESTIONS_COUNT} Questions)
                </button>
            </div>
        </div>
      </div>
    );
  }

  if (status === 'intro') {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-fade-in">
              <div className="w-32 h-32 rounded-full bg-cyan-900/20 border-2 border-cyan-500 flex items-center justify-center relative">
                  <Mic size={48} className="text-cyan-400" />
                  <div className="absolute inset-0 border-4 border-cyan-500 rounded-full animate-ping opacity-20"></div>
              </div>
              <h2 className="text-3xl font-bold text-white">Initializing AI...</h2>
              <p className="text-slate-400 max-w-md">Listen carefully. The AI will speak shortly.</p>
          </div>
      );
  }

  if (status === 'active' || status === 'evaluating') {
    return (
      <div className="h-[calc(100vh-90px)] flex flex-col gap-4 animate-fade-in max-w-6xl mx-auto w-full px-4">
         <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700 shrink-0">
             <div className="flex items-center gap-3">
                 <span className="text-sm font-bold text-slate-400">Question {round} / {QUESTIONS_COUNT}</span>
                 <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300 font-mono">{domain}</span>
             </div>
             <div className="flex-1 mx-8 relative h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className={`absolute top-0 bottom-0 left-0 transition-all duration-1000 ${timeLeft < 10 ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${(timeLeft / (maxTime || 60)) * 100}%` }}></div>
             </div>
             <div className={`flex items-center gap-2 font-mono text-2xl font-bold ${timeLeft < 15 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                 <Timer size={24} /> 0:{timeLeft < 10 ? '0' : ''}{timeLeft}
             </div>
         </div>
         <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0 pb-4">
             <div className="bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden relative h-full">
                 <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                     <div className={`w-32 h-32 rounded-full mb-8 flex items-center justify-center shadow-2xl border-4 transition-all duration-500 ${aiState === 'speaking_question' || aiState === 'speaking_feedback' ? 'border-cyan-400 bg-cyan-900/20 scale-110 shadow-cyan-500/50' : aiState === 'processing' ? 'border-purple-500 bg-purple-900/20 animate-pulse' : 'border-slate-600 bg-slate-700'}`}>
                         <Cpu size={64} className={`${aiState === 'processing' ? 'text-purple-400 animate-spin' : aiState === 'listening' ? 'text-slate-500' : 'text-cyan-400'}`} />
                     </div>
                     <h2 className="text-2xl font-bold text-white mb-2">
                        {aiState === 'speaking_question' && "AI Speaking..."}
                        {aiState === 'listening' && "Your Turn"}
                        {aiState === 'processing' && "Thinking..."}
                        {aiState === 'speaking_feedback' && "AI Feedback"}
                     </h2>
                 </div>
             </div>
             <div className="flex flex-col gap-4 h-full">
                 <div className="flex-1 bg-black rounded-2xl overflow-hidden border border-slate-700 relative shadow-2xl group">
                     <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                     {currentRoundViolations.length > 0 && (
                        <div className="absolute top-4 right-4 bg-red-600/90 text-white px-3 py-2 rounded shadow-lg border border-red-400 animate-pulse z-10 flex items-center gap-2">
                            <ShieldAlert size={16} />
                            <div className="text-xs font-bold">VIOLATION DETECTED</div>
                        </div>
                     )}
                 </div>
                 <button onClick={submitAnswer} disabled={aiState !== 'listening'} className={`w-full py-6 rounded-xl font-bold text-xl shadow-lg transition-all flex items-center justify-center gap-3 shrink-0 ${aiState === 'listening' ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30 cursor-pointer' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
                    {aiState === 'listening' ? "DONE SPEAKING" : 'WAITING FOR AI...'}
                 </button>
             </div>
         </div>
      </div>
    );
  }

  if (status === 'summary') {
      const avgScore = Math.round(history.reduce((a, b) => a + b.score, 0) / Math.max(history.length, 1));
      return (
        <div className="max-w-3xl mx-auto py-12 animate-fade-in">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-900/30 border border-green-500 mb-6 text-green-400 shadow-xl shadow-green-900/20">
                    <BarChart2 size={48} />
                </div>
                <h1 className="text-4xl font-bold text-white mb-2">Interview Complete</h1>
                <div className="flex items-center justify-center gap-2 mb-4">
                   <span className="text-6xl font-bold text-white">{avgScore}</span>
                   <span className="text-xl text-slate-500 self-end mb-2">/100</span>
                </div>
                <p className="text-slate-400">Your AI-Verified Voice Assessment Report</p>
            </div>
            <button onClick={handleReturn} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2">
               Save Results to Profile <ChevronRight size={20} />
            </button>
        </div>
      );
  }

  return null;
};
