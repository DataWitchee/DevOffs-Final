import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export type WarningType =
    | 'NO_FACE'
    | 'MULTIPLE_FACES'
    | 'LOOKING_LEFT'
    | 'LOOKING_RIGHT'
    | 'LOOKING_DOWN'
    | 'SIGNS_OF_STRESS'
    | 'SIGNS_OF_CONFUSION';

export interface ProctoringState {
    isInitialized: boolean;
    facesDetected: number;
    warnings: WarningType[];
    latestWarning: { type: WarningType; timestamp: number; message: string } | null;
}

interface UseProctoringOptions {
    onWarning?: (warning: { type: WarningType; timestamp: number; message: string }) => void;
    enabled?: boolean;
    gazeThresholdMs?: number; // How long user must look away before warning (e.g. 3000ms)
}

export const useProctoring = (videoRef: React.RefObject<HTMLVideoElement>, options: UseProctoringOptions = {}) => {
    const { enabled = true, gazeThresholdMs = 3000, onWarning } = options;

    const [proctorState, setProctorState] = useState<ProctoringState>({
        isInitialized: false,
        facesDetected: 0,
        warnings: [],
        latestWarning: null
    });

    const landmarkerRef = useRef<FaceLandmarker | null>(null);
    const rafId = useRef<number | null>(null);
    const lastVideoTime = useRef<number>(-1);

    // Time tracking for gaze to prevent instant flagging
    const gazeViolations = useRef({
        leftStart: 0,
        rightStart: 0,
        downStart: 0
    });

    // Helper to emit warnings safely
    const emitWarning = useCallback((type: WarningType, message: string) => {
        const ts = Date.now();
        const warningEvent = { type, timestamp: ts, message };

        setProctorState(prev => {
            // Prevent spamming the exact same warning multiple times per second
            if (prev.latestWarning && prev.latestWarning.type === type && (ts - prev.latestWarning.timestamp < 2000)) {
                return prev;
            }
            return {
                ...prev,
                warnings: [...prev.warnings, type],
                latestWarning: warningEvent
            };
        });

        if (onWarning) {
            onWarning(warningEvent);
        }
    }, [onWarning]);

    // Initialize MediaPipe FaceLandmarker
    useEffect(() => {
        let active = true;

        const initModel = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
                );

                const landmarker = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                        delegate: "GPU"
                    },
                    outputFaceBlendshapes: true,
                    outputFacialTransformationMatrixes: true,
                    runningMode: "VIDEO",
                    numFaces: 5 // Detect multiple faces to flag cheating
                });

                if (active) {
                    landmarkerRef.current = landmarker;
                    setProctorState(prev => ({ ...prev, isInitialized: true }));
                }
            } catch (e) {
                console.error("Failed to initialize FaceLandmarker:", e);
            }
        };

        if (enabled && !landmarkerRef.current) {
            initModel();
        }

        return () => {
            active = false;
            if (landmarkerRef.current) {
                landmarkerRef.current.close();
                landmarkerRef.current = null;
            }
            setProctorState(prev => ({ ...prev, isInitialized: false }));
        };
    }, [enabled]);

    // Rendering/Detection Loop
    useEffect(() => {
        if (!enabled || !proctorState.isInitialized || !videoRef.current) return;

        const video = videoRef.current;

        const analyzeFrame = async () => {
            if (video.readyState >= 2 && landmarkerRef.current) {
                if (video.currentTime !== lastVideoTime.current) {
                    lastVideoTime.current = video.currentTime;
                    const now = Date.now();

                    try {
                        const results = landmarkerRef.current.detectForVideo(video, performance.now());
                        const numFaces = results.faceBlendshapes.length;

                        setProctorState(prev => prev.facesDetected !== numFaces ? { ...prev, facesDetected: numFaces } : prev);

                        // 1. Person Detection
                        if (numFaces === 0) {
                            emitWarning('NO_FACE', 'No face detected in the frame. Please look at the camera.');
                            // Keep looking away timers reset if no face
                            gazeViolations.current = { leftStart: 0, rightStart: 0, downStart: 0 };
                        } else if (numFaces > 1) {
                            emitWarning('MULTIPLE_FACES', 'Multiple people detected in the environment. You must be alone.');
                        } else if (numFaces === 1) {

                            // 2. Gaze Tracking (Pose estimation via transformation matrix)
                            const matrix = results.facialTransformationMatrixes?.[0]?.data;
                            if (matrix) {
                                // Pitch (x-axis), Yaw (y-axis)
                                // Note: A real app would do rigorous Euler angle extraction from the 4x4 matrix. 
                                // For this implementation, we use simplified reliable thresholding on the rotation matrix elements.
                                const pitch = -Math.asin(Math.max(-1.0, Math.min(1.0, matrix[6]))); // R32
                                const yaw = Math.atan2(matrix[2], matrix[10]); // R13, R33

                                // Thresholds (radians)
                                const YAW_THRESHOLD = 0.35; // ~20 degrees left/right
                                const PITCH_DOWN_THRESHOLD = 0.25; // ~15 degrees down

                                // Check Yaw (Left/Right)
                                if (yaw > YAW_THRESHOLD) {
                                    if (!gazeViolations.current.leftStart) gazeViolations.current.leftStart = now;
                                    else if (now - gazeViolations.current.leftStart > gazeThresholdMs) {
                                        emitWarning('LOOKING_LEFT', 'Prolonged gaze away from screen (Left).');
                                        gazeViolations.current.leftStart = now; // reset after firing
                                    }
                                } else {
                                    gazeViolations.current.leftStart = 0;
                                }

                                if (yaw < -YAW_THRESHOLD) {
                                    if (!gazeViolations.current.rightStart) gazeViolations.current.rightStart = now;
                                    else if (now - gazeViolations.current.rightStart > gazeThresholdMs) {
                                        emitWarning('LOOKING_RIGHT', 'Prolonged gaze away from screen (Right).');
                                        gazeViolations.current.rightStart = now; // reset
                                    }
                                } else {
                                    gazeViolations.current.rightStart = 0;
                                }

                                // Check Pitch (Down)
                                if (pitch < -PITCH_DOWN_THRESHOLD) {
                                    if (!gazeViolations.current.downStart) gazeViolations.current.downStart = now;
                                    else if (now - gazeViolations.current.downStart > gazeThresholdMs) {
                                        emitWarning('LOOKING_DOWN', 'Prolonged gaze away from screen (Down).');
                                        gazeViolations.current.downStart = now; // reset
                                    }
                                } else {
                                    gazeViolations.current.downStart = 0;
                                }
                            }

                            // 3. Expression Analysis 
                            const blendshapes = results.faceBlendshapes[0].categories;
                            // Look for signs of stress or confusion using micro-expressions
                            const browInnerUp = blendshapes.find(b => b.categoryName === 'browInnerUp')?.score || 0;
                            const browDownLeft = blendshapes.find(b => b.categoryName === 'browDownLeft')?.score || 0;
                            const browDownRight = blendshapes.find(b => b.categoryName === 'browDownRight')?.score || 0;
                            const jawOpen = blendshapes.find(b => b.categoryName === 'jawOpen')?.score || 0;

                            // High brow scrunching often correlates with confusion or intense focus
                            if ((browDownLeft > 0.6 && browDownRight > 0.6) || (browInnerUp > 0.7 && jawOpen < 0.2)) {
                                // Only emit occasionally, this is a soft signal
                                if (Math.random() < 0.05) { // 5% chance per frame if sustained
                                    emitWarning('SIGNS_OF_CONFUSION', 'Candidate displaying sustained micro-expressions of confusion.');
                                }
                            }
                        }
                    } catch (e) {
                        // Inference errors (e.g. model not warm) are ignored
                    }
                }
            }
            rafId.current = requestAnimationFrame(analyzeFrame);
        };

        rafId.current = requestAnimationFrame(analyzeFrame);

        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, [enabled, proctorState.isInitialized, videoRef, gazeThresholdMs, emitWarning]);

    return proctorState;
};
