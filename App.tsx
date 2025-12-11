
import React, { useEffect, useRef, useState, useCallback } from 'react';
import TypewriterCat from './components/TypewriterCat';
import { visionService } from './services/visionService';
import { CatAction, Point } from './types';

// Interaction Config
const NOSE_THRESHOLD = 0.12; 
const HEAD_THRESHOLD = 0.28; 
const TAIL_THRESHOLD = 0.15; 
const ACTION_DURATION_MS = 1000; 

// Simple linear interpolation for smoothing
const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number>();
  const [loaded, setLoaded] = useState(false);
  const [catAction, setCatAction] = useState<CatAction>(CatAction.IDLE);
  const [debugMsg, setDebugMsg] = useState("Initializing Vision...");
  
  // Track smoothed positions for visual cursors
  const [cursorFinger, setCursorFinger] = useState<Point | null>(null);
  const [cursorPalm, setCursorPalm] = useState<Point | null>(null);
  
  // Interaction State
  const isAnimating = useRef(false);
  const rawFinger = useRef<Point>({x: 0, y: 0});
  const rawPalm = useRef<Point>({x: 0, y: 0});

  // Derived state for Cat "Look At" behavior
  const lookAtRef = useRef<Point>({x: 0, y: 0});
  const [catLookAt, setCatLookAt] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        await visionService.initialize();
        setDebugMsg("Waking up kitty...");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 1280,
            height: 720,
            facingMode: 'user'
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', () => {
            setLoaded(true);
            setDebugMsg("Pet the cat!");
            predictWebcam();
          });
        }
      } catch (err: any) {
        console.error(err);
        const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
        setDebugMsg(`Error: ${msg}`);
      }
    };

    startCamera();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerAction = useCallback((action: CatAction) => {
    if (isAnimating.current && action !== CatAction.TAIL_WAG) return;
    
    if (action === CatAction.TAIL_WAG) {
        setCatAction(CatAction.TAIL_WAG);
        isAnimating.current = true;
        setDebugMsg("Tail Wag!");
    } else {
        isAnimating.current = true;
        setCatAction(action);
        setDebugMsg(`Reacting: ${action}!`);
    }

    setTimeout(() => {
        setCatAction(CatAction.IDLE);
        isAnimating.current = false;
        setDebugMsg("Idle");
    }, ACTION_DURATION_MS);
  }, []);

  const predictWebcam = () => {
    if (!videoRef.current) return;
    
    try {
        const results = visionService.detect(videoRef.current, Date.now());
    
        if (results && results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0]; // Just track one hand
    
          // 8: Index Tip, 9: Middle MCP (Palm)
          const indexTip = landmarks[8];
          const palmCenter = landmarks[9]; 
    
          // Mirror X for user-facing camera logic
          const targetFingerX = 1 - indexTip.x;
          const targetFingerY = indexTip.y;
          
          const targetPalmX = 1 - palmCenter.x;
          const targetPalmY = palmCenter.y;
    
          // Smooth the raw inputs
          rawFinger.current.x = lerp(rawFinger.current.x, targetFingerX, 0.2);
          rawFinger.current.y = lerp(rawFinger.current.y, targetFingerY, 0.2);
          
          rawPalm.current.x = lerp(rawPalm.current.x, targetPalmX, 0.2);
          rawPalm.current.y = lerp(rawPalm.current.y, targetPalmY, 0.2);
    
          // Update React State for Cursors
          setCursorFinger({ ...rawFinger.current });
          setCursorPalm({ ...rawPalm.current });
    
          // Cat Logic
          const fX = rawFinger.current.x;
          const fY = rawFinger.current.y;
          const pX = rawPalm.current.x;
          const pY = rawPalm.current.y;
    
          // Calculate "Look At" vector (Relative to center 0.5, 0.5)
          const lookX = (pX - 0.5) * 2;
          const lookY = (pY - 0.5) * 2;
          
          lookAtRef.current.x = lerp(lookAtRef.current.x, lookX, 0.15);
          lookAtRef.current.y = lerp(lookAtRef.current.y, lookY, 0.15);
          setCatLookAt({ x: lookAtRef.current.x, y: lookAtRef.current.y });
    
          // Hit Testing
          const catHeadTarget: Point = { x: 0.5, y: 0.35 }; 
          const catNoseTarget: Point = { x: 0.5, y: 0.5 };
          const catTailTarget: Point = { x: 0.68, y: 0.75 };
    
          const distFingerToNose = Math.hypot(fX - catNoseTarget.x, fY - catNoseTarget.y);
          const distPalmToHead = Math.hypot(pX - catHeadTarget.x, pY - catHeadTarget.y);
          const distFingerToTail = Math.hypot(fX - catTailTarget.x, fY - catTailTarget.y);
    
          if (!isAnimating.current || catAction === CatAction.TAIL_WAG) {
              if (distFingerToNose < NOSE_THRESHOLD) {
                  triggerAction(CatAction.SNEEZE);
              }
              else if (distFingerToTail < TAIL_THRESHOLD) {
                  triggerAction(CatAction.TAIL_WAG);
              }
              else if (distPalmToHead < HEAD_THRESHOLD) {
                  const possibleActions = [CatAction.JUMP, CatAction.SPIN, CatAction.SHAKE];
                  const randomAction = possibleActions[Math.floor(Math.random() * possibleActions.length)];
                  triggerAction(randomAction);
              }
          }
        } else {
            // No hand detected
            setCursorFinger(null);
            setCursorPalm(null);
            lookAtRef.current.x = lerp(lookAtRef.current.x, 0, 0.05);
            lookAtRef.current.y = lerp(lookAtRef.current.y, 0, 0.05);
            setCatLookAt({ x: lookAtRef.current.x, y: lookAtRef.current.y });
        }
    } catch (e: any) {
        // Log but don't crash loop immediately, maybe one bad frame
        console.warn("Prediction Error:", e);
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900 flex justify-center items-center font-sans">
      
      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 opacity-30 blur-sm" 
      />

      {/* Cat Layer */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-center items-center z-10">
        <TypewriterCat 
            action={catAction} 
            onAnimationEnd={() => {}}
            lookAt={catLookAt} 
        />
      </div>

      {/* Visual Cursors */}
      {cursorFinger && (
          <div 
            className="absolute z-20 pointer-events-none text-4xl drop-shadow-lg transition-transform duration-75"
            style={{ 
                left: `${cursorFinger.x * 100}%`, 
                top: `${cursorFinger.y * 100}%`,
                transform: 'translate(-50%, -100%)' 
            }}
          >
              👆
          </div>
      )}
      {cursorPalm && (
          <div 
            className="absolute z-20 pointer-events-none w-24 h-24 border-4 border-yellow-400/50 rounded-full transition-all duration-75 flex items-center justify-center"
            style={{ 
                left: `${cursorPalm.x * 100}%`, 
                top: `${cursorPalm.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 30px rgba(250, 204, 21, 0.4)'
            }}
          >
              <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
          </div>
      )}

      {/* UI / Instructions */}
      <div className="absolute top-6 left-6 max-w-sm z-30">
        <div className="bg-black/60 backdrop-blur-xl text-white p-6 rounded-3xl border border-white/10 shadow-2xl">
            <h1 className="text-3xl font-black mb-1 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">
                Cartoon Kitty
            </h1>
            <div className="flex items-center gap-2 mb-4">
                <div className={`w-3 h-3 rounded-full ${loaded ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-red-400'}`} />
                <span className="text-xs uppercase tracking-wider font-bold text-gray-300">
                  {typeof debugMsg === 'string' ? debugMsg : 'Processing...'}
                </span>
            </div>
            
            <div className="space-y-4">
                <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        ✋
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">Pet Head</p>
                        <p className="text-xs text-amber-200/70">Jump / Spin / Shake</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        ☝️
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">Boop Nose</p>
                        <p className="text-xs text-blue-200/70">Finger on nose = Sneeze</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        🌿
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">Tickle Tail</p>
                        <p className="text-xs text-green-200/70">Touch tail = Happy Wag</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
