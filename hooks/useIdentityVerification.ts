import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

interface UseIdentityResult {
    isVerifying: boolean;
    status: 'IDLE' | 'MATCH_SUCCESS' | 'UNAUTHORIZED_USER' | 'NO_FACE_DETECTED' | 'MULTIPLE_FACES';
    distance: number | null;
    error: string | null;
}

export function useIdentityVerification(
    videoElement: HTMLVideoElement | null,
    storedDescriptorArray: number[] | Float32Array | undefined,
    intervalMs: number = 5000
): UseIdentityResult {
    const [isVerifying, setIsVerifying] = useState(false);
    const [status, setStatus] = useState<UseIdentityResult['status']>('IDLE');
    const [distance, setDistance] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const modelsLoaded = useRef(false);
    const consecutiveFails = useRef(0);
    const lastBlinkTime = useRef<number>(Date.now());

    // Convert stored array back to Float32Array
    const storedDescriptor = storedDescriptorArray
        ? new Float32Array(storedDescriptorArray)
        : null;

    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
                ]);
                modelsLoaded.current = true;
            } catch (err) {
                setError("Failed to load Face Models in background.");
            }
        };
        loadModels();
    }, []);

    useEffect(() => {
        if (!videoElement || !storedDescriptor || !modelsLoaded.current) return;

        const verifyIdentity = async () => {
            setIsVerifying(true);
            try {
                // Detect all faces to ensure only 1 person is present
                const detections = await faceapi.detectAllFaces(videoElement, new faceapi.SsdMobilenetv1Options())
                    .withFaceLandmarks()
                    .withFaceExpressions()
                    .withFaceDescriptors();

                if (detections.length === 0) {
                    consecutiveFails.current += 1;
                    if (consecutiveFails.current > 2) {
                        setStatus('NO_FACE_DETECTED');
                    }
                    setIsVerifying(false);
                    return;
                }

                if (detections.length > 1) {
                    setStatus('MULTIPLE_FACES');
                    setIsVerifying(false);
                    return;
                }

                // Single face detected
                const detection = detections[0];

                // Calculate Euclidean distance
                const dist = faceapi.euclideanDistance(storedDescriptor, detection.descriptor);
                setDistance(dist);

                // Standard strictness threshold. < 0.6 is a match.
                if (dist > 0.6) {
                    consecutiveFails.current += 1;
                    // Require 2 consecutive fails to avoid false positives from motion blur
                    if (consecutiveFails.current >= 2) {
                        setStatus('UNAUTHORIZED_USER');
                    }
                } else {
                    // Success Path
                    consecutiveFails.current = 0;
                    setStatus('MATCH_SUCCESS');

                    // Liveness Check Strategy:
                    // face-api doesn't have a direct "blink" net, but we can infer liveness
                    // from natural micro-shifts in expressions or eye landmarks opening/closing.
                    // Realistically, the face changes slightly. If the distance to the *previous frame* 
                    // is exactly 0.000 for 15 seconds, it's a static photo spoof.
                    // For MVP, we check expression variance.
                    const isNeutral = detection.expressions.neutral > 0.99;
                    if (!isNeutral) {
                        lastBlinkTime.current = Date.now();
                    }

                    if (Date.now() - lastBlinkTime.current > 20000) {
                        setError("Liveness failed. No movement detected.");
                        setStatus('UNAUTHORIZED_USER');
                    } else {
                        setError(null);
                    }
                }

            } catch (err) {
                console.error("Verification err:", err);
            } finally {
                setIsVerifying(false);
            }
        };

        // Run verification loop
        const id = setInterval(verifyIdentity, intervalMs);
        return () => clearInterval(id);

    }, [videoElement, storedDescriptorArray, intervalMs]);

    return { isVerifying, status, distance, error };
}
