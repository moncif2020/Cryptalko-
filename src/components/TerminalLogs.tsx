import { motion, AnimatePresence } from 'motion/react';
import { Terminal, KeyRound, Sliders, Trash2 } from 'lucide-react';
import { LogEntry } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TerminalLogsProps {
  showTerminal: boolean;
  setShowTerminal: (show: boolean) => void;
  logs: LogEntry[];
  setLogs: (logs: LogEntry[]) => void;
  encryptionKey: string;
  setEncryptionKey: (key: string) => void;
  cipherAlgorithm: string;
  setCipherAlgorithm: (algo: string) => void;
  derivationRounds: number;
  setDerivationRounds: (rounds: number) => void;
  vibrationEnabled: boolean;
  setVibrationEnabled: (enabled: boolean) => void;
  addLog: (type: 'INFO' | 'SUCCESS' | 'SECURE' | 'ERROR' | 'WARN', message: string) => void;
  startHandshake: (force?: boolean) => void;
  isDarkMode: boolean;
}

export const TerminalLogs = ({
  showTerminal,
  setShowTerminal,
  logs,
  setLogs,
  encryptionKey,
  setEncryptionKey,
  cipherAlgorithm,
  setCipherAlgorithm,
  derivationRounds,
  setDerivationRounds,
  vibrationEnabled,
  setVibrationEnabled,
  addLog,
  startHandshake,
  isDarkMode,
}: TerminalLogsProps) => {
  return (
    <AnimatePresence>
      {showTerminal && (
        <motion.aside
          initial={{ opacity: 0, x: 350 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 350 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={cn(
            "w-full md:w-[380px] border-t md:border-t-0 md:border-l relative z-20 flex flex-col h-full md:h-screen shadow-2xl shrink-0 transition-all duration-300",
            isDarkMode 
              ? "bg-[#161616] border-white/5 text-white" 
              : "bg-white border-zinc-200 text-zinc-800"
          )}
        >
          {/* Header / Config Panel */}
          <div className={cn(
            "p-4 border-b flex items-center justify-between",
            isDarkMode ? "border-white/5 bg-black/40" : "border-zinc-200 bg-zinc-100"
          )}>
            <div className="flex items-center space-x-2">
              <Terminal className="text-[#FF6B00]" size={16} />
              <span className="font-mono text-xs font-bold tracking-wider text-[#FF6B00] uppercase">Cryptographic Terminal</span>
            </div>
            <button 
              onClick={() => setShowTerminal(false)}
              className={cn(
                "font-mono text-xs px-2 py-1 rounded cursor-pointer transition-colors",
                isDarkMode ? "text-white/40 hover:text-white hover:bg-white/5" : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200"
              )}
            >
              [CLOSE]
            </button>
          </div>

          {/* Config & Settings Form Controls */}
          <div className={cn(
            "p-4 border-b space-y-4 text-xs font-mono transition-colors",
            isDarkMode ? "border-white/5 bg-black/20" : "border-zinc-200 bg-zinc-50"
          )}>
            <div className={cn(
              "flex items-center space-x-2 pb-1 border-b uppercase font-bold text-[10px]",
              isDarkMode ? "border-white/5 text-[#FF6B00]/70" : "border-zinc-200 text-orange-600"
            )}>
              <KeyRound size={12} />
              <span>Enclave Cipher Configuration</span>
            </div>

            {/* Encryption Key Input */}
            <div className="space-y-1.5">
              <label className={cn(
                "block text-[10px] uppercase",
                isDarkMode ? "text-white/50" : "text-zinc-500"
              )}>Session Passphrase / Key (Hex Digest)</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={encryptionKey}
                  onChange={(e) => {
                    setEncryptionKey(e.target.value);
                    addLog('WARN', 'Master entropy hash key modified by operator.');
                  }}
                  className={cn(
                    "w-full rounded px-2.5 py-1.5 text-xs focus:outline-none transition-colors",
                    isDarkMode 
                      ? "bg-[#121212] border border-white/10 text-[#FFB300] focus:border-[#FFB300]/40" 
                      : "bg-white border border-zinc-300 text-amber-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  )}
                />
              </div>
            </div>

            {/* Algorithm Selection */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className={cn(
                  "block text-[10px] uppercase",
                  isDarkMode ? "text-white/50" : "text-zinc-500"
                )}>Cipher Algorithm</label>
                <select
                  value={cipherAlgorithm}
                  onChange={(e) => {
                    setCipherAlgorithm(e.target.value);
                    addLog('SECURE', `Recalibrated cipher stream schema: ${e.target.value}`);
                  }}
                  className={cn(
                    "w-full rounded px-2 py-1.5 text-xs focus:outline-none cursor-pointer transition-colors",
                    isDarkMode 
                      ? "bg-[#121212] border border-white/10 text-white/90" 
                      : "bg-white border border-zinc-300 text-zinc-800"
                  )}
                >
                  <option value="AES-256-GCM">AES-256-GCM</option>
                  <option value="ChaCha20">ChaCha20-Poly1305</option>
                  <option value="RSA-4096">RSA-4096-PSS</option>
                </select>
              </div>

              {/* PBKDF2 Rounds */}
              <div className="space-y-1.5">
                <label className={cn(
                  "block text-[10px] uppercase",
                  isDarkMode ? "text-white/50" : "text-zinc-500"
                )}>PBKDF2 Rounds</label>
                <select
                  value={derivationRounds}
                  onChange={(e) => {
                    setDerivationRounds(Number(e.target.value));
                    addLog('INFO', `Strengthened key derivation: PBKDF2 iteration count to ${e.target.value}`);
                  }}
                  className={cn(
                    "w-full rounded px-2 py-1.5 text-xs focus:outline-none cursor-pointer transition-colors",
                    isDarkMode 
                      ? "bg-[#121212] border border-white/10 text-white/90" 
                      : "bg-white border border-zinc-300 text-zinc-800"
                  )}
                >
                  <option value="5000">5,000 (Fast)</option>
                  <option value="10000">10,000 (Safe)</option>
                  <option value="50000">5,0000 (Fortified)</option>
                </select>
              </div>
            </div>

            {/* Extras and Toggles */}
            <div className={cn(
              "flex items-center justify-between pt-1 text-[10px]",
              isDarkMode ? "text-white/60" : "text-zinc-600"
            )}>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="vibe-toggle"
                  checked={vibrationEnabled}
                  onChange={(e) => {
                    setVibrationEnabled(e.target.checked);
                    addLog('INFO', `Haptic feedback diagnostics: ${e.target.checked ? 'ENABLED' : 'DISABLED'}`);
                  }}
                  className={cn(
                    "rounded cursor-pointer focus:ring-0",
                    isDarkMode 
                      ? "bg-[#121212] border-white/10 text-[#FF6B00]" 
                      : "bg-white border-zinc-300 text-orange-600 focus:ring-orange-500"
                  )}
                />
                <label htmlFor="vibe-toggle" className="cursor-pointer">HAPTIC BUZZ ON CONNECT</label>
              </div>

              <button 
                onClick={() => {
                  addLog('WARN', 'Active security tunnel reset sequence requested.');
                  startHandshake(true);
                }}
                className="px-2 py-0.5 rounded bg-[#FF6B00]/10 text-[#FF6B00] hover:bg-[#FF6B00]/20 border border-[#FF6B00]/20 transition-all font-bold text-[9px] uppercase tracking-wider cursor-pointer"
              >
                RE-KEY TUNNEL
              </button>
            </div>
          </div>

          {/* Console Log Feed Container */}
          <div className={cn(
            "flex-1 flex flex-col min-h-0 p-4 font-mono text-[10px] space-y-2 transition-colors duration-300",
            isDarkMode ? "bg-black/90" : "bg-zinc-950"
          )}>
            <div className="flex items-center justify-between text-white/40 pb-2 border-b border-white/5 shrink-0 uppercase tracking-widest text-[9px]">
              <div className="flex items-center space-x-1">
                <Sliders size={11} className="text-[#FFB300]" />
                <span>Real-time Secure Operations Log</span>
              </div>
              <button 
                onClick={() => setLogs([])}
                title="Clear Log History"
                className="hover:text-white transition-colors cursor-pointer"
              >
                <Trash2 size={11} />
              </button>
            </div>

            {/* Log Stream Content */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {logs.length === 0 ? (
                <div className="text-white/20 italic text-center py-8">Log history cleared. Secure channel operational.</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="flex items-start space-x-2 leading-relaxed">
                    <span className="text-white/30 shrink-0">[{log.time}]</span>
                    <span className={cn(
                      "shrink-0 font-bold uppercase",
                      log.level === 'SUCCESS' && "text-[#FFB300]",
                      log.level === 'SECURE' && "text-[#FF6B00]",
                      log.level === 'WARN' && "text-amber-500",
                      log.level === 'ERROR' && "text-red-500",
                      log.level === 'INFO' && "text-white/60"
                    )}>
                      [{log.level}]
                    </span>
                    <span className="text-white/80 break-words">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
