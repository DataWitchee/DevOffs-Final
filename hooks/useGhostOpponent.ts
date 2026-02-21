import { useState, useEffect, useRef } from 'react';

interface UseGhostOpponentProps {
    targetCode: string;
    speed: number; // base characters per second
}

export const useGhostOpponent = ({ targetCode, speed }: UseGhostOpponentProps) => {
    const [ghostCode, setGhostCode] = useState('');
    const [progress, setProgress] = useState(0);

    const targetChars = useRef(targetCode.split(''));
    const currentIdx = useRef(0);
    const mistakeChars = useRef<number>(0);

    // Convert speed (chars/sec) to base ms delay per char
    const baseDelay = 1000 / speed;

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        let isMounted = true;

        const typeNextChar = () => {
            if (!isMounted) return;

            // 1. Check if finished
            if (currentIdx.current >= targetChars.current.length && mistakeChars.current === 0) {
                setProgress(100);
                return;
            }

            // 2. Handle Mistake Correction (Dynamic Backspacing)
            if (mistakeChars.current > 0) {
                setGhostCode(prev => prev.slice(0, -1));
                mistakeChars.current--;
                // Backspaces happen faster
                timeoutId = setTimeout(typeNextChar, baseDelay * 0.5);
                return;
            }

            // 3. Simulated "Thinking" Pause (2% chance to pause for 1-2 seconds)
            const thinkProbability = 0.02;
            if (Math.random() < thinkProbability) {
                timeoutId = setTimeout(typeNextChar, Math.random() * 1500 + 1000);
                return;
            }

            // 4. Simulated "Mistake" Typing (3% chance to type wrong character)
            const mistakeProbability = 0.03;
            if (Math.random() < mistakeProbability) {
                const randomChar = String.fromCharCode(Math.floor(Math.random() * 26) + 97);
                setGhostCode(prev => prev + randomChar);
                // Queue 1 to 3 backspaces to fix this mistake shortly
                mistakeChars.current = Math.floor(Math.random() * 3) + 1;
                timeoutId = setTimeout(typeNextChar, baseDelay);
                return;
            }

            // 5. Normal Typing
            setGhostCode(prev => prev + targetChars.current[currentIdx.current]);
            currentIdx.current++;

            // Update Progress
            const calculatedProgress = Math.floor((currentIdx.current / targetChars.current.length) * 100);
            setProgress(calculatedProgress);

            // Add slight jitter to typing speed (humanization)
            const jitter = Math.random() * (baseDelay * 0.5) - (baseDelay * 0.25);
            timeoutId = setTimeout(typeNextChar, baseDelay + jitter);
        };

        // Start typing loop
        typeNextChar();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [targetCode, speed, baseDelay]);

    return { ghostCode, progress };
};
