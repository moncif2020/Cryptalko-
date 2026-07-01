import { useEffect } from 'react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SecurePadlockProps {
  isLocked: boolean;
  status: 'idle' | 'searching' | 'locked';
  isDarkMode?: boolean;
}

export const SecurePadlock = ({ isLocked, status, isDarkMode = true }: SecurePadlockProps) => {
  let color = '#FF6B00';
  let glowColor = 'rgba(255, 107, 0, 0.4)';

  if (status === 'idle') {
    color = '#A1A1AA'; // elegant zinc-400
    glowColor = 'rgba(161, 161, 170, 0.15)';
  } else if (status === 'locked') {
    color = '#FFB300';
    glowColor = 'rgba(255, 179, 0, 0.4)';
  } else {
    color = '#FF6B00';
    glowColor = 'rgba(255, 107, 0, 0.4)';
  }

  useEffect(() => {
    if (isLocked && navigator.vibrate) {
      try {
        navigator.vibrate(50); // Soft haptic buzz
      } catch (e) {
        // Safe catch for environment restrictions
      }
    }
  }, [isLocked]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <motion.div
          animate={{
            opacity: status === 'idle' ? [0.1, 0.25, 0.1] : [0.2, 0.6, 0.2],
            scale: status === 'idle' ? [1, 1.1, 1] : [1, 1.3, 1],
          }}
          transition={{ duration: status === 'idle' ? 8 : 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full blur-[80px]"
          style={{ backgroundColor: glowColor }}
        />
        
        <div className="relative z-10 flex flex-col items-center">
           <motion.div
             initial={false}
             animate={{ color: color }}
             className={cn(
               "relative p-8 backdrop-blur-md rounded-3xl border shadow-2xl transition-all duration-300",
               isDarkMode ? "bg-black/60 border-white/10" : "bg-white/85 border-zinc-200",
               status === 'idle' && "group-hover/padlock:border-[#FF6B00]/40 group-hover/padlock:bg-black/80 group-hover/padlock:shadow-[0_0_30px_rgba(255,107,0,0.15)]"
             )}
           >
             {/* Custom Animated Padlock SVG */}
             <svg width="70" height="90" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
               {/* Shackle (The top arc) */}
               <motion.path
                 d="M20 40V25C20 13.9543 28.9543 5 40 5C51.0457 5 60 13.9543 60 25V40"
                 stroke="currentColor"
                 strokeWidth="8"
                 strokeLinecap="round"
                 animate={{
                   y: isLocked ? 10 : 0,
                 }}
                 transition={{
                   type: "spring",
                   stiffness: isLocked ? 500 : 200,
                   damping: 15
                 }}
               />
               {/* Lock Body */}
               <rect x="10" y="40" width="60" height="50" rx="8" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="6" />
               {/* Keyhole */}
               <circle cx="40" cy="65" r="6" fill="currentColor" />
               <rect x="37" y="65" width="6" height="12" rx="2" fill="currentColor" />
             </svg>
             
             {/* Core Pulse */}
             <motion.div
               animate={{
                 scale: status === 'idle' ? [1, 1.4, 1] : [1, 2, 1],
                 opacity: status === 'idle' ? [0.15, 0.4, 0.15] : [0.3, 0.7, 0.3],
               }}
               transition={{ duration: status === 'idle' ? 4 : 2.5, repeat: Infinity }}
               className="absolute top-[65%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full blur-md"
               style={{ backgroundColor: color }}
             />

             {/* Tap to connect indicator overlay banner when idle */}
             {status === 'idle' && (
               <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className={cn(
                   "absolute -bottom-3 left-1/2 -translate-x-1/2 border px-3 py-1 rounded-full text-[8px] font-bold tracking-[0.2em] uppercase whitespace-nowrap transition-all duration-300 shadow-md flex items-center space-x-1.5",
                   isDarkMode ? "bg-zinc-800/95 border-white/10 text-white/80" : "bg-white border-zinc-200 text-zinc-700",
                   "group-hover/padlock:bg-[#FF6B00]/90 group-hover/padlock:border-[#FF6B00]/50 group-hover/padlock:text-black"
                 )}
               >
                 <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B00]/60 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6B00]"></span>
                 </span>
                 <span>TAP TO INITIALIZE</span>
               </motion.div>
             )}
           </motion.div>
           
           {/* CryptAlko Text */}
           <div className="relative mt-8">
             <motion.h1 
               className="text-4xl font-black tracking-[0.25em] uppercase font-mono bg-clip-text text-transparent transition-all duration-300"
               style={{ 
                 backgroundImage: `linear-gradient(90deg, ${color} 0%, ${isDarkMode ? '#fff' : '#18181b'} 50%, ${color} 100%)`,
                 backgroundSize: '200% auto',
               }}
               animate={{ backgroundPosition: ['0% center', '200% center'] }}
               transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
             >
               CryptAlko
             </motion.h1>
           </div>
        </div>
      </div>
    </div>
  );
};
