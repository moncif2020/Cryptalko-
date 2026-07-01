import { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, Loader2, Lock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface RoomControlsProps {
  status: 'idle' | 'searching' | 'locked';
  role: 'host' | 'peer';
  roomId: string | null;
  addLog: (type: 'INFO' | 'SUCCESS' | 'SECURE' | 'ERROR' | 'WARN', message: string) => void;
  joinRoom: (code: string) => Promise<void>;
  getScanUrl: () => string;
  setIsScanning: (scanning: boolean) => void;
  isDarkMode: boolean;
}

export const RoomControls = ({
  status,
  role,
  roomId,
  addLog,
  joinRoom,
  getScanUrl,
  setIsScanning,
  isDarkMode,
}: RoomControlsProps) => {
  const [manualRoomCode, setManualRoomCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  return (
    <div className="w-full flex flex-col items-center">
      {/* --- Manual Room ID Input (Visible on Idle/Standby) --- */}
      {status === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mt-6 p-6 backdrop-blur-md rounded-2xl border shadow-lg max-w-sm w-full text-center flex flex-col items-center space-y-4 relative z-20 font-sans transition-all duration-300",
            isDarkMode ? "bg-black/60 border-white/5" : "bg-white border-zinc-200"
          )}
        >
          <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#FF6B00] font-bold">
            خيارات ربط جسر التواصل (Bridge Options)
          </div>
          
          <button
            onClick={() => {
              setIsScanning(true);
              addLog('INFO', 'بروتوكول مسح الكاميرا مفعل. بانتظار تصريح الكاميرا...');
            }}
            className="w-full flex items-center justify-center space-x-2 px-5 py-3.5 bg-[#FF6B00]/10 hover:bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/20 font-mono font-bold text-xs rounded-xl transition-all uppercase tracking-wider cursor-pointer group"
          >
            <Camera size={14} className="group-hover:scale-110 transition-transform ml-2" />
            <span>مسح رمز QR بالكاميرا</span>
          </button>

          <div className={cn(
            "flex items-center justify-center space-x-2 w-full font-mono text-[9px] uppercase",
            isDarkMode ? "text-white/30" : "text-zinc-400"
          )}>
            <div className={cn("h-px flex-1", isDarkMode ? "bg-white/10" : "bg-zinc-200")} />
            <span>أو أدخل كود الغرفة يدويًا</span>
            <div className={cn("h-px flex-1", isDarkMode ? "bg-white/10" : "bg-zinc-200")} />
          </div>

          <p className={cn(
            "text-[10px] font-sans leading-relaxed",
            isDarkMode ? "text-white/50" : "text-zinc-600"
          )}>
            أدخل الرمز المكون من 6 أحرف المعروض على الجهاز المستضيف:
          </p>

          <div className="flex items-center space-x-2 w-full">
            <input
              type="text"
              value={manualRoomCode}
              onChange={(e) => setManualRoomCode(e.target.value.toUpperCase())}
              placeholder="مثال: X8F2A9"
              maxLength={6}
              className={cn(
                "border rounded-xl px-4 py-3 text-xs font-mono text-center uppercase tracking-widest focus:outline-none flex-1 transition-all",
                isDarkMode 
                  ? "bg-[#121212] border-white/10 text-[#FFB300] placeholder-white/10 focus:border-[#FFB300]/50" 
                  : "bg-white border-zinc-300 text-amber-700 placeholder-zinc-400 focus:border-amber-500"
              )}
            />
            <button
              onClick={() => {
                const val = manualRoomCode.trim();
                if (val && val.length === 6) {
                  joinRoom(val);
                } else {
                  addLog('ERROR', 'رمز غير صالح. يجب أن يتكون من 6 أحرف.');
                }
              }}
              className="px-5 py-3 bg-[#FFB300]/10 hover:bg-[#FFB300]/20 text-[#FFB300] border border-[#FFB300]/20 font-mono font-bold text-xs rounded-xl transition-all uppercase tracking-wider cursor-pointer"
            >
              اتصال
            </button>
          </div>
        </motion.div>
      )}

      {/* --- Live, Interactive P2P Join QR Code (Visible on Host Device) --- */}
      {status === 'searching' && role === 'host' && roomId && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={cn(
            "mt-8 p-6 backdrop-blur-md rounded-2xl border shadow-lg w-full text-center flex flex-col items-center space-y-4 relative z-20 transition-all duration-300",
            isDarkMode ? "bg-black/80 border-[#FF6B00]/30 shadow-[#FF6B00]/10" : "bg-white border-orange-200 shadow-orange-100/40"
          )}
        >
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF6B00] font-bold">
            Handshake Required (Device B)
          </div>

          <div className={cn(
            "flex flex-col items-center space-y-1.5 rounded-xl px-6 py-3 w-full shadow-inner border transition-all",
            isDarkMode ? "bg-[#121212]/90 border-white/5" : "bg-zinc-50 border-zinc-200"
          )}>
            <span className={cn(
              "text-[9px] font-mono uppercase tracking-widest",
              isDarkMode ? "text-white/40" : "text-zinc-500"
            )}>كود الغرفة اليدوي // MANUAL ROOM CODE</span>
            <span className="text-2xl font-mono font-black text-[#FF6B00] tracking-[0.3em] select-all uppercase">
              {roomId}
            </span>
          </div>
          
          {/* Glowing QR wrapper styled to match CryptAlko's premium brand identity (Image 1) */}
          <div className="relative p-4 bg-[#0d0d0f] rounded-2xl shadow-2xl border border-[#FF6B00]/30 group/qr overflow-hidden">
            {/* Subtle background circuit-like decorative details */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,107,0,0.08)_0%,transparent_70%)] pointer-events-none" />
            
            <QRCodeSVG 
              value={getScanUrl()} 
              size={180}
              bgColor="transparent"
              fgColor="#FF6B00"
              level="H"
            />

            {/* Premium Center Brand Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[68px] h-[68px] bg-[#0d0d0f] rounded-xl border border-[#FF6B00]/40 flex flex-col items-center justify-center p-1 shadow-[0_0_15px_rgba(255,107,0,0.35),inset_0_0_8px_rgba(0,0,0,0.8)] select-none pointer-events-none">
              <span className="text-[8px] font-mono font-black text-[#FF6B00] tracking-wider mb-0.5 uppercase drop-shadow-[0_0_2px_rgba(255,107,0,0.5)]">
                CryptAlko
              </span>
              <Lock size={15} className="text-[#FF6B00] drop-shadow-[0_0_3px_rgba(255,107,0,0.6)] animate-pulse" />
            </div>
          </div>

          <div className="space-y-2 w-full">
            <p className={cn(
              "text-[10px] font-mono",
              isDarkMode ? "text-white/50" : "text-zinc-600"
            )}>SCAN CODES TO CONNECT OR COPY INVITE LINK:</p>
            <div className={cn(
              "flex items-center space-x-2 p-1.5 rounded-lg border w-full overflow-hidden transition-all",
              isDarkMode ? "bg-white/5 border-white/10" : "bg-zinc-50 border-zinc-200"
            )}>
              <span className={cn(
                "text-[9px] font-mono truncate flex-1 select-all px-1",
                isDarkMode ? "text-white/40" : "text-zinc-500"
              )}>
                {getScanUrl()}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getScanUrl());
                  setCopied(true);
                  addLog('SUCCESS', 'Connection parameters copied successfully.');
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-3 py-1 rounded bg-[#FF6B00] text-black font-mono font-bold text-[9px] uppercase hover:bg-orange-400 transition-colors whitespace-nowrap"
              >
                {copied ? 'COPIED!' : 'COPY'}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B00]/70 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6B00]"></span>
            </span>
            <span className={cn(
              "text-[9px] font-mono uppercase tracking-widest animate-pulse",
              isDarkMode ? "text-white/60" : "text-zinc-500"
            )}>
              Awaiting scanning handshake...
            </span>
          </div>
        </motion.div>
      )}

      {/* --- Joining Loading Indicator for Peer Device --- */}
      {status === 'searching' && role === 'peer' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={cn(
            "mt-8 p-6 backdrop-blur-md rounded-2xl border shadow-lg w-full text-center flex flex-col items-center space-y-4 transition-all duration-300",
            isDarkMode ? "bg-black/80 border-[#FF6B00]/30 shadow-[#FF6B00]/10" : "bg-white border-orange-200 shadow-orange-100/40"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00]">
            <Loader2 className="animate-spin" size={18} />
          </div>
          <div className="space-y-1">
            <h3 className="font-mono text-xs font-bold text-[#FF6B00] uppercase tracking-wider">Establishing Lock Tunnel</h3>
            <p className={cn(
              "text-[10px] font-mono",
              isDarkMode ? "text-white/40" : "text-zinc-500"
            )}>Negotiating encryption keys with host node...</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
