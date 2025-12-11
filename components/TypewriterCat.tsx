
import React, { useState, useEffect } from 'react';
import { CatAction } from '../types';

interface TypewriterCatProps {
  action: CatAction;
  onAnimationEnd: () => void;
  lookAt: { x: number, y: number } | null; // Coordinates -1 to 1
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
                /* Raised anchors to y=38, top arch y=-25 */
                <path 
                    d="M -5 38 Q 50 -25 105 38 L 105 38 Q 50 -15 -5 45 Z"
                    fill="#0f172a"
                />
            ) : (
                /* Right Eye: Thin Inner Corner (Left), Thick Outer Wing (Right) */
                <path 
                    d="M -5 38 Q 50 -25 105 38 L 105 45 Q 50 -15 -5 38 Z"
                    fill="#0f172a"
                />
            )}
        </svg>
    )}

    {/* OPEN EYE LASHES - Positioned relative to container, z-20 to sit on top of everything */}
    {/* Shifted UP to match y=38 eyeliner (approx +7px shift -> y=45 area) */}
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

const CartoonCat: React.FC<TypewriterCatProps> = ({ action, onAnimationEnd, lookAt }) => {
  const [blinking, setBlinking] = useState(false);

  // Blinking Logic
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 200);
    }, 3500 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Eye Tracking Logic (Head moves more)
  const headRotateX = lookAt ? -lookAt.y * 15 : 0;
  const headRotateY = lookAt ? lookAt.x * 15 : 0;
  
  // Body Tracking Logic (Body moves less, creating 3D parallax)
  const bodyRotateX = lookAt ? -lookAt.y * 5 : 0;
  const bodyRotateY = lookAt ? lookAt.x * 8 : 0;
  
  const pupilX = lookAt ? lookAt.x * 14 : 0;
  const pupilY = lookAt ? lookAt.y * 12 : 0;

  const isSquinting = blinking || action === CatAction.JUMP || action === CatAction.SNEEZE || action === CatAction.SHAKE;

  // Animation Styles
  const getContainerStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      transformStyle: 'preserve-3d',
    };

    switch (action) {
      case CatAction.SPIN:
        return { ...baseStyle, animation: 'spin 0.6s cubic-bezier(0.45, 0, 0.55, 1)' };
      case CatAction.JUMP:
        return { ...baseStyle, animation: 'jump 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)' };
      case CatAction.SHAKE:
         return { ...baseStyle, animation: 'shake 0.8s ease-in-out' };
      case CatAction.LAY:
        return { ...baseStyle, transform: 'translateY(80px) scaleY(0.7) scaleX(1.1)' };
      case CatAction.SNEEZE:
        return { ...baseStyle, animation: 'sneeze 0.4s cubic-bezier(.36,.07,.19,.97) both' };
      case CatAction.IDLE:
      default:
        return baseStyle;
    }
  };

  // Helper for Fur Gradients
  const furGradient = "bg-gradient-to-b from-amber-300 via-amber-400 to-orange-400";
  const furShadow = "shadow-[inset_0_-4px_10px_rgba(0,0,0,0.1)]"; // Internal shadow for plush look
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

      {/* --- THE FLUFFY CAT --- */}
      <div className="relative w-full h-full flex items-center justify-center animate-breathe origin-bottom" style={{ perspective: '1000px' }}>
        
        {/* === BODY GROUP === */}
        <div 
            className="absolute top-[42%] left-1/2 -translate-x-1/2 w-72 h-64 z-10"
            style={{ 
                transform: `translateX(-50%) rotateX(${bodyRotateX}deg) rotateY(${bodyRotateY}deg)`,
                transformStyle: 'preserve-3d'
            }}
        >
             {/* === TAIL (Matches Reference: Big, Fluffy, S-Curve) === */}
             <div 
                 className="absolute bottom-8 -right-4 w-48 h-80 origin-bottom-left z-[-10]"
                 style={{ 
                     transform: 'translateZ(-60px) rotate(25deg)', 
                 }}
             >
                 {/* Inner Animator for Swish or Wag */}
                 {/* CONDITIONAL ANIMATION: Use wag if active, otherwise swish */}
                 <div className={`w-full h-full origin-bottom-left relative ${action === CatAction.TAIL_WAG ? 'animate-tail-wag' : 'animate-tail-swish'}`}>
                     {/* Tail Body - S-Curve using Clip Path */}
                     <div className="absolute inset-0 bg-gradient-to-t from-amber-600 via-amber-300 to-white shadow-xl"
                          style={{
                              maskImage: 'linear-gradient(to top, black 80%, transparent 100%)',
                              clipPath: 'path("M 30 300 C 30 250, -20 180, 40 100 S 160 10, 160 60 C 160 110, 100 180, 80 300 Z")', // S-Shape
                              width: '100%',
                              height: '100%',
                          }}
                     >
                        <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: noiseOverlay }} />
                     </div>
                     
                     {/* -- Additional Fluff Tufts (The "Broken Line" Effect) -- */}
                     {/* Tip Fluff */}
                     <div className="absolute top-[10%] right-[10%] w-20 h-20 bg-white rounded-full blur-md opacity-90" />
                     
                     {/* Outer Curve Tufts (Right Side) */}
                     <div className="absolute top-[25%] right-[-5%] w-14 h-16 bg-amber-200 rounded-full blur-[4px] rotate-12" />
                     <div className="absolute top-[45%] right-[0%] w-16 h-16 bg-amber-300 rounded-full blur-[4px]" />
                     <div className="absolute bottom-[20%] right-[10%] w-16 h-20 bg-amber-400 rounded-full blur-[5px]" />
                     
                     {/* Inner Curve Tufts (Left Side) */}
                     <div className="absolute top-[20%] left-[15%] w-12 h-12 bg-white rounded-full blur-[3px]" />
                     <div className="absolute top-[40%] left-[5%] w-14 h-14 bg-amber-300 rounded-full blur-[3px]" />
                     
                     {/* Base Seamless Blender */}
                     <div className="absolute bottom-0 left-[10%] w-28 h-24 bg-amber-500 blur-xl rounded-full" />
                 </div>
             </div>

             {/* Spherical Main Body */}
             <div className={`absolute inset-0 ${furGradient} rounded-[45%_45%_40%_40%] shadow-xl overflow-hidden`}>
                {/* Shadow from Head casting down onto Body */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-48 h-24 bg-black/20 blur-xl rounded-full" />
             </div>
             
             {/* Noise Texture */}
             <div className="absolute inset-0 rounded-[45%_45%_40%_40%] opacity-30 mix-blend-overlay" style={{ backgroundImage: noiseOverlay }} />

             {/* Belly Patch */}
             <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 h-40 bg-white rounded-full blur-2xl opacity-70" />
             
             {/* Chest Fluff */}
             <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-20 bg-white/40 blur-lg rounded-full" />

             {/* === HIND LEGS (Haunches) === */}
             {/* Left Haunch */}
             <div className={`absolute bottom-2 -left-4 w-28 h-28 ${furGradient} rounded-full shadow-inner z-10`}>
                  <div className="absolute inset-0 opacity-30 mix-blend-overlay rounded-full" style={{ backgroundImage: noiseOverlay }} />
                  <div className="absolute top-2 left-4 w-12 h-12 bg-white/20 blur-lg rounded-full" />
             </div>
             {/* Right Haunch */}
             <div className={`absolute bottom-2 -right-4 w-28 h-28 ${furGradient} rounded-full shadow-inner z-10`}>
                  <div className="absolute inset-0 opacity-30 mix-blend-overlay rounded-full" style={{ backgroundImage: noiseOverlay }} />
                  <div className="absolute top-2 right-4 w-12 h-12 bg-white/20 blur-lg rounded-full" />
             </div>

             {/* === HIND FEET === */}
             <div className="absolute bottom-2 left-10 w-16 h-10 bg-white rounded-[1.5rem] shadow-md z-20 flex justify-center items-end pb-2 transform -rotate-6 border-b-2 border-gray-100/50">
                 <div className="w-1.5 h-4 bg-gray-200 rounded-full mx-1 opacity-50" />
                 <div className="w-1.5 h-4 bg-gray-200 rounded-full mx-1 opacity-50" />
             </div>
             <div className="absolute bottom-2 right-10 w-16 h-10 bg-white rounded-[1.5rem] shadow-md z-20 flex justify-center items-end pb-2 transform rotate-6 border-b-2 border-gray-100/50">
                 <div className="w-1.5 h-4 bg-gray-200 rounded-full mx-1 opacity-50" />
                 <div className="w-1.5 h-4 bg-gray-200 rounded-full mx-1 opacity-50" />
             </div>

             {/* === FRONT ARMS (Resting in front/sides) === */}
             {/* Left Arm */}
             <div className="absolute top-16 left-4 w-14 h-32 bg-white rounded-[2rem] shadow-md transform -rotate-6 flex flex-col justify-end items-center pb-4 border-l-2 border-gray-100/50 z-20 origin-top">
                <div className="w-[80%] h-full bg-gradient-to-b from-transparent to-gray-100/30 rounded-[2rem]" />
                <div className="absolute bottom-2 flex gap-1.5">
                    <div className="w-1 h-3 bg-gray-200 rounded-full" />
                    <div className="w-1 h-3 bg-gray-200 rounded-full" />
                    <div className="w-1 h-3 bg-gray-200 rounded-full" />
                </div>
             </div>
             
             {/* Right Arm */}
             <div className="absolute top-16 right-4 w-14 h-32 bg-white rounded-[2rem] shadow-md transform rotate-6 flex flex-col justify-end items-center pb-4 border-r-2 border-gray-100/50 z-20 origin-top">
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
            {/* -- Ears (Fluffy) -- */}
            {/* Left Ear */}
            <div className={`absolute -top-14 left-4 w-24 h-28 ${furGradient} rounded-tl-[3rem] rounded-tr-xl transform -rotate-12 origin-bottom-right shadow-sm overflow-hidden`}>
                <div className="absolute inset-0 bg-black/5 blur-sm" /> 
                <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: noiseOverlay }} />
                {/* Ear Fluff (White) */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-16 bg-pink-100 rounded-full blur-[2px]" />
                <div className="absolute bottom-4 left-2 w-4 h-8 bg-white rounded-full rotate-12 blur-[1px]" />
                <div className="absolute bottom-4 right-2 w-4 h-8 bg-white rounded-full -rotate-12 blur-[1px]" />
            </div>
             {/* Right Ear */}
            <div className={`absolute -top-14 right-4 w-24 h-28 ${furGradient} rounded-tr-[3rem] rounded-tl-xl transform rotate-12 origin-bottom-left shadow-sm overflow-hidden`}>
                <div className="absolute inset-0 bg-black/5 blur-sm" />
                <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: noiseOverlay }} />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-16 bg-pink-100 rounded-full blur-[2px]" />
                <div className="absolute bottom-4 left-2 w-4 h-8 bg-white rounded-full rotate-12 blur-[1px]" />
                <div className="absolute bottom-4 right-2 w-4 h-8 bg-white rounded-full -rotate-12 blur-[1px]" />
            </div>

            {/* --- DETAILED PINK BOW (Reference Style) --- */}
            <div className="absolute -top-6 -right-10 w-36 h-28 z-50 transform rotate-12 pointer-events-none origin-center drop-shadow-md">
                 {/* Left Loop */}
                 <div className="absolute top-2 left-0 w-16 h-20 bg-[#ff9ecd] border-[3px] border-[#5e1914] rounded-[40%_60%_40%_40%_/_40%_40%_60%_60%] transform -rotate-[20deg] z-10 overflow-hidden shadow-inner">
                      {/* Yellow Accent (Reference) */}
                      <div className="absolute -top-2 -left-2 w-8 h-8 bg-yellow-300 blur-md opacity-60" />
                      {/* Inner Crease */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-4 bg-[#db2777] rounded-full rotate-[-10deg] opacity-80" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1 bg-[#fce7f3] rounded-full rotate-[-10deg] mt-1 opacity-60" />
                      {/* Shine */}
                      <div className="absolute top-2 left-2 w-6 h-3 bg-white rounded-full blur-[1px] opacity-90" />
                 </div>

                 {/* Right Loop */}
                 <div className="absolute top-2 right-0 w-16 h-20 bg-[#ff9ecd] border-[3px] border-[#5e1914] rounded-[60%_40%_40%_40%_/_40%_40%_60%_60%] transform rotate-[20deg] z-10 overflow-hidden shadow-inner">
                      {/* Inner Crease */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-4 bg-[#db2777] rounded-full rotate-[10deg] opacity-80" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1 bg-[#fce7f3] rounded-full rotate-[10deg] mt-1 opacity-60" />
                      {/* Shine */}
                      <div className="absolute top-2 right-2 w-6 h-3 bg-white rounded-full blur-[1px] opacity-90" />
                 </div>

                 {/* Center Knot */}
                 <div className="absolute top-6 left-1/2 -translate-x-1/2 w-11 h-12 bg-[#ff9ecd] border-[3px] border-[#5e1914] rounded-[30%] z-20 flex justify-center items-center shadow-lg">
                     {/* Knot Folds */}
                     <div className="w-[2px] h-6 bg-[#db2777] rounded-full opacity-60 mr-1.5" />
                     <div className="w-[2px] h-6 bg-[#db2777] rounded-full opacity-60 ml-1.5" />
                     {/* Shine */}
                     <div className="absolute top-1.5 left-1.5 w-4 h-3 bg-white rounded-full blur-[0.5px] opacity-90" />
                 </div>
            </div>

            {/* -- Head Base (Oval + Tufts) -- */}
            <div className="relative w-72 h-60">
                {/* Main Face Shape */}
                <div className={`absolute inset-0 ${furGradient} ${furShadow} rounded-[45%] z-10 overflow-hidden`}>
                     <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: noiseOverlay }} />
                </div>

                {/* Cheek Puffs for Chubby Face */}
                <div className={`absolute bottom-[-10px] -left-6 w-28 h-28 ${furGradient} rounded-full z-10 shadow-inner overflow-hidden`}>
                     <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: noiseOverlay }} />
                </div>
                <div className={`absolute bottom-[-10px] -right-6 w-28 h-28 ${furGradient} rounded-full z-10 shadow-inner overflow-hidden`}>
                     <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: noiseOverlay }} />
                </div>

                {/* Fur Tufts (Breaking the silhouette) */}
                {/* Top Head */}
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-10 ${furGradient} rounded-full`} />
                
                {/* Side Fluff */}
                <div className={`absolute top-24 -left-8 w-8 h-12 ${furGradient} rounded-full -rotate-45`} />
                <div className={`absolute top-24 -right-8 w-8 h-12 ${furGradient} rounded-full rotate-45`} />

                {/* -- Face Details -- */}
                <div className="absolute inset-0 z-20 overflow-visible rounded-[45%]">
                     {/* Forehead Stripes (Softened) */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-20 bg-orange-500/20 rounded-full blur-md" />
                    <div className="absolute top-2 left-1/3 w-8 h-12 bg-orange-500/20 rounded-full blur-sm rotate-12" />
                    <div className="absolute top-2 right-1/3 w-8 h-12 bg-orange-500/20 rounded-full blur-sm -rotate-12" />

                    {/* White Face Mask (Cloud-like) */}
                    <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-32 h-32 bg-white rounded-full blur-xl opacity-90" />
                    <div className="absolute bottom-[-10px] left-8 w-32 h-32 bg-white rounded-full blur-lg opacity-80" />
                    <div className="absolute bottom-[-10px] right-8 w-32 h-32 bg-white rounded-full blur-lg opacity-80" />
                    
                    {/* Blush */}
                    <div className="absolute bottom-16 left-4 w-20 h-16 bg-pink-400/20 blur-xl rounded-full" />
                    <div className="absolute bottom-16 right-4 w-20 h-16 bg-pink-400/20 blur-xl rounded-full" />
                </div>

                {/* Eyes - Moved DOWN for shorter mid-face */}
                <div className="absolute top-28 left-0 w-full flex justify-center gap-8 px-4 z-30">
                    <CatEye isLeft={true} isSquinting={isSquinting} pupilX={pupilX} pupilY={pupilY} />
                    <CatEye isLeft={false} isSquinting={isSquinting} pupilX={pupilX} pupilY={pupilY} />
                </div>

                {/* Muzzle & Nose - Moved UP for shorter mid-face */}
                <div className="absolute top-40 left-1/2 -translate-x-1/2 w-40 h-28 flex flex-col items-center z-30">
                    {/* 3D Muzzle Shape */}
                    <div className="absolute -top-6 w-24 h-16 bg-white/90 blur-md rounded-full" />

                    {/* Nose */}
                    <div className={`relative w-8 h-6 bg-pink-400 rounded-[40%] shadow-sm mb-1 cursor-pointer hover:scale-110 transition-transform ${action === CatAction.SNEEZE ? 'animate-nose-wiggle' : ''}`}>
                        <div className="absolute top-1 left-2 w-3 h-2 bg-white/40 rounded-full" />
                    </div>
                    
                    {/* Mouth */}
                    <div className="flex -mt-2 opacity-80">
                         {/* Reduced size w-6 h-6, adjusted border thickness */}
                         <div className="w-6 h-6 border-b-[3px] border-r-[3px] border-gray-700 rounded-br-[20px] transform rotate-45" />
                         <div className="w-6 h-6 border-b-[3px] border-l-[3px] border-gray-700 rounded-bl-[20px] transform -rotate-45" />
                    </div>

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
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[95%] h-8 bg-red-500 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] z-40 flex justify-center items-center">
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
        .animate-breathe {
            animation: breathe 4s ease-in-out infinite;
        }
        .animate-nose-wiggle {
            animation: noseWiggle 0.3s ease-in-out infinite;
        }
        .animate-bell-ring {
            animation: bellRing 0.5s ease-in-out infinite;
            transform-origin: top center;
        }
        .animate-tail-swish {
            animation: tailSwish 4s ease-in-out infinite alternate;
        }
        .animate-tail-wag {
            animation: tailWag 0.2s ease-in-out infinite;
        }
        
        /* Droplet Animations */
        .animate-droplet-1 { animation: dropletFly 0.5s ease-out forwards; --tx: -20px; --ty: -40px; }
        .animate-droplet-2 { animation: dropletFly 0.5s ease-out 0.05s forwards; --tx: -35px; --ty: -30px; }
        .animate-droplet-3 { animation: dropletFly 0.5s ease-out 0.1s forwards; --tx: 20px; --ty: -45px; }
        .animate-droplet-4 { animation: dropletFly 0.5s ease-out 0.02s forwards; --tx: -10px; --ty: -50px; }
        .animate-droplet-5 { animation: dropletFly 0.5s ease-out 0.08s forwards; --tx: 30px; --ty: -20px; }

        @keyframes dropletFly {
            0% { transform: translate(0, 0) scale(1); opacity: 1; }
            100% { transform: translate(var(--tx), var(--ty)) scale(0.5); opacity: 0; }
        }
        
        @keyframes noseWiggle {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2) rotate(8deg); }
        }

        @keyframes bellRing {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(25deg); }
            75% { transform: rotate(-25deg); }
        }

        @keyframes tailSwish {
            0% { transform: rotate(-5deg); }
            100% { transform: rotate(5deg); }
        }
        
        @keyframes tailWag {
            0% { transform: rotate(10deg) scale(1.1); }
            50% { transform: rotate(50deg) scale(1.1); }
            100% { transform: rotate(10deg) scale(1.1); }
        }

        @keyframes spin {
          0% { transform: rotateY(0deg) scale(1); }
          50% { transform: rotateY(180deg) scale(0.9); }
          100% { transform: rotateY(360deg) scale(1); }
        }
        
        @keyframes jump {
          0% { transform: translateY(0) scale(1,1); }
          30% { transform: translateY(20px) scale(1.2, 0.8); }
          40% { transform: translateY(-120px) scale(0.9, 1.1) rotate(-5deg); }
          60% { transform: translateY(-120px) scale(0.9, 1.1) rotate(5deg); }
          80% { transform: translateY(10px) scale(1.1, 0.9); }
          100% { transform: translateY(0) scale(1,1); }
        }

        @keyframes shake {
           0%, 100% { transform: rotate(0deg); }
           20% { transform: rotate(8deg); }
           40% { transform: rotate(-8deg); }
           60% { transform: rotate(6deg); }
           80% { transform: rotate(-6deg); }
        }

        @keyframes sneeze {
          0% { transform: scale(1); }
          30% { transform: scale(1.05) rotateX(-15deg); }
          40% { transform: scale(0.85) translateY(15px); }
          45% { transform: scale(1.15) translateY(-20px) rotateX(15deg); }
          100% { transform: scale(1); }
        }

        @keyframes breathe {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.03) translateY(-5px); }
        }
      `}</style>
    </div>
  );
};

export default CartoonCat;
