
import React, { useEffect, useRef, useState, useCallback } from 'react';
import TypewriterCat from './components/TypewriterCat';
import { visionService } from './services/visionService';
import { CatAction, Point } from './types';

// Interaction Config
// Increased thresholds because cat is now bigger on screen
const NOSE_THRESHOLD = 0.12; 
const HEAD_THRESHOLD = 0.28; 
const ACTION_DURATION_MS = 1000; // Reduced to 1s for snappier feedback

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
      } catch (err) {
        console.error(err);
        setDebugMsg(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    startCamera();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerAction = useCallback((action: CatAction) => {
    if (isAnimating.current) return;
    
    isAnimating.current = true;
    setCatAction(action);
    setDebugMsg(`Reacting: ${action}!`);

    setTimeout(() => {
        setCatAction(CatAction.IDLE);
        isAnimating.current = false;
        setDebugMsg("Idle");
    }, ACTION_DURATION_MS);
  }, []);

  const predictWebcam = () => {
    if (!videoRef.current) return;
    
    const results = visionService.detect(videoRef.current, Date.now());

    if (results && results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0]; // Just track one hand for simplicity

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
      
      // Smooth lookAt - slightly faster smoothing (0.15) for more flexible feel
      lookAtRef.current.x = lerp(lookAtRef.current.x, lookX, 0.15);
      lookAtRef.current.y = lerp(lookAtRef.current.y, lookY, 0.15);
      setCatLookAt({ x: lookAtRef.current.x, y: lookAtRef.current.y });

      // Hit Testing - Updated for the new large centered cat
      // Head is roughly top 40%, Nose is center 50%
      const catHeadTarget: Point = { x: 0.5, y: 0.35 }; 
      const catNoseTarget: Point = { x: 0.5, y: 0.5 };

      const distFingerToNose = Math.hypot(fX - catNoseTarget.x, fY - catNoseTarget.y);
      const distPalmToHead = Math.hypot(pX - catHeadTarget.x, pY - catHeadTarget.y);

      if (!isAnimating.current) {
          // Priority: Nose first
          if (distFingerToNose < NOSE_THRESHOLD) {
              triggerAction(CatAction.SNEEZE);
          }
          else if (distPalmToHead < HEAD_THRESHOLD) {
              // Randomly choose between Jump, Spin, or Shake for variety
              const possibleActions = [CatAction.JUMP, CatAction.SPIN, CatAction.SHAKE];
              const randomAction = possibleActions[Math.floor(Math.random() * possibleActions.length)];
              triggerAction(randomAction);
          }
      }
    } else {
        // No hand detected
        setCursorFinger(null);
        setCursorPalm(null);
        // Slowly return look to center
        lookAtRef.current.x = lerp(lookAtRef.current.x, 0, 0.05);
        lookAtRef.current.y = lerp(lookAtRef.current.y, 0, 0.05);
        setCatLookAt({ x: lookAtRef.current.x, y: lookAtRef.current.y });
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

      {/* Visual Cursors for Interaction Feedback */}
      {cursorFinger && (
          <div 
            className="absolute z-20 pointer-events-none text-4xl drop-shadow-lg transition-transform duration-75"
            style={{ 
                left: `${cursorFinger.x * 100}%`, 
                top: `${cursorFinger.y * 100}%`,
                transform: 'translate(-50%, -100%)' // Tip of finger at point
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
                <span className="text-xs uppercase tracking-wider font-bold text-gray-300">{debugMsg}</span>
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
            </div>
        </div>
      </div>
    </div>
  );
}
