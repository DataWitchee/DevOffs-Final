import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Loader2, ArrowRight, User as UserIcon } from 'lucide-react';
import { authService } from '../services/auth';

export const AuthPage = ({ onLogin }: { onLogin: (user: any) => void }) => {
    const navigate = useNavigate();
    const [isLoginWalk, setIsLoginWalk] = useState(true);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // UI State
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Email Validation Regex
    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            return setError('Please fill in all required fields.');
        }
        if (!isValidEmail(email)) {
            return setError('Please enter a valid email format.');
        }
        if (!isLoginWalk && !name) {
            return setError('Please enter your name.');
        }

        setIsLoading(true);
        setError('');

        try {
            let user;
            if (isLoginWalk) {
                user = await authService.login(email, password);
            } else {
                user = await authService.register(email, password);
                // Force name update in background (Optional based on how strict Firestore rules are)
                if (user) {
                    authService.updateUser({ ...user, name });
                    user.name = name;
                }
            }
            onLogin(user);
            navigate('/');
        } catch (err: any) {
            // Clean Firebase error messages
            const msg = err.message || 'Authentication failed.';
            const cleanMsg = msg.replace(/Firebase: Error.*?\(auth\//, '').replace(/\)/, '').replace(/-/g, ' ');
            setError(cleanMsg.charAt(0).toUpperCase() + cleanMsg.slice(1));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialAuth = async (provider: 'google' | 'apple') => {
        setIsLoading(true);
        setError('');
        try {
            const user = provider === 'google'
                ? await authService.loginWithGoogle()
                : await authService.loginWithApple();

            onLogin(user);
            navigate('/');
        } catch (err: any) {
            if (err.code === 'auth/popup-closed-by-user') {
                setError('Sign-in window was closed.');
            } else {
                setError(`Failed to authenticate with ${provider}.`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center relative overflow-hidden select-none">
            {/* Deep Cyberpunk Abstract Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
                {/* Subtle dot matrix grid overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50 z-0"></div>
            </div>

            <div className="relative z-10 w-full max-w-md p-6">

                {/* Brand Header */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4 shadow-lg shadow-cyan-500/30 border border-white/10">
                        <Lock className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Verified Intelligence</h1>
                    <p className="text-slate-400 mt-2 text-sm font-medium uppercase tracking-wider">DevOffs - Proof of Skill</p>
                </div>

                {/* Glassmorphism Card */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl transition-all duration-500 animate-fade-in">

                    <div className="flex bg-slate-900/50 rounded-lg p-1 mb-8 border border-white/5">
                        <button
                            type="button"
                            onClick={() => { setIsLoginWalk(true); setError(''); }}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-200 ${isLoginWalk ? 'bg-cyan-600/90 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Log In
                        </button>
                        <button
                            type="button"
                            onClick={() => { setIsLoginWalk(false); setError(''); }}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-200 ${!isLoginWalk ? 'bg-cyan-600/90 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-400 text-sm animate-fade-in">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {!isLoginWalk && (
                            <div className="relative animate-fade-in">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <UserIcon size={18} className="text-slate-500" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-100 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder-slate-500"
                                />
                            </div>
                        )}

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail size={18} className="text-slate-500" />
                            </div>
                            <input
                                type="email"
                                placeholder="Enclave Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-100 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder-slate-500"
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock size={18} className="text-slate-500" />
                            </div>
                            <input
                                type="password"
                                placeholder="Terminal Cipher (Password)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-100 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder-slate-500"
                            />
                            {/* Optional Password Strength Indicator for Sign Up */}
                            {!isLoginWalk && password.length > 0 && (
                                <div className="absolute right-4 top-3.5 flex gap-1">
                                    <div className={`h-1.5 w-4 rounded-full ${password.length > 4 ? 'bg-amber-500' : 'bg-slate-700'}`}></div>
                                    <div className={`h-1.5 w-4 rounded-full ${password.length > 7 ? 'bg-cyan-500' : 'bg-slate-700'}`}></div>
                                    <div className={`h-1.5 w-4 rounded-full ${password.length > 10 ? 'bg-green-500' : 'bg-slate-700'}`}></div>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.2)] hover:shadow-[0_0_25px_rgba(8,145,178,0.4)] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {isLoading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    {isLoginWalk ? 'Initialize Session' : 'Generate Identity'}
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700/60"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-[#0f172a] text-slate-500 font-medium tracking-wide border border-slate-700/60 rounded-full py-0.5" style={{ background: 'var(--tw-backdrop-blur)' }}>OR CONTINUE WITH</span>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => handleSocialAuth('google')}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {/* Google SVG */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSocialAuth('apple')}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-3 py-3.5 px-4 bg-slate-900 hover:bg-black text-white rounded-xl border border-slate-700 font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {/* Apple SVG */}
                            <svg className="w-5 h-5" viewBox="0 0 384 512" fill="currentColor">
                                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                            </svg>
                            Apple
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};
