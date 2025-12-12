
import React, { useEffect, useRef, useState, useCallback } from 'react';
import TypewriterCat from './components/TypewriterCat';
import { visionService } from './services/visionService';
import { liveService } from './services/liveService';
import { CatAction, Point } from './types';
import { GoogleGenAI } from "@google/genai";

// Interaction Config (Adjusted for 1.25x scale)
const NOSE_THRESHOLD = 0.15; 
const HEAD_THRESHOLD = 0.35; 
const TAIL_THRESHOLD = 0.20; 
const ACTION_DURATION_MS = 1000; 

// Simple linear interpolation for smoothing
const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

// Helper to convert file to Base64
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const [loaded, setLoaded] = useState(false);
  const [catAction, setCatAction] = useState<CatAction>(CatAction.IDLE);
  const [debugMsg, setDebugMsg] = useState("Initializing Vision...");
  const [furColor, setFurColor] = useState<'amber' | 'pink' | 'blue'>('amber');
  const [bowColor, setBowColor] = useState<'pink' | 'red' | 'black' | 'purple'>('pink');
  
  // Voice State
  const [isTalking, setIsTalking] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Ready to chat");

  // Hand Tracking State
  const [cursorFinger, setCursorFinger] = useState<Point | null>(null);
  const [cursorPalm, setCursorPalm] = useState<Point | null>(null);
  const [hands, setHands] = useState<{left?: Point, right?: Point}>({});

  // Interaction State
  const isAnimating = useRef(false);
  const rawFinger = useRef<Point>({x: 0, y: 0});
  const rawPalm = useRef<Point>({x: 0, y: 0});

  // Derived state for Cat "Look At" behavior
  const lookAtRef = useRef<Point>({x: 0, y: 0});
  const [catLookAt, setCatLookAt] = useState<{x: number, y: number} | null>(null);

  // Image Analysis State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        await visionService.initialize();
        setDebugMsg("Waking up kitty...");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
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
        let msg = "Camera Error";
        if (err.name === 'NotAllowedError') {
             msg = "Permission Denied. Please allow camera access.";
        } else {
             msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
        }
        setDebugMsg(msg);
      }
    };

    startCamera();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      liveService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleVoice = async () => {
    if (isTalking) {
      await liveService.disconnect();
      setIsTalking(false);
      setVoiceStatus("Ready to chat");
    } else {
      setIsTalking(true);
      setVoiceStatus("Connecting...");
      await liveService.connect((status) => {
        setVoiceStatus(status);
        if (status === "Disconnected" || status === "Error" || status === "Connection Failed") {
            setIsTalking(false);
        }
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setAnalyzing(true);
      setAnalysisResult("Thinking..."); // Show temp message in bubble
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const imagePart = await fileToGenerativePart(file);
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            imagePart,
            { text: "You are Squirrel Mimi. Describe what you see in this image in a cute, excited way, as if you are looking at it!" }
          ]
        }
      });

      setAnalysisResult(response.text);
    } catch (error) {
      console.error("Analysis failed", error);
      setAnalysisResult("Oops! I couldn't see that clearly.");
    } finally {
      setAnalyzing(false);
      // Clear result after 8 seconds so it doesn't stick forever
      setTimeout(() => setAnalysisResult(null), 8000);
    }
  };

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
    
    // Only process if the video frame has changed to avoid timestamp mismatch errors
    if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = videoRef.current.currentTime;
        
        try {
            // Use performance.now() for monotonic timestamps
            const results = visionService.detect(videoRef.current, performance.now());
        
            let detectedHands: {left?: Point, right?: Point} = {};

            if (results && results.landmarks && results.landmarks.length > 0) {
              // Process main interaction hand (usually the first one detected)
              const landmarks = results.landmarks[0]; 
              
              // 8: Index Tip, 9: Middle MCP (Palm)
              const indexTip = landmarks[8];
              const palmCenter = landmarks[9]; 
        
              // Mirror X for user-facing camera logic
              const targetFingerX = 1 - indexTip.x;
              const targetFingerY = indexTip.y;
              
              const targetPalmX = 1 - palmCenter.x;
              const targetPalmY = palmCenter.y;
        
              // Smooth the raw inputs for cursor
              rawFinger.current.x = lerp(rawFinger.current.x, targetFingerX, 0.2);
              rawFinger.current.y = lerp(rawFinger.current.y, targetFingerY, 0.2);
              
              rawPalm.current.x = lerp(rawPalm.current.x, targetPalmX, 0.2);
              rawPalm.current.y = lerp(rawPalm.current.y, targetPalmY, 0.2);
        
              // Update React State for Cursors
              setCursorFinger({ ...rawFinger.current });
              setCursorPalm({ ...rawPalm.current });

              // --- Process All Hands for Puppeteering (Unity of Hands) ---
              // results.handedness contains "Left" or "Right" label.
              // In selfie mode:
              // "Left" label = User's actual Left Hand -> Appears on Screen Right -> Controls Mimi's Left Paw (Screen Right)
              // "Right" label = User's actual Right Hand -> Appears on Screen Left -> Controls Mimi's Right Paw (Screen Left)
              
              results.handedness.forEach((hand, index) => {
                  const marks = results.landmarks[index];
                  if (!marks) return;
                  
                  // Use wrist (0) or index (8) for paw target
                  const point = marks[0]; 
                  const mirroredX = 1 - point.x;
                  const mirroredY = point.y;
                  
                  const handLabel = hand[0].categoryName; // "Left" or "Right"
                  
                  if (handLabel === "Left") {
                      detectedHands.left = { x: mirroredX, y: mirroredY };
                  } else {
                      detectedHands.right = { x: mirroredX, y: mirroredY };
                  }
              });
              setHands(detectedHands);
        
              // Cat Look At Logic (Follows the main cursor)
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
              const catHeadTarget: Point = { x: 0.5, y: 0.31 }; 
              const catNoseTarget: Point = { x: 0.5, y: 0.5 };  
              const catTailTarget: Point = { x: 0.72, y: 0.81 };
        
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
                setHands({});
                lookAtRef.current.x = lerp(lookAtRef.current.x, 0, 0.05);
                lookAtRef.current.y = lerp(lookAtRef.current.y, 0, 0.05);
                setCatLookAt({ x: lookAtRef.current.x, y: lookAtRef.current.y });
            }
        } catch (e: any) {
            console.warn("Prediction Error:", e);
        }
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

      {/* Cat Layer - Scaled Up */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-center items-center z-10">
        <div className="transform scale-125">
            <TypewriterCat 
                action={catAction} 
                onAnimationEnd={() => {}}
                lookAt={catLookAt} 
                colorTheme={furColor}
                bowColor={bowColor}
                handPositions={hands}
                externalSpeech={analysisResult}
            />
        </div>
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

      {/* Action Buttons Container - Right Side */}
      <div className="absolute bottom-8 right-8 z-50 flex flex-col gap-4 items-end">
        {/* Analyze Image Button */}
        <div className="relative">
            <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="hidden" 
                ref={fileInputRef}
                disabled={analyzing}
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-3 px-6 py-4 rounded-full font-bold shadow-2xl transition-all duration-300 backdrop-blur-md border ${
                    analyzing 
                    ? 'bg-blue-500/80 border-blue-400 text-white animate-pulse' 
                    : 'bg-white/20 border-white/20 text-white hover:bg-white/30'
                }`}
            >
                <span className="text-xl">📸</span>
                <span className="tracking-wide">{analyzing ? 'Mimi is Looking...' : 'Show Mimi a Photo'}</span>
            </button>
        </div>

        {/* Voice Chat Button */}
        <button 
            onClick={toggleVoice}
            className={`flex items-center gap-3 px-6 py-4 rounded-full font-bold shadow-2xl transition-all duration-300 backdrop-blur-md border ${
                isTalking 
                ? 'bg-red-500/80 border-red-400 text-white animate-pulse' 
                : 'bg-white/20 border-white/20 text-white hover:bg-white/30'
            }`}
        >
            <div className={`w-3 h-3 rounded-full ${isTalking ? 'bg-white' : 'bg-green-400'}`} />
            <span className="tracking-wide">{isTalking ? 'Stop Chat' : 'Chat with Mimi'}</span>
            <span className="text-xs opacity-70 border-l border-white/30 pl-3">{voiceStatus}</span>
        </button>
      </div>

      {/* Color Picker Toolbar */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-white/20 backdrop-blur-md rounded-full px-6 py-3 flex gap-6 items-center border border-white/20 shadow-2xl">
            {/* Fur Color Selector */}
            <div className="flex gap-4">
                <button 
                    onClick={() => setFurColor('amber')}
                    className={`w-10 h-10 rounded-full border-4 shadow-lg transition-all duration-300 transform hover:scale-110 ${furColor === 'amber' ? 'border-white scale-110 shadow-[0_0_15px_rgba(251,191,36,0.8)]' : 'border-transparent opacity-80'}`}
                    style={{ background: 'linear-gradient(135deg, #fcd34d, #fbbf24)' }}
                    aria-label="Yellow Cat"
                />
                <button 
                    onClick={() => setFurColor('pink')}
                    className={`w-10 h-10 rounded-full border-4 shadow-lg transition-all duration-300 transform hover:scale-110 ${furColor === 'pink' ? 'border-white scale-110 shadow-[0_0_15px_rgba(244,114,182,0.8)]' : 'border-transparent opacity-80'}`}
                    style={{ background: 'linear-gradient(135deg, #f9a8d4, #f472b6)' }}
                    aria-label="Pink Cat"
                />
                <button 
                    onClick={() => setFurColor('blue')}
                    className={`w-10 h-10 rounded-full border-4 shadow-lg transition-all duration-300 transform hover:scale-110 ${furColor === 'blue' ? 'border-white scale-110 shadow-[0_0_15px_rgba(96,165,250,0.8)]' : 'border-transparent opacity-80'}`}
                    style={{ background: 'linear-gradient(135deg, #93c5fd, #60a5fa)' }}
                    aria-label="Blue Cat"
                />
            </div>
            
            {/* Divider */}
            <div className="w-[2px] h-10 bg-white/20 rounded-full" />
            
            {/* Bow Color Selector */}
            <div className="flex gap-4 items-center">
                 <button 
                    onClick={() => setBowColor('pink')}
                    className={`w-8 h-8 rounded-full border-2 shadow-sm transition-all duration-300 transform hover:scale-110 ${bowColor === 'pink' ? 'border-white scale-110 ring-2 ring-pink-300' : 'border-transparent opacity-80'}`}
                    style={{ background: '#ff9ecd' }}
                    aria-label="Pink Bow"
                />
                <button 
                    onClick={() => setBowColor('red')}
                    className={`w-8 h-8 rounded-full border-2 shadow-sm transition-all duration-300 transform hover:scale-110 ${bowColor === 'red' ? 'border-white scale-110 ring-2 ring-red-400' : 'border-transparent opacity-80'}`}
                    style={{ background: '#ef4444' }}
                    aria-label="Red Bow"
                />
                 <button 
                    onClick={() => setBowColor('black')}
                    className={`w-8 h-8 rounded-full border-2 shadow-sm transition-all duration-300 transform hover:scale-110 ${bowColor === 'black' ? 'border-white scale-110 ring-2 ring-gray-400' : 'border-transparent opacity-80'}`}
                    style={{ background: '#1f2937' }}
                    aria-label="Black Bow"
                />
                 <button 
                    onClick={() => setBowColor('purple')}
                    className={`w-8 h-8 rounded-full border-2 shadow-sm transition-all duration-300 transform hover:scale-110 ${bowColor === 'purple' ? 'border-white scale-110 ring-2 ring-purple-400' : 'border-transparent opacity-80'}`}
                    style={{ background: '#a855f7' }}
                    aria-label="Purple Bow"
                />
            </div>
        </div>
      </div>
    </div>
  );
}
