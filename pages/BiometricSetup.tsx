import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import { Camera, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { User } from '../types';
import { authService } from '../services/auth';

interface BiometricSetupProps {
    user: User;
    onSave: (user: User) => void;
}

export const BiometricSetup: React.FC<BiometricSetupProps> = ({ user, onSave }) => {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);

    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Load Models on Mount
    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models'; // CDN for demo, should be local in prod
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                    faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
                ]);
                setIsModelsLoaded(true);
                startCamera();
            } catch (err) {
                console.error("Failed to load FaceAPI models", err);
                setError("Failed to initialize biometric models. Please check your network.");
            }
        };
        loadModels();

        return () => {
            // Cleanup camera on unmount
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            setError("Webcam access denied. Biometric enrollment requires camera setup.");
        }
    };

    const handleEnrollIdentity = async () => {
        if (!videoRef.current || !isModelsLoaded) return;

        setIsScanning(true);
        setScanProgress(0);
        setError(null);
        setSuccessMsg(null);

        try {
            // Simulate scanning time for UX
            const progressInterval = setInterval(() => {
                setScanProgress(prev => Math.min(prev + 15, 90));
            }, 200);

            // 1. Detect single face with highest confidence
            const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options())
                .withFaceLandmarks()
                .withFaceExpressions()
                .withAgeAndGender()
                .withFaceDescriptor();

            clearInterval(progressInterval);

            if (!detection) {
                throw new Error("No face detected. Please look directly at the camera in good lighting.");
            }

            if (detection.detection.score < 0.85) {
                throw new Error("Detection confidence too low. Please adjust lighting and try again.");
            }

            setScanProgress(100);

            // 2. Prepare Biometric Data
            // Convert Float32Array to standard Array for Firestore serialization
            const descriptorArray = Array.from(detection.descriptor);

            const sortedExpressions = Object.entries(detection.expressions)
                .sort((a, b) => b[1] - a[1]);
            const topExpression = sortedExpressions[0][0];

            const updatedUser: User = {
                ...user,
                biometrics: {
                    descriptor: descriptorArray,
                    age: Math.round(detection.age),
                    gender: detection.gender,
                    expressions: detection.expressions as unknown as Record<string, number>
                },
                isOnboarded: true // Assuming this completes setup
            };

            // 3. Save to Firebase
            await authService.updateUser(updatedUser);
            onSave(updatedUser);

            setSuccessMsg(`Identity Verified: Looks like a ${Math.round(detection.age)} yo ${detection.gender} looking mostly ${topExpression}. Securing profile...`);

            // Redirect after short delay
            setTimeout(() => {
                navigate('/');
            }, 3000);

        } catch (err: any) {
            setError(err.message || "An error occurred during facial scanning.");
            setIsScanning(false);
            setScanProgress(0);
        }
    };

    const bypassForDemo = async () => {
        setIsScanning(true);
        setScanProgress(100);
        const updatedUser: User = {
            ...user,
            biometrics: {
                descriptor: Array.from(new Float32Array(128).fill(0.1)),
                age: 25,
                gender: "Demo",
                expressions: { neutral: 1, happy: 0, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 0 } as any
            },
            isCertified: true, // Auto Certify for Demo
            isOnboarded: true,
            stats: {
                ...user.stats,
                examsPassed: (user.stats?.examsPassed || 0) + 1,
                topPercentile: 5,
                arenaWins: (user.stats?.arenaWins || 0) + 10,
                trialsCompleted: (user.stats?.trialsCompleted || 0) + 20,
                globalRank: user.stats?.globalRank || 0
            }
        };
        await authService.updateUser(updatedUser);
        onSave(updatedUser);
        setSuccessMsg("Demo Bypass Engaged! You are now fully Certified.");
        setTimeout(() => navigate('/'), 2000);
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 selection:bg-cyan-500/30">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">

                {/* Header */}
                <div className="text-center mb-8 relative z-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 mb-4 border border-cyan-500/20">
                        <ShieldCheck className="text-cyan-400 w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Biometric Identity Shield</h1>
                    <p className="text-slate-400">Protect your certifications with military-grade facial verification.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 relative z-10">
                    {/* Left: Video Feed */}
                    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
                        {!isModelsLoaded && !error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-20">
                                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-2" />
                                <span className="text-sm font-medium text-cyan-400">Loading Neural Models...</span>
                            </div>
                        )}
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className={`w-full h-full object-cover transform scale-x-[-1] ${isScanning ? 'opacity-80 mix-blend-luminosity' : ''}`}
                        />

                        {/* Scanning Overlay Grid */}
                        {isScanning && (
                            <div className="absolute inset-0 z-10 pointer-events-none">
                                <div className="w-full h-full bg-[linear-gradient(rgba(8,145,178,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(8,145,178,0.2)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-50"></div>
                                <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)] animate-scan"></div>
                            </div>
                        )}
                    </div>

                    {/* Right: Controls & Details */}
                    <div className="flex flex-col justify-center space-y-6">

                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 text-sm animate-fade-in">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        {successMsg && (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3 text-green-400 text-sm animate-fade-in">
                                <CheckCircle2 className="w-5 h-5 shrink-0" />
                                <p>{successMsg}</p>
                            </div>
                        )}

                        {!successMsg && (
                            <>
                                <div className="space-y-4 text-sm text-slate-300">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                                        <p>Look directly at the camera.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                                        <p>Ensure your face is well-lit.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                                        <p>Remove glasses or masks if possible.</p>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    {isScanning ? (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-medium text-cyan-400">
                                                <span>Extracting 128-Point Descriptor</span>
                                                <span>{scanProgress}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-cyan-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                                                    style={{ width: `${scanProgress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleEnrollIdentity}
                                            disabled={!isModelsLoaded}
                                            className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-cyan-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Camera className="w-5 h-5" />
                                            Capture Identity
                                        </button>
                                    )}
                                </div>
                            </>
                        )}

                        {/* DEMO BYPASS BUTTON (Always Visible) */}
                        <button
                            onClick={bypassForDemo}
                            className="w-full mt-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm font-bold rounded-xl border border-dashed border-slate-600 transition-all hover:text-white hover:border-cyan-500"
                        >
                            [DEMO] Override Model Error & Instant Certify
                        </button>
                    </div>
                </div>
            </div>

            {/* CSS for scanning animation */}
            <style>{`
          @keyframes scan {
             0% { transform: translateY(-100%); opacity: 0; }
             10% { opacity: 1; }
             90% { opacity: 1; }
             100% { transform: translateY(480px); opacity: 0; }
          }
          .animate-scan {
             animation: scan 3s linear infinite;
          }
       `}</style>
        </div>
    );
};
