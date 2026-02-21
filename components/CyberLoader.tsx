import React, { useEffect, useState } from 'react';

interface Props {
    text?: string;
}

export const CyberLoader: React.FC<Props> = ({ text = "Synthesizing Unique Challenge..." }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(p => {
                if (p >= 100) return 100;
                return Math.min(100, p + Math.floor(Math.random() * 10) + 2);
            });
        }, 150);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 px-4 animate-fade-in">
            <div className="w-full max-w-md space-y-6">
                <div className="flex justify-between items-end text-cyan-500 font-mono tracking-widest text-sm mb-2">
                    <span className="animate-pulse">{text}</span>
                    <span>{progress}%</span>
                </div>

                <div className="h-1.5 w-full bg-slate-900 overflow-hidden relative border border-slate-800 rounded-full">
                    <div
                        className="absolute top-0 left-0 h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)] transition-all duration-200 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Binary / Matrix flair */}
                <div className="text-xs font-mono text-cyan-900/40 break-all overflow-hidden h-16 relative select-none">
                    01010011 01101011 01101001 01101100 01101100 00100000 01000100 01001110 01000001 00100000 01010110 01100101 01110010 01101001 01100110 01101001 01100011 01100001 01110100 01101001 01101111 01101110 00100000 01010011 01111001 01110011 01110100 01100101 01101101 00100000 01001001 01101110 01101001 01110100 01101001 01100001 01101100 01101001 01111010 01100101 01100100
                </div>
            </div>
        </div>
    );
};
