import React from 'react';
import { Dumbbell, Trophy } from 'lucide-react';

interface Props {
    onSelect: (mode: 'practice' | 'ranked') => void;
    onCancel: () => void;
}

export const GameModeSelector: React.FC<Props> = ({ onSelect, onCancel }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-[0_0_40px_rgba(6,182,212,0.15)] relative overflow-hidden">
                <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-tight">Select Verification Mode</h2>

                <div className="space-y-4">
                    {/* Practice Mode */}
                    <button
                        onClick={() => onSelect('practice')}
                        className="w-full flex items-start gap-4 p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-950/40 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all text-left group"
                    >
                        <div className="p-3 bg-cyan-900/50 rounded-lg group-hover:bg-cyan-500/20 text-cyan-400">
                            <Dumbbell size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-cyan-100 mb-1">Practice Arena</h3>
                            <p className="text-sm text-cyan-200/60 leading-relaxed">
                                Train with AI Hints. No time limit. Does not affect Skill DNA.
                            </p>
                        </div>
                    </button>

                    {/* Ranked Mode */}
                    <button
                        onClick={() => onSelect('ranked')}
                        className="w-full flex items-start gap-4 p-4 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 hover:border-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all text-left group"
                    >
                        <div className="p-3 bg-red-900/50 rounded-lg group-hover:bg-red-500/20 text-red-400">
                            <Trophy size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-red-100 mb-1">Ranked Assessment</h3>
                            <p className="text-sm text-red-200/60 leading-relaxed">
                                Live Proctoring. Strict Timer. Updates Global Rank.
                            </p>
                        </div>
                    </button>
                </div>

                <button
                    onClick={onCancel}
                    className="mt-6 w-full py-3 text-slate-400 hover:text-white transition-colors font-medium text-sm"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};
