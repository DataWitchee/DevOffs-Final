import React from 'react';
import { motion, Variants } from 'framer-motion';
import { ResponsiveContainer, PolarGrid, PolarAngleAxis, Radar, RadarChart, Tooltip } from 'recharts';
import { ShieldCheck, TrendingUp, Trophy, Crosshair, Zap, BrainCircuit, Activity } from 'lucide-react';

// --- MOCK DATA ---
const userSkillDNA = [
    { subject: 'Problem Solving', A: 92, fullMark: 100 },
    { subject: 'Execution Speed', A: 85, fullMark: 100 },
    { subject: 'Conceptual Depth', A: 89, fullMark: 100 },
    { subject: 'AI Leverage', A: 95, fullMark: 100 },
    { subject: 'Risk Awareness', A: 80, fullMark: 100 },
];

const RECENT_BATTLES = [
    { domain: 'System Design', score: 94, status: 'Victory', date: '2h ago' },
    { domain: 'Algorithms', score: 88, status: 'Victory', date: '1d ago' },
    { domain: 'React internals', score: 75, status: 'Passed', date: '3d ago' },
];

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15 }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

export const SkillDashboard: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#070b14] text-slate-200 p-8 font-sans overflow-hidden relative">

            {/* Background Ambience */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-green-900/20 rounded-full blur-[120px] pointer-events-none"></div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-6xl mx-auto space-y-8 relative z-10"
            >
                {/* Header Section */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500 tracking-tight">
                            Verified Profile
                        </h1>
                        <p className="text-cyan-400/80 font-mono text-sm mt-1 flex items-center gap-2">
                            <Activity size={14} className="animate-pulse" /> DevOffs Identity Framework Active
                        </p>
                    </div>

                    <motion.div
                        animate={{ boxShadow: ["0px 0px 0px rgba(74,222,128,0)", "0px 0px 20px rgba(74,222,128,0.4)", "0px 0px 0px rgba(74,222,128,0)"] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full backdrop-blur-sm shadow-[0_0_15px_rgba(74,222,128,0.2)]"
                    >
                        <ShieldCheck className="text-green-400" size={18} />
                        <span className="text-green-300 font-bold tracking-wide text-sm">VERIFIED BY DEVOFFS</span>
                    </motion.div>
                </motion.div>

                {/* Core Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Main Radar Chart */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 relative group h-[450px]">
                        {/* Glass Container */}
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden">
                            {/* Decorative border gradient */}
                            <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

                            <h2 className="absolute top-6 left-8 text-xl font-bold flex items-center gap-2 text-white">
                                <BrainCircuit className="text-cyan-400" />
                                Cognitive Construct
                            </h2>

                            <div className="w-full h-full flex items-center justify-center pt-8">
                                <ResponsiveContainer width="90%" height="90%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={userSkillDNA}>
                                        <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                                        <PolarAngleAxis
                                            dataKey="subject"
                                            tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px' }}
                                            itemStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                                        />
                                        <Radar
                                            name="Skill Signature"
                                            dataKey="A"
                                            stroke="#22d3ee" // Cyan-400
                                            strokeWidth={3}
                                            fill="#22d3ee"
                                            fillOpacity={0.25}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Stats Column */}
                    <div className="flex flex-col gap-6">

                        {/* Global Rank Card */}
                        <motion.div variants={itemVariants} className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Trophy size={80} />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-slate-400 text-sm font-bold tracking-wider uppercase mb-1">Global Percentile</h3>
                                <div className="text-5xl font-black text-white mb-2 tracking-tighter shadow-cyan-500/50 drop-shadow-md">Top 5%</div>
                                <p className="text-cyan-400 text-sm flex items-center gap-1">
                                    <TrendingUp size={14} /> Outperforming 85,000+ candidates
                                </p>
                            </div>
                        </motion.div>

                        {/* Strengths Card */}
                        <motion.div variants={itemVariants} className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl flex-1">
                            <h3 className="text-slate-400 text-sm font-bold tracking-wider uppercase mb-4 flex items-center gap-2">
                                <Crosshair size={16} /> Core Competencies
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {['System Design', 'Dynamic Programming', 'React Internals', 'Node.js', 'Redis Caching'].map(skill => (
                                    <span key={skill} className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-200 font-medium hover:border-cyan-500/50 transition-colors">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </motion.div>

                    </div>
                </div>

                {/* Recent Battle History */}
                <motion.div variants={itemVariants} className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Zap className="text-yellow-400" /> Recent Proving Grounds
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {RECENT_BATTLES.map((battle, i) => (
                            <motion.div
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                                key={i}
                                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 flex flex-col justify-between h-32"
                            >
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-slate-200">{battle.domain}</span>
                                    <span className="text-xs font-mono text-slate-500">{battle.date}</span>
                                </div>
                                <div className="flex justify-between items-end mt-4">
                                    <div>
                                        <span className="text-3xl font-black text-white">{battle.score}</span>
                                        <span className="text-slate-500 font-mono text-xs ml-1">/100</span>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-bold uppercase rounded border ${battle.status === 'Victory' ? 'text-green-400 border-green-500/30 bg-green-900/20' : 'text-yellow-400 border-yellow-500/30 bg-yellow-900/20'}`}>
                                        {battle.status}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
};
