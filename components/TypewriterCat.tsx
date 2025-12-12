
import React, { useState, useEffect, useRef } from 'react';
import { CatAction, Point } from '../types';

interface TypewriterCatProps {
  action: CatAction;
  onAnimationEnd: () => void;
  lookAt: { x: number, y: number } | null; // Coordinates -1 to 1
  colorTheme?: 'amber' | 'pink' | 'blue';
  bowColor?: 'pink' | 'red' | 'black' | 'purple';
  handPositions?: { left?: Point, right?: Point }; // New prop for puppets
  externalSpeech?: string | null; // New prop for analysis text
}

const CatEye: React.FC<{ isLeft: boolean, isSquinting: boolean, pupilX: number, pupilY: number }> = ({ isLeft, isSquinting, pupilX, pupilY }) => (
  <div className="relative w-24 h-24">
    {/* Eyeball Container - Inner part clips the pupil */}
    <div className="absolute inset-0 w-full h-full bg-white rounded-full shadow-[inset_0_4px_10px_rgba(0,0,0,0.2)] overflow-hidden flex items-center justify-center border border-gray-100 z-10">
        {!isSquinting ? (
          <>
            {/* Open Eye - Pupil/Iris Container */}
            <div 
              className="w-20 h-20 bg-[#0f172a] rounded-full flex items-center justify-center relative shadow-inner"
              style={{ transform: `translate(${pupilX}px, ${pupilY}px)` }}
            >
                {/* Iris Color */}
                <div className="absolute inset-1 bg-gradient-to-b from-emerald-400 to-emerald-700 rounded-full opacity-80" />
                {/* Large Pupil */}
                <div className="absolute inset-3 bg-black rounded-full" />
                {/* Highlights */}
                <div className="absolute top-4 left-4 w-6 h-5 bg-white rounded-[50%] blur-[1px]" />
                <div className="absolute bottom-5 right-6 w-2.5 h-2.5 bg-white rounded-full opacity-70" />
            </div>
          </>
        ) : (
          // Squinting Eye (Happy ^ shape with lashes)
          <svg className="w-full h-full p-2" viewBox="0 0 100 100">
              <path 
                d="M 20 60 Q 50 30 80 60" 
                fill="none" 
                stroke="#1e293b" 
                strokeWidth="8" 
                strokeLinecap="round"
              />
              {/* Squint Lashes */}
              {isLeft ? (
                <>
                    <path d="M 18 62 Q 10 55 5 45" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
                    <path d="M 22 65 Q 15 75 10 85" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
                </>
              ) : (
                <>
                    <path d="M 82 62 Q 90 55 95 45" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
                    <path d="M 78 65 Q 85 75 90 85" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
                </>
              )}
          </svg>
        )}
    </div>

    {/* EYELINER - HALF-WRAP ON EDGE */}
    {!isSquinting && (
        <svg className="absolute inset-0 w-full h-full z-[15] pointer-events-none" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
            {isLeft ? (
                /* Left Eye: Thick Outer Wing (Left), Tapers to Inner Corner (Right) */
                <path 
                    d="M -5 38 Q 50 -25 105 38 L 105 38 Q 50 -20 -5 45 Z"
                    fill="#0f172a"
                />
            ) : (
                /* Right Eye: Thin Inner Corner (Left), Thick Outer Wing (Right) */
                <path 
                    d="M -5 38 Q 50 -25 105 38 L 105 45 Q 50 -20 -5 38 Z"
                    fill="#0f172a"
                />
            )}
        </svg>
    )}

    {/* OPEN EYE LASHES - Positioned relative to container, z-20 to sit on top of everything */}
    {!isSquinting && (
        <svg 
            className={`absolute z-20 w-32 h-32 text-[#0f172a] pointer-events-none ${isLeft ? '-left-10 -top-6' : '-right-10 -top-6'}`} 
            viewBox="0 0 100 100"
            style={{ filter: 'drop-shadow(0px 1px 0px rgba(255,255,255,0.2))' }}
        >
            {isLeft ? (
                /* Left Eye (Lashes on Left Outer Corner) */
                <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M 30 45 Q 15 35 12 23" />
                    <path d="M 30 49 Q 18 45 15 37" />
                </g>
            ) : (
                /* Right Eye (Lashes on Right Outer Corner) */
                <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M 70 45 Q 85 35 88 23" />
                    <path d="M 70 49 Q 82 45 85 37" />
                </g>
            )}
        </svg>
    )}
  </div>
);

const isMoving = (action: CatAction) => action !== CatAction.IDLE && action !== CatAction.LAY;

// Helper for arm kinematics
const calculateArmTransform = (
  handPos: Point | undefined, 
  shoulderX: number, // Normalized 0-1 relative to container width approx
  shoulderY: number, 
  isLeftArm: boolean
) => {
  if (!handPos) {
    // Default resting pose
    return `rotate(${isLeftArm ? '-6deg' : '6deg'})`;
  }

  // Map normalized screen coordinates (0-1) to rough relative coordinates
  // Hand 0,0 is top-left screen. 
  // We approximate the cat's coordinate space.
  // Center is 0.5, 0.5.
  const dx = (handPos.x - shoulderX);
  const dy = (handPos.y - shoulderY);
  
  // Calculate angle
  // 90 deg is straight down (positive Y)
  const angleRad = Math.atan2(dy, dx);
  let angleDeg = angleRad * (180 / Math.PI);
  
  // Offset because the arm div points downwards by default (which is +90 deg in typical math, but 0 deg rotation in CSS)
  // Actually, standard div is vertical. 0 deg points down.
  // atan2(0, 1) = 0 (Right). atan2(1, 0) = 90 (Down).
  // We want 0 rotation to be Down.
  // So we subtract 90 degrees.
  angleDeg -= 90;

  // Clamp limits to prevent breaking arms
  if (isLeftArm) {
      // Left arm (on screen left/cat right)
      // Natural range: -90 (Right) to +90 (Left) relative to down
      angleDeg = Math.max(-120, Math.min(60, angleDeg));
  } else {
      // Right arm
      angleDeg = Math.max(-60, Math.min(120, angleDeg));
  }

  return `rotate(${angleDeg}deg)`;
};

const CartoonCat: React.FC<TypewriterCatProps> = ({ 
    action, 
    onAnimationEnd, 
    lookAt, 
    colorTheme = 'amber', 
    bowColor = 'pink',
    handPositions,
    externalSpeech
}) => {
  const [blinking, setBlinking] = useState(false);
  const [earTwitch, setEarTwitch] = useState<'none' | 'left' | 'right' | 'both'>('none');
  const [speech, setSpeech] = useState<{show: boolean, text: string}>({show: false, text: ''});
  
  // Sleepy State Logic
  const [isSleepy, setIsSleepy] = useState(false);
  const [isYawning, setIsYawning] = useState(false);

  // 1. Inactivity Timer
  useEffect(() => {
    if (action === CatAction.IDLE && !handPositions?.left && !handPositions?.right) {
        const timer = setTimeout(() => setIsSleepy(true), 10000);
        return () => clearTimeout(timer);
    } else {
        setIsSleepy(false);
        setIsYawning(false);
        setBlinking(false);
    }
  }, [action, handPositions]);

  // 2. Yawn Logic
  useEffect(() => {
    if (!isSleepy) return;
    const interval = setInterval(() => {
        if (Math.random() < 0.3) {
            setIsYawning(true);
            setTimeout(() => setIsYawning(false), 2500);
        }
    }, 5000);
    return () => clearInterval(interval);
  }, [isSleepy]);

  // 3. Blinking Logic
  useEffect(() => {
    const minInterval = isSleepy ? 5000 : 3500;
    const randomAdd = isSleepy ? 4000 : 2000;
    let timer: ReturnType<typeof setTimeout>;

    const blinkLoop = () => {
        const duration = isSleepy ? 600 : 200;
        setBlinking(true);
        setTimeout(() => {
            setBlinking(false);
            const nextDelay = minInterval + Math.random() * randomAdd;
            timer = setTimeout(blinkLoop, nextDelay);
        }, duration);
    };

    timer = setTimeout(blinkLoop, minInterval);
    return () => clearTimeout(timer);
  }, [isSleepy]);

  // Ear Twitch
  useEffect(() => {
    const interval = setInterval(() => {
        if (Math.random() < 0.4) {
            const r = Math.random();
            if (r < 0.33) setEarTwitch('left');
            else if (r < 0.66) setEarTwitch('right');
            else setEarTwitch('both');
            setTimeout(() => setEarTwitch('none'), 300);
        }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Internal Speech (Random happiness)
  useEffect(() => {
      const isHappyAction = [CatAction.JUMP, CatAction.SPIN, CatAction.SHAKE].includes(action);
      if (isHappyAction) {
          setSpeech(prev => {
              if (prev.show) return prev;
              const messages = ["I love you! ❤️", "You're the best! 🌟", "So happy! 😸", "Meow~ 💕"];
              return { show: true, text: messages[Math.floor(Math.random() * messages.length)] };
          });
          setTimeout(() => setSpeech(prev => ({...prev, show: false})), 4000);
      }
  }, [action]);

  // External Speech (Image Analysis)
  useEffect(() => {
      if (externalSpeech) {
          setSpeech({ show: true, text: externalSpeech });
          // Note: Hiding handled by parent clearing prop or manual timeout if needed, 
          // but let's ensure we don't clear it immediately if it's long.
          const readingTime = Math.max(4000, externalSpeech.length * 50);
          const timer = setTimeout(() => {
               // Optional: Auto hide? Parent handles nulling it usually.
          }, readingTime);
          return () => clearTimeout(timer);
      }
  }, [externalSpeech]);


  // Theme Config
  const themes = {
    amber: {
        bodyGradient: "bg-gradient-to-b from-amber-300 via-amber-400 to-orange-400",
        tailGradient: "bg-gradient-to-t from-amber-600 via-amber-300 to-white",
        lightAccent: "bg-white", 
        particleColors: ['#ef4444', '#f472b6', '#facc15', '#60a5fa'],
        starColors: ['#fbbf24', '#f472b6'],
        earInner: "bg-pink-100",
        tuftColor: "bg-amber-300"
    },
    pink: {
        bodyGradient: "bg-gradient-to-b from-pink-200 via-pink-300 to-rose-300",
        tailGradient: "bg-gradient-to-t from-rose-400 via-pink-200 to-white",
        lightAccent: "bg-rose-50",
        particleColors: ['#db2777', '#f472b6', '#fbcfe8', '#fff'],
        starColors: ['#f472b6', '#fbcfe8'],
        earInner: "bg-white",
        tuftColor: "bg-pink-300"
    },
    blue: {
        bodyGradient: "bg-gradient-to-b from-sky-200 via-sky-300 to-blue-300",
        tailGradient: "bg-gradient-to-t from-blue-400 via-sky-200 to-white",
        lightAccent: "bg-sky-50",
        particleColors: ['#3b82f6', '#60a5fa', '#bae6fd', '#fff'],
        starColors: ['#60a5fa', '#bae6fd'],
        earInner: "bg-pink-100",
        tuftColor: "bg-sky-300"
    }
  };

  const bowThemes = {
    pink: { main: '#ff9ecd', knot: '#db2777', highlight: '#fce7f3' },
    red: { main: '#ef4444', knot: '#b91c1c', highlight: '#fca5a5' },
    black: { main: '#1f2937', knot: '#000000', highlight: '#6b7280' },
    purple: { main: '#a855f7', knot: '#7e22ce', highlight: '#e9d5ff' }
  };

  const theme = themes[colorTheme] || themes.amber;
  const bowStyle = bowThemes[bowColor] || bowThemes.pink;

  // Tracking Logic
  const headRotateX = lookAt ? -lookAt.y * 15 : 0;
  const headRotateY = lookAt ? lookAt.x * 15 : 0;
  const bodyRotateX = lookAt ? -lookAt.y * 5 : 0;
  const bodyRotateY = lookAt ? lookAt.x * 8 : 0;
  const pupilX = lookAt ? lookAt.x * 14 : 0;
  const pupilY = lookAt ? lookAt.y * 12 : 0;

  const effectiveBlinking = blinking || isYawning;
  const isSquinting = effectiveBlinking || action === CatAction.JUMP || action === CatAction.SNEEZE || action === CatAction.SHAKE;
  const isHappyAction = [CatAction.JUMP, CatAction.SPIN, CatAction.SHAKE].includes(action);

  // Arm IK Logic
  // Screen Left Arm (Mimi's Right Arm) -> Controlled by User's Right Hand (Screen Left)
  // Screen Right Arm (Mimi's Left Arm) -> Controlled by User's Left Hand (Screen Right)
  // Shoulders are roughly at X=0.35/0.65, Y=0.5 in normalized space
  const leftArmTransform = calculateArmTransform(handPositions?.right, 0.35, 0.5, true); 
  const rightArmTransform = calculateArmTransform(handPositions?.left, 0.65, 0.5, false);

  const getContainerStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      transformStyle: 'preserve-3d',
    };
    if (!action) return baseStyle;
    switch (action) {
      case CatAction.SPIN: return { ...baseStyle, animation: 'spin 0.6s cubic-bezier(0.45, 0, 0.55, 1)' };
      case CatAction.JUMP: return { ...baseStyle, animation: 'jump 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)' };
      case CatAction.SHAKE: return { ...baseStyle, animation: 'shake 0.8s ease-in-out' };
      case CatAction.LAY: return { ...baseStyle, transform: 'translateY(80px) scaleY(0.7) scaleX(1.1)' };
      case CatAction.SNEEZE: return { ...baseStyle, animation: 'sneeze 0.4s cubic-bezier(.36,.07,.19,.97) both' };
      case CatAction.IDLE: default: return baseStyle;
    }
  };

  const furShadow = "shadow-[inset_0_-4px_10px_rgba(0,0,0,0.1)]"; 
  const noiseOverlay = "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIwLjUiLz48L3N2Zz4=')";

  return (
    <div 
      className="relative select-none pointer-events-none w-[600px] h-[600px] flex items-center justify-center"
      onAnimationEnd={onAnimationEnd}
      style={getContainerStyle()}
    >
      {/* Sneeze Effect */}
      {action === CatAction.SNEEZE && (
        <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
           <div className="absolute w-3 h-3 bg-blue-400 rounded-full animate-droplet-1" style={{ top: 0, left: 0 }}></div>
           <div className="absolute w-2 h-2 bg-sky-300 rounded-full animate-droplet-2" style={{ top: 5, left: -5 }}></div>
           <div className="absolute w-2 h-3 bg-blue-500 rounded-full animate-droplet-3" style={{ top: 5, left: 5 }}></div>
           <div className="absolute w-1 h-2 bg-blue-200 rounded-full animate-droplet-4" style={{ top: 2, left: -10 }}></div>
           <div className="absolute w-2 h-2 bg-sky-400 rounded-full animate-droplet-5" style={{ top: 2, left: 10 }}></div>
        </div>
      )}

      {/* Heart Particles */}
      {isHappyAction && (
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 z-50 pointer-events-none w-0 h-0">
              {[...Array(30)].map((_, i) => { 
                  const angle = (i * 12) % 360 + Math.random() * 20;
                  const spread = 80 + Math.random() * 100;
                  const tx = Math.cos(angle * Math.PI / 180) * spread;
                  const ty = Math.sin(angle * Math.PI / 180) * spread - 80;
                  const color = theme.particleColors[i % theme.particleColors.length];
                  
                  return (
                      <div 
                        key={i}
                        className="absolute w-10 h-10 animate-heart-fly"
                        style={{
                            '--tx': `${tx}px`,
                            '--ty': `${ty}px`,
                            '--rot': `${Math.random() * 60 - 30}deg`,
                            animationDelay: `${i * 0.02}s`,
                            color: color,
                            top: 0, left: 0
                        } as React.CSSProperties}
                      >
                         <svg viewBox="0 0 32 32" fill="currentColor" className="w-full h-full drop-shadow-md">
                             <path d="M16 28 C16 28 3 18 3 10 A7 7 0 0 1 16 6 A7 7 0 0 1 29 10 C29 18 16 28 16 28 Z" />
                         </svg>
                      </div>
                  )
              })}
          </div>
      )}

      {/* Star Particles */}
      {action === CatAction.TAIL_WAG && (
          <div className="absolute bottom-[25%] right-[20%] w-0 h-0 z-50 pointer-events-none">
              {[...Array(20)].map((_, i) => {
                  const angle = Math.random() * 360;
                  const spread = 120 + Math.random() * 200;
                  const initialX = (Math.random() - 0.5) * 80;
                  const initialY = (Math.random() - 0.5) * 80;
                  
                  const tx = initialX + Math.cos(angle * Math.PI / 180) * spread;
                  const ty = initialY + Math.sin(angle * Math.PI / 180) * spread;
                  const color = theme.starColors[i % theme.starColors.length];
                  
                  return (
                      <div 
                        key={i}
                        className="absolute w-10 h-10 animate-star-scatter"
                        style={{
                            '--tx': `${tx}px`,
                            '--ty': `${ty}px`,
                            '--rot': `${Math.random() * 180}deg`,
                            animationDelay: `${i * 0.02}s`,
                            color: color,
                            top: initialY, left: initialX
                        } as React.CSSProperties}
                      >
                         <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-md">
                             <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                         </svg>
                      </div>
                  )
              })}
          </div>
      )}

      {/* --- THE FLUFFY CAT --- */}
      <div className={`relative w-full h-full flex items-center justify-center animate-breathe origin-bottom ${isSleepy ? 'duration-[6000ms]' : ''}`} style={{ perspective: '1000px' }}>
        
        {/* === BODY GROUP === */}
        <div 
            className="absolute top-[42%] left-1/2 -translate-x-1/2 w-72 h-64 z-10"
            style={{ 
                transform: `translateX(-50%) rotateX(${bodyRotateX}deg) rotateY(${bodyRotateY}deg)`,
                transformStyle: 'preserve-3d'
            }}
        >
             {/* === TAIL === */}
             <div 
                 className="absolute bottom-8 -right-4 w-48 h-80 origin-bottom-left z-[-10]"
                 style={{ transform: 'translateZ(-60px) rotate(25deg)' }}
             >
                 <div className={`w-full h-full origin-bottom-left relative ${action === CatAction.TAIL_WAG ? 'animate-tail-wag' : 'animate-tail-swish'}`}
                      style={{ animationDuration: (action !== CatAction.TAIL_WAG && isSleepy) ? '8s' : undefined }}
                 >
                     <div className={`absolute inset-0 ${theme.tailGradient} shadow-xl`}
                          style={{
                              maskImage: 'linear-gradient(to top, black 80%, transparent 100%)',
                              clipPath: 'path("M 30 300 C 30 250, -20 180, 40 100 S 160 10, 160 60 C 160 110, 100 180, 80 300 Z")',
                              width: '100%', height: '100%',
                          }}
                     >
                        <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: noiseOverlay }} />
                     </div>
                     
                     {/* Tail Tufts */}
                     <div className="absolute top-[10%] right-[10%] w-20 h-20 bg-white rounded-full blur-md opacity-90" />
                     <div className={`absolute top-[25%] right-[-5%] w-14 h-16 ${theme.tuftColor} opacity-50 rounded-full blur-[4px] rotate-12`} />
                     <div className={`absolute top-[45%] right-[0%] w-16 h-16 ${theme.tuftColor} opacity-60 rounded-full blur-[4px]`} />
                     <div className={`absolute bottom-[20%] right-[10%] w-16 h-20 ${theme.tuftColor} opacity-70 rounded-full blur-[5px]`} />
                     <div className="absolute top-[20%] left-[15%] w-12 h-12 bg-white rounded-full blur-[3px]" />
                     <div className={`absolute top-[40%] left-[5%] w-14 h-14 ${theme.tuftColor} opacity-60 rounded-full blur-[3px]`} />
                     
                     <div className={`absolute bottom-0 left-[10%] w-28 h-24 ${theme.tuftColor} blur-xl rounded-full`} />
                 </div>
             </div>

             {/* Spherical Main Body */}
             <div className={`absolute inset-0 ${theme.bodyGradient} rounded-[45%_45%_40%_40%] shadow-xl overflow-hidden`}>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-48 h-24 bg-black/20 blur-xl rounded-full" />
             </div>
             
             <div className="absolute inset-0 rounded-[45%_45%_40%_40%] opacity-30 mix-blend-overlay" style={{ backgroundImage: noiseOverlay }} />

             {/* Belly Patch (Secondary Color) */}
             <div className={`absolute top-12 left-1/2 -translate-x-1/2 w-48 h-40 ${theme.lightAccent} rounded-full blur-2xl opacity-70`} />
             
             {/* Chest Fluff */}
             <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-20 ${theme.lightAccent} opacity-40 blur-lg rounded-full`} />

             {/* === HIND LEGS === */}
             <div className={`absolute bottom-2 -left-4 w-28 h-28 ${theme.bodyGradient} rounded-full shadow-inner z-10`}>
                  <div className="absolute inset-0 opacity-30 mix-blend-overlay rounded-full" style={{ backgroundImage: noiseOverlay }} />
                  <div className="absolute top-2 left-4 w-12 h-12 bg-white/20 blur-lg rounded-full" />
             </div>
             <div className={`absolute bottom-2 -right-4 w-28 h-28 ${theme.bodyGradient} rounded-full shadow-inner z-10`}>
                  <div className="absolute inset-0 opacity-30 mix-blend-overlay rounded-full" style={{ backgroundImage: noiseOverlay }} />
                  <div className="absolute top-2 right-4 w-12 h-12 bg-white/20 blur-lg rounded-full" />
             </div>

             {/* === HIND FEET === */}
             <div className={`absolute bottom-2 left-10 w-16 h-10 ${theme.lightAccent} rounded-[1.5rem] shadow-md z-20 flex justify-center items-end pb-2 transform -rotate-6 border-b-2 border-gray-100/50`}>
                 <div className="w-1.5 h-4 bg-gray-200 rounded-full mx-1 opacity-50" />
                 <div className="w-1.5 h-4 bg-gray-200 rounded-full mx-1 opacity-50" />
             </div>
             <div className={`absolute bottom-2 right-10 w-16 h-10 ${theme.lightAccent} rounded-[1.5rem] shadow-md z-20 flex justify-center items-end pb-2 transform rotate-6 border-b-2 border-gray-100/50`}>
                 <div className="w-1.5 h-4 bg-gray-200 rounded-full mx-1 opacity-50" />
                 <div className="w-1.5 h-4 bg-gray-200 rounded-full mx-1 opacity-50" />
             </div>

             {/* === FRONT ARMS (Animated by IK) === */}
             {/* Left Arm (Visual Left) */}
             <div 
                className={`absolute top-16 left-4 w-14 h-32 ${theme.lightAccent} rounded-[2rem] shadow-md flex flex-col justify-end items-center pb-4 border-l-2 border-gray-100/50 z-20 origin-top`}
                style={{ 
                    transform: leftArmTransform,
                    transition: 'transform 0.1s linear' // Fast transition for responsiveness
                }}
             >
                <div className="w-[80%] h-full bg-gradient-to-b from-transparent to-gray-100/30 rounded-[2rem]" />
                <div className="absolute bottom-2 flex gap-1.5">
                    <div className="w-1 h-3 bg-gray-200 rounded-full" />
                    <div className="w-1 h-3 bg-gray-200 rounded-full" />
                    <div className="w-1 h-3 bg-gray-200 rounded-full" />
                </div>
             </div>
             
             {/* Right Arm (Visual Right) */}
             <div 
                className={`absolute top-16 right-4 w-14 h-32 ${theme.lightAccent} rounded-[2rem] shadow-md flex flex-col justify-end items-center pb-4 border-r-2 border-gray-100/50 z-20 origin-top`}
                style={{ 
                    transform: rightArmTransform,
                    transition: 'transform 0.1s linear'
                }}
             >
                <div className="w-[80%] h-full bg-gradient-to-b from-transparent to-gray-100/30 rounded-[2rem]" />
                <div className="absolute bottom-2 flex gap-1.5">
                    <div className="w-1 h-3 bg-gray-200 rounded-full" />
                    <div className="w-1 h-3 bg-gray-200 rounded-full" />
                    <div className="w-1 h-3 bg-gray-200 rounded-full" />
                </div>
             </div>
        </div>

        {/* === HEAD GROUP === */}
        <div 
            className="absolute z-20 top-[16%]"
            style={{ 
                transform: `rotateX(${headRotateX}deg) rotateY(${headRotateY}deg)`,
                transformStyle: 'preserve-3d'
            }}
        >
            {/* SPEECH BUBBLE */}
            {speech.show && (
                <div className="absolute -top-20 -right-28 bg-white text-gray-800 px-5 py-3 rounded-2xl shadow-xl z-[60] animate-pop-in origin-bottom-left border-2 border-pink-100 max-w-xs">
                    <p className="text-base font-bold text-pink-500 leading-snug">{speech.text}</p>
                    <div className="absolute bottom-0 left-4 -mb-2 w-4 h-4 bg-white border-b-2 border-r-2 border-pink-100 transform rotate-45"></div>
                </div>
            )}

            {/* -- Ears -- */}
            {/* Left Ear */}
            <div className={`absolute -top-14 left-4 w-24 h-28 ${theme.bodyGradient} rounded-tl-[3rem] rounded-tr-xl transform -rotate-12 origin-bottom-right shadow-sm overflow-hidden ${(earTwitch === 'left' || earTwitch === 'both') ? 'animate-twitch-left' : ''}`}>
                <div className="absolute inset-0 bg-black/5 blur-sm" /> 
                <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: noiseOverlay }} />
                <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-16 ${theme.earInner} rounded-full blur-[2px]`} />
                <div className="absolute bottom-4 left-2 w-4 h-8 bg-white rounded-full rotate-12 blur-[1px]" />
                <div className="absolute bottom-4 right-2 w-4 h-8 bg-white rounded-full -rotate-12 blur-[1px]" />
            </div>
             {/* Right Ear */}
            <div className={`absolute -top-14 right-4 w-24 h-28 ${theme.bodyGradient} rounded-tr-[3rem] rounded-tl-xl transform rotate-12 origin-bottom-left shadow-sm overflow-hidden ${(earTwitch === 'right' || earTwitch === 'both') ? 'animate-twitch-right' : ''}`}>
                <div className="absolute inset-0 bg-black/5 blur-sm" />
                <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: noiseOverlay }} />
                <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-16 ${theme.earInner} rounded-full blur-[2px]`} />
                <div className="absolute bottom-4 left-2 w-4 h-8 bg-white rounded-full rotate-12 blur-[1px]" />
                <div className="absolute bottom-4 right-2 w-4 h-8 bg-white rounded-full -rotate-12 blur-[1px]" />
            </div>

            {/* PINK BOW (Fixed Color) */}
            <div className="absolute -top-6 -right-10 w-36 h-28 z-50 transform rotate-12 pointer-events-none origin-center drop-shadow-md">
                 <div className="absolute top-2 left-0 w-16 h-20 border-[3px] border-[#5e1914] rounded-[40%_60%_40%_40%_/_40%_40%_60%_60%] transform -rotate-[20deg] z-10 overflow-hidden shadow-inner" style={{ backgroundColor: bowStyle.main }}>
                      <div className="absolute -top-2 -left-2 w-8 h-8 bg-yellow-300 blur-md opacity-60" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-4 rounded-full rotate-[-10deg] opacity-80" style={{ backgroundColor: bowStyle.knot }} />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1 rounded-full rotate-[-10deg] mt-1 opacity-60" style={{ backgroundColor: bowStyle.highlight }} />
                      <div className="absolute top-2 left-2 w-6 h-3 bg-white rounded-full blur-[1px] opacity-90" />
                 </div>
                 <div className="absolute top-2 right-0 w-16 h-20 border-[3px] border-[#5e1914] rounded-[60%_40%_40%_40%_/_40%_40%_60%_60%] transform rotate-[20deg] z-10 overflow-hidden shadow-inner" style={{ backgroundColor: bowStyle.main }}>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-4 rounded-full rotate-[10deg] opacity-80" style={{ backgroundColor: bowStyle.knot }} />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1 rounded-full rotate-[10deg] mt-1 opacity-60" style={{ backgroundColor: bowStyle.highlight }} />
                      <div className="absolute top-2 right-2 w-6 h-3 bg-white rounded-full blur-[1px] opacity-90" />
                 </div>
                 <div className="absolute top-6 left-1/2 -translate-x-1/2 w-11 h-12 border-[3px] border-[#5e1914] rounded-[30%] z-20 flex justify-center items-center shadow-lg" style={{ backgroundColor: bowStyle.main }}>
                     <div className="w-[2px] h-6 rounded-full opacity-60 mr-1.5" style={{ backgroundColor: bowStyle.knot }} />
                     <div className="w-[2px] h-6 rounded-full opacity-60 ml-1.5" style={{ backgroundColor: bowStyle.knot }} />
                     <div className="absolute top-1.5 left-1.5 w-4 h-3 bg-white rounded-full blur-[0.5px] opacity-90" />
                 </div>
            </div>

            {/* -- Head Base -- */}
            <div className="relative w-72 h-60">
                <div className={`absolute inset-0 ${theme.bodyGradient} ${furShadow} rounded-[45%] z-10 overflow-hidden`}>
                     <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: noiseOverlay }} />
                </div>
                <div className={`absolute bottom-[-10px] -left-6 w-28 h-28 ${theme.bodyGradient} rounded-full z-10 shadow-inner overflow-hidden`}>
                     <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: noiseOverlay }} />
                </div>
                <div className={`absolute bottom-[-10px] -right-6 w-28 h-28 ${theme.bodyGradient} rounded-full z-10 shadow-inner overflow-hidden`}>
                     <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: noiseOverlay }} />
                </div>

                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-10 ${theme.bodyGradient} rounded-full`} />
                <div className={`absolute top-24 -left-8 w-8 h-12 ${theme.bodyGradient} rounded-full -rotate-45`} />
                <div className={`absolute top-24 -right-8 w-8 h-12 ${theme.bodyGradient} rounded-full rotate-45`} />

                <div className="absolute inset-0 z-20 overflow-visible rounded-[45%]">
                    {/* Markings */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-20 bg-orange-500/20 rounded-full blur-md" />
                    <div className="absolute top-2 left-1/3 w-8 h-12 bg-orange-500/20 rounded-full blur-sm rotate-12" />
                    <div className="absolute top-2 right-1/3 w-8 h-12 bg-orange-500/20 rounded-full blur-sm -rotate-12" />

                    {/* Face Mask (Secondary) */}
                    <div className={`absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-32 h-32 ${theme.lightAccent} rounded-full blur-xl opacity-90`} />
                    <div className={`absolute bottom-[-10px] left-8 w-32 h-32 ${theme.lightAccent} rounded-full blur-lg opacity-80`} />
                    <div className={`absolute bottom-[-10px] right-8 w-32 h-32 ${theme.lightAccent} rounded-full blur-lg opacity-80`} />
                    
                    <div className="absolute bottom-16 left-4 w-20 h-16 bg-pink-400/20 blur-xl rounded-full" />
                    <div className="absolute bottom-16 right-4 w-20 h-16 bg-pink-400/20 blur-xl rounded-full" />
                </div>

                {/* Eyes */}
                <div className="absolute top-28 left-0 w-full flex justify-center gap-8 px-4 z-30">
                    <CatEye isLeft={true} isSquinting={isSquinting} pupilX={pupilX} pupilY={pupilY} />
                    <CatEye isLeft={false} isSquinting={isSquinting} pupilX={pupilX} pupilY={pupilY} />
                </div>

                {/* Muzzle */}
                <div className="absolute top-40 left-1/2 -translate-x-1/2 w-40 h-28 flex flex-col items-center z-30">
                    <div className="absolute -top-6 w-24 h-16 bg-white/90 blur-md rounded-full" />
                    <div className={`relative w-8 h-6 bg-pink-400 rounded-[40%] shadow-sm mb-1 cursor-pointer hover:scale-110 transition-transform ${action === CatAction.SNEEZE ? 'animate-nose-wiggle' : ''}`}>
                        <div className="absolute top-1 left-2 w-3 h-2 bg-white/40 rounded-full" />
                    </div>
                    {/* Yawn Mouth vs Standard Mouth */}
                    {isYawning ? (
                        <div className="relative mt-0 w-10 h-12 bg-pink-900 rounded-[50%] animate-yawn-mouth origin-top border-2 border-pink-300 overflow-hidden shadow-inner">
                            <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-6 h-6 bg-pink-400 rounded-full" />
                        </div>
                    ) : (
                        <div className="flex -mt-2 opacity-80">
                            <div className="w-6 h-6 border-b-[3px] border-r-[3px] border-gray-700 rounded-br-[20px] transform rotate-45" />
                            <div className="w-6 h-6 border-b-[3px] border-l-[3px] border-gray-700 rounded-bl-[20px] transform -rotate-45" />
                        </div>
                    )}

                    {/* Whiskers */}
                    <div className="absolute top-2 left-[-45px] w-28 h-20 pointer-events-none">
                         <div className="h-[2px] w-full bg-gray-800/20 mb-3 transform rotate-6 origin-right rounded-full shadow-sm" />
                         <div className="h-[2px] w-full bg-gray-800/20 mb-3 transform rotate-0 origin-right rounded-full shadow-sm" />
                         <div className="h-[2px] w-full bg-gray-800/20 transform -rotate-6 origin-right rounded-full shadow-sm" />
                    </div>
                    <div className="absolute top-2 right-[-45px] w-28 h-20 pointer-events-none">
                         <div className="h-[2px] w-full bg-gray-800/20 mb-3 transform -rotate-6 origin-left rounded-full shadow-sm" />
                         <div className="h-[2px] w-full bg-gray-800/20 mb-3 transform rotate-0 origin-left rounded-full shadow-sm" />
                         <div className="h-[2px] w-full bg-gray-800/20 transform rotate-6 origin-left rounded-full shadow-sm" />
                    </div>
                </div>

                {/* Collar */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[60%] h-8 bg-red-500 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] z-40 flex justify-center items-center">
                    <div className={`absolute top-3 w-10 h-10 bg-yellow-400 rounded-full border border-yellow-600 flex items-center justify-center shadow-lg ${isMoving(action) ? 'animate-bell-ring' : ''}`}>
                        <div className="w-full h-[1px] bg-yellow-700/50 absolute top-1/3" />
                        <div className="w-2 h-2 bg-yellow-800 rounded-full mt-3 opacity-80" />
                        <div className="absolute top-2 left-2 w-3 h-3 bg-white rounded-full opacity-60 blur-[1px]" />
                    </div>
                </div>
            </div>
        </div>

      </div>

      <style>{`
        .animate-breathe { animation: breathe 4s ease-in-out infinite; }
        .animate-nose-wiggle { animation: noseWiggle 0.3s ease-in-out infinite; }
        .animate-bell-ring { animation: bellRing 0.5s ease-in-out infinite; transform-origin: top center; }
        .animate-tail-swish { animation: tailSwish 4s ease-in-out infinite alternate; }
        .animate-tail-wag { animation: tailWag 0.2s ease-in-out 5; }
        
        /* Ear Twitches */
        .animate-twitch-left { animation: twitchLeft 0.3s ease-in-out; }
        .animate-twitch-right { animation: twitchRight 0.3s ease-in-out; }
        
        /* Yawn */
        .animate-yawn-mouth { animation: yawnMouth 2.5s ease-in-out; }

        @keyframes twitchLeft { 
            0% { transform: rotate(-12deg); } 
            30% { transform: rotate(-20deg); } 
            60% { transform: rotate(-8deg); } 
            100% { transform: rotate(-12deg); } 
        }
        @keyframes twitchRight { 
            0% { transform: rotate(12deg); } 
            30% { transform: rotate(20deg); } 
            60% { transform: rotate(8deg); } 
            100% { transform: rotate(12deg); } 
        }
        
        @keyframes yawnMouth {
            0% { transform: scale(0.5); opacity: 0; }
            20% { transform: scale(1); opacity: 1; }
            80% { transform: scale(1); opacity: 1; }
            100% { transform: scale(0.5); opacity: 0; }
        }
        
        .animate-droplet-1 { animation: dropletFly 0.5s ease-out forwards; --tx: -20px; --ty: -40px; }
        .animate-droplet-2 { animation: dropletFly 0.5s ease-out 0.05s forwards; --tx: -35px; --ty: -30px; }
        .animate-droplet-3 { animation: dropletFly 0.5s ease-out 0.1s forwards; --tx: 20px; --ty: -45px; }
        .animate-droplet-4 { animation: dropletFly 0.5s ease-out 0.02s forwards; --tx: -10px; --ty: -50px; }
        .animate-droplet-5 { animation: dropletFly 0.5s ease-out 0.08s forwards; --tx: 30px; --ty: -20px; }

        @keyframes dropletFly {
            0% { transform: translate(0, 0) scale(1); opacity: 1; }
            100% { transform: translate(var(--tx), var(--ty)) scale(0.5); opacity: 0; }
        }

        .animate-heart-fly { animation: heartFly 1s ease-out forwards; opacity: 0; }
        @keyframes heartFly {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
            100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) rotate(var(--rot)) scale(0.5); opacity: 0; }
        }
        
        .animate-star-scatter { animation: starScatter 0.8s ease-out forwards; opacity: 0; }
        @keyframes starScatter {
            0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 0; }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2) rotate(45deg); }
            100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0) rotate(var(--rot)); opacity: 0; }
        }
        
        .animate-pop-in { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes popIn {
            0% { opacity: 0; transform: scale(0.5) translateY(20px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes noseWiggle { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2) rotate(8deg); } }
        @keyframes bellRing { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(25deg); } 75% { transform: rotate(-25deg); } }
        @keyframes tailSwish { 0% { transform: rotate(-5deg); } 100% { transform: rotate(5deg); } }
        @keyframes tailWag { 0% { transform: rotate(10deg) scale(1.1); } 50% { transform: rotate(50deg) scale(1.1); } 100% { transform: rotate(10deg) scale(1.1); } }
        @keyframes spin { 0% { transform: rotateY(0deg) scale(1); } 50% { transform: rotateY(180deg) scale(0.9); } 100% { transform: rotateY(360deg) scale(1); } }
        @keyframes jump { 0% { transform: translateY(0) scale(1,1); } 30% { transform: translateY(20px) scale(1.2, 0.8); } 40% { transform: translateY(-120px) scale(0.9, 1.1) rotate(-5deg); } 60% { transform: translateY(-120px) scale(0.9, 1.1) rotate(5deg); } 80% { transform: translateY(10px) scale(1.1, 0.9); } 100% { transform: translateY(0) scale(1,1); } }
        @keyframes shake { 0%, 100% { transform: rotate(0deg); } 20% { transform: rotate(8deg); } 40% { transform: rotate(-8deg); } 60% { transform: rotate(6deg); } 80% { transform: rotate(-6deg); } }
        @keyframes sneeze { 0% { transform: scale(1); } 30% { transform: scale(1.05) rotateX(-15deg); } 40% { transform: scale(0.85) translateY(15px); } 45% { transform: scale(1.15) translateY(-20px) rotateX(15deg); } 100% { transform: scale(1); } }
        @keyframes breathe { 0%, 100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.03) translateY(-5px); } }
      `}</style>
    </div>
  );
};

export default CartoonCat;
