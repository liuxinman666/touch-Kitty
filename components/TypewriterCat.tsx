
import React, { useState, useEffect } from 'react';
import { CatAction } from '../types';

interface TypewriterCatProps {
  action: CatAction;
  onAnimationEnd: () => void;
  lookAt: { x: number, y: number } | null; // Coordinates -1 to 1
}

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

  // Eye Tracking Logic
  const headRotateX = lookAt ? -lookAt.y * 15 : 0;
  const headRotateY = lookAt ? lookAt.x * 15 : 0;
  
  const pupilX = lookAt ? lookAt.x * 12 : 0;
  const pupilY = lookAt ? lookAt.y * 10 : 0;

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
      <div className="relative w-full h-full flex items-center justify-center animate-breathe origin-bottom">
        
        {/* === HEAD GROUP === */}
        <div 
            className="absolute z-20 top-[15%]"
            style={{ 
                transform: `rotateX(${headRotateX}deg) rotateY(${headRotateY}deg)`,
                transformStyle: 'preserve-3d'
            }}
        >
            {/* -- Ears (Fluffy) -- */}
            {/* Left Ear */}
            <div className={`absolute -top-14 left-4 w-24 h-28 ${furGradient} rounded-tl-[3rem] rounded-tr-xl transform -rotate-12 origin-bottom-right shadow-sm overflow-hidden`}>
                <div className="absolute inset-0 bg-black/5 blur-sm" /> 
                {/* Ear Fluff (White) */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-16 bg-pink-100 rounded-full blur-[2px]" />
                <div className="absolute bottom-4 left-2 w-4 h-8 bg-white rounded-full rotate-12 blur-[1px]" />
                <div className="absolute bottom-4 right-2 w-4 h-8 bg-white rounded-full -rotate-12 blur-[1px]" />
            </div>
             {/* Right Ear */}
            <div className={`absolute -top-14 right-4 w-24 h-28 ${furGradient} rounded-tr-[3rem] rounded-tl-xl transform rotate-12 origin-bottom-left shadow-sm overflow-hidden`}>
                <div className="absolute inset-0 bg-black/5 blur-sm" />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-16 bg-pink-100 rounded-full blur-[2px]" />
                <div className="absolute bottom-4 left-2 w-4 h-8 bg-white rounded-full rotate-12 blur-[1px]" />
                <div className="absolute bottom-4 right-2 w-4 h-8 bg-white rounded-full -rotate-12 blur-[1px]" />
            </div>

            {/* -- Head Base (Oval + Tufts) -- */}
            <div className="relative w-72 h-60">
                {/* Main Face Shape */}
                <div className={`absolute inset-0 ${furGradient} ${furShadow} rounded-[45%] z-10`} />

                {/* Fur Tufts (Breaking the silhouette) */}
                {/* Top Head */}
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-10 ${furGradient} rounded-full`} />
                <div className={`absolute -top-4 left-28 w-6 h-8 ${furGradient} rounded-full rotate-12`} />
                <div className={`absolute -top-4 right-28 w-6 h-8 ${furGradient} rounded-full -rotate-12`} />
                
                {/* Left Cheek Fluff */}
                <div className={`absolute top-24 -left-3 w-8 h-12 ${furGradient} rounded-full -rotate-45`} />
                <div className={`absolute top-32 -left-2 w-8 h-12 ${furGradient} rounded-full -rotate-[30deg]`} />
                <div className={`absolute top-40 left-0 w-8 h-10 ${furGradient} rounded-full -rotate-12`} />
                
                {/* Right Cheek Fluff */}
                <div className={`absolute top-24 -right-3 w-8 h-12 ${furGradient} rounded-full rotate-45`} />
                <div className={`absolute top-32 -right-2 w-8 h-12 ${furGradient} rounded-full rotate-[30deg]`} />
                <div className={`absolute top-40 right-0 w-8 h-10 ${furGradient} rounded-full rotate-12`} />

                {/* -- Face Details -- */}
                <div className="absolute inset-0 z-20 overflow-hidden rounded-[45%]">
                     {/* Forehead Stripes (Softened) */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-20 bg-orange-500/20 rounded-full blur-md" />
                    <div className="absolute top-2 left-1/3 w-8 h-12 bg-orange-500/20 rounded-full blur-sm rotate-12" />
                    <div className="absolute top-2 right-1/3 w-8 h-12 bg-orange-500/20 rounded-full blur-sm -rotate-12" />

                    {/* White Face Mask (Cloud-like) */}
                    <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-32 h-32 bg-white rounded-full blur-xl opacity-90" />
                    <div className="absolute bottom-[-10px] left-10 w-28 h-28 bg-white rounded-full blur-lg opacity-80" />
                    <div className="absolute bottom-[-10px] right-10 w-28 h-28 bg-white rounded-full blur-lg opacity-80" />
                    
                    {/* Blush */}
                    <div className="absolute bottom-16 left-8 w-16 h-12 bg-pink-400/20 blur-xl rounded-full" />
                    <div className="absolute bottom-16 right-8 w-16 h-12 bg-pink-400/20 blur-xl rounded-full" />
                </div>

                {/* Eyes */}
                <div className="absolute top-20 left-0 w-full flex justify-center gap-10 px-4 z-30">
                    <CatEye isLeft={true} isSquinting={isSquinting} pupilX={pupilX} pupilY={pupilY} />
                    <CatEye isLeft={false} isSquinting={isSquinting} pupilX={pupilX} pupilY={pupilY} />
                </div>

                {/* Muzzle & Nose */}
                <div className="absolute top-40 left-1/2 -translate-x-1/2 w-40 h-28 flex flex-col items-center z-30">
                    {/* Nose */}
                    <div className={`relative w-8 h-6 bg-pink-400 rounded-[40%] shadow-sm mb-1 cursor-pointer hover:scale-110 transition-transform ${action === CatAction.SNEEZE ? 'animate-nose-wiggle' : ''}`}>
                        <div className="absolute top-1 left-2 w-3 h-2 bg-white/40 rounded-full" />
                    </div>
                    
                    {/* Mouth */}
                    <div className="flex -mt-3 opacity-80">
                         <div className="w-8 h-8 border-b-[4px] border-r-[4px] border-gray-700 rounded-br-[20px] transform rotate-45" />
                         <div className="w-8 h-8 border-b-[4px] border-l-[4px] border-gray-700 rounded-bl-[20px] transform -rotate-45" />
                    </div>

                    {/* Whiskers */}
                    <div className="absolute top-5 left-[-40px] w-28 h-20 pointer-events-none">
                         <div className="h-[2px] w-full bg-gray-800/20 mb-3 transform rotate-6 origin-right rounded-full shadow-sm" />
                         <div className="h-[2px] w-full bg-gray-800/20 mb-3 transform rotate-0 origin-right rounded-full shadow-sm" />
                         <div className="h-[2px] w-full bg-gray-800/20 transform -rotate-6 origin-right rounded-full shadow-sm" />
                    </div>
                    <div className="absolute top-5 right-[-40px] w-28 h-20 pointer-events-none">
                         <div className="h-[2px] w-full bg-gray-800/20 mb-3 transform -rotate-6 origin-left rounded-full shadow-sm" />
                         <div className="h-[2px] w-full bg-gray-800/20 mb-3 transform rotate-0 origin-left rounded-full shadow-sm" />
                         <div className="h-[2px] w-full bg-gray-800/20 transform rotate-6 origin-left rounded-full shadow-sm" />
                    </div>
                </div>

                {/* Collar */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[90%] h-8 bg-red-500 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] z-40 flex justify-center items-center">
                    <div className={`absolute top-3 w-10 h-10 bg-yellow-400 rounded-full border border-yellow-600 flex items-center justify-center shadow-lg ${isMoving(action) ? 'animate-bell-ring' : ''}`}>
                        <div className="w-full h-[1px] bg-yellow-700/50 absolute top-1/3" />
                        <div className="w-2 h-2 bg-yellow-800 rounded-full mt-3 opacity-80" />
                        <div className="absolute top-2 left-2 w-3 h-3 bg-white rounded-full opacity-60 blur-[1px]" />
                    </div>
                </div>
            </div>
        </div>

        {/* === BODY GROUP === */}
        <div className="absolute top-[50%] left-1/2 -translate-x-1/2 w-64 h-52 z-10">
             {/* Main Body */}
             <div className={`absolute inset-0 ${furGradient} rounded-[3rem_3rem_2.5rem_2.5rem] shadow-xl`} />
             
             {/* Belly Patch (Soft Cloud) */}
             <div className="absolute top-10 left-1/2 -translate-x-1/2 w-40 h-36 bg-white rounded-full blur-xl opacity-80" />
             
             {/* Body Fluff Tufts */}
             <div className={`absolute top-10 -left-4 w-10 h-16 ${furGradient} rounded-full -rotate-12`} />
             <div className={`absolute top-24 -left-3 w-10 h-16 ${furGradient} rounded-full -rotate-6`} />
             
             <div className={`absolute top-10 -right-4 w-10 h-16 ${furGradient} rounded-full rotate-12`} />
             <div className={`absolute top-24 -right-3 w-10 h-16 ${furGradient} rounded-full rotate-6`} />

             {/* Paws (White Mittens) */}
             {/* Left Paw */}
             <div className="absolute -bottom-4 left-6 w-24 h-16 bg-white rounded-[2rem] shadow-md transform -rotate-6 flex justify-center items-end pb-2 gap-2 border-b-4 border-gray-100">
                <div className="w-1 h-5 bg-gray-200 rounded-full" />
                <div className="w-1 h-5 bg-gray-200 rounded-full" />
                <div className="w-1 h-5 bg-gray-200 rounded-full" />
             </div>
             {/* Right Paw */}
             <div className="absolute -bottom-4 right-6 w-24 h-16 bg-white rounded-[2rem] shadow-md transform rotate-6 flex justify-center items-end pb-2 gap-2 border-b-4 border-gray-100">
                <div className="w-1 h-5 bg-gray-200 rounded-full" />
                <div className="w-1 h-5 bg-gray-200 rounded-full" />
                <div className="w-1 h-5 bg-gray-200 rounded-full" />
             </div>
        </div>

      </div>

      <style>{`
        .animate-breathe {
            animation: breathe 3s ease-in-out infinite;
        }
        .animate-nose-wiggle {
            animation: noseWiggle 0.3s ease-in-out infinite;
        }
        .animate-bell-ring {
            animation: bellRing 0.5s ease-in-out infinite;
            transform-origin: top center;
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
          50% { transform: scale(1.02) translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

// --- Sub-Components ---

interface CatEyeProps {
    isLeft: boolean;
    isSquinting: boolean;
    pupilX: number;
    pupilY: number;
}

const CatEye: React.FC<CatEyeProps> = ({ isLeft, isSquinting, pupilX, pupilY }) => {
    return (
        <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Open Eye */}
            <div className={`absolute inset-0 bg-white rounded-full shadow-md overflow-hidden transition-all duration-150 ease-in-out ${isSquinting ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
                {/* Iris */}
                <div 
                    className="absolute w-14 h-14 bg-sky-500 rounded-full top-1/2 left-1/2 shadow-inner"
                    style={{ transform: `translate(-50%, -50%) translate(${pupilX}px, ${pupilY}px)` }}
                >
                    {/* Pupil */}
                    <div className="absolute w-8 h-8 bg-gray-900 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    {/* Highlights */}
                    <div className="absolute w-5 h-4 bg-white rounded-full top-2 right-3 opacity-90 blur-[0.5px]" />
                    <div className="absolute w-2 h-2 bg-white rounded-full bottom-3 left-4 opacity-60 blur-[0.5px]" />
                </div>
            </div>

            {/* Closed/Squinting Eye */}
            <div className={`absolute inset-0 z-10 flex items-center justify-center transition-all duration-150 ease-in-out ${isSquinting ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}>
                <svg width="100%" height="100%" viewBox="0 0 80 80" className="drop-shadow-sm overflow-visible">
                     <path d="M 15 50 Q 40 15 65 50" fill="transparent" stroke="#1f2937" strokeWidth="6" strokeLinecap="round" />
                     {isLeft ? (
                         <>
                             <path d="M 18 45 L 8 35" stroke="#1f2937" strokeWidth="5" strokeLinecap="round" />
                             <path d="M 25 35 L 18 22" stroke="#1f2937" strokeWidth="5" strokeLinecap="round" />
                         </>
                     ) : (
                         <>
                             <path d="M 62 45 L 72 35" stroke="#1f2937" strokeWidth="5" strokeLinecap="round" />
                             <path d="M 55 35 L 62 22" stroke="#1f2937" strokeWidth="5" strokeLinecap="round" />
                         </>
                     )}
                </svg>
            </div>
        </div>
    );
};

function isMoving(action: CatAction): boolean {
    return action === CatAction.JUMP || action === CatAction.SPIN || action === CatAction.SNEEZE || action === CatAction.SHAKE;
}

export default CartoonCat;
