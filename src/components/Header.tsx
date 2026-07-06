import { useState, useEffect, useRef } from 'react';
import { Cpu, Bluetooth, Sun, Moon, ChevronDown, Check, Globe, Terminal } from 'lucide-react';
import { GLOBAL_LANGUAGES } from '../constants/languages';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import { PrivacyDropdown } from './PrivacyDropdown';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface HeaderProps {
  status: 'idle' | 'searching' | 'locked';
  isTranslationEnabled: boolean;
  setIsTranslationEnabled: (enabled: boolean) => void;
  targetLanguage: string;
  setTargetLanguage: (lang: string) => void;
  isBluetoothMode: boolean;
  handleToggleBluetooth: () => Promise<void>;
  isOnline: boolean;
  isDarkMode: boolean;
  setIsDarkMode: (mode: boolean) => void;
  
  // Privacy States
  autoDelete: boolean;
  setAutoDelete: (val: boolean) => void;
  visualShield: boolean;
  setVisualShield: (val: boolean) => void;
  blockCopyPaste: boolean;
  setBlockCopyPaste: (val: boolean) => void;
  metadataCloaking: boolean;
  setMetadataCloaking: (val: boolean) => void;
  readReceipts: boolean;
  setReadReceipts: (val: boolean) => void;
  absolutePrivacy: boolean;
  setAbsolutePrivacy: (val: boolean) => void;
  addLog: (type: 'INFO' | 'SUCCESS' | 'SECURE' | 'ERROR' | 'WARN', message: string) => void;
  showTerminal: boolean;
  setShowTerminal: (val: boolean) => void;
}

export const Header = ({
  status,
  isTranslationEnabled,
  setIsTranslationEnabled,
  targetLanguage,
  setTargetLanguage,
  isBluetoothMode,
  handleToggleBluetooth,
  isOnline,
  isDarkMode,
  setIsDarkMode,
  autoDelete,
  setAutoDelete,
  visualShield,
  setVisualShield,
  blockCopyPaste,
  setBlockCopyPaste,
  metadataCloaking,
  setMetadataCloaking,
  readReceipts,
  setReadReceipts,
  absolutePrivacy,
  setAbsolutePrivacy,
  addLog,
  showTerminal,
  setShowTerminal,
}: HeaderProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const currentLanguageObj = GLOBAL_LANGUAGES.find(lang => lang.englishName === targetLanguage) || GLOBAL_LANGUAGES[2]; // fallback to English

  return (
    <header className={cn(
      "relative z-30 px-6 py-4 border-b flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300",
      isDarkMode 
        ? "border-white/5 bg-[#121212]/80 backdrop-blur-md text-white" 
        : "border-zinc-200 bg-white/90 backdrop-blur-md text-zinc-900 shadow-sm"
    )}>
      <div className="flex items-center space-x-3 w-full md:w-auto">
        {/* Top-Left Privacy Dropdown Menu Button */}
        <PrivacyDropdown 
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          isTranslationEnabled={isTranslationEnabled}
          setIsTranslationEnabled={setIsTranslationEnabled}
          targetLanguage={targetLanguage}
          setTargetLanguage={setTargetLanguage}
          isBluetoothMode={isBluetoothMode}
          handleToggleBluetooth={handleToggleBluetooth}
          autoDelete={autoDelete}
          setAutoDelete={setAutoDelete}
          visualShield={visualShield}
          setVisualShield={setVisualShield}
          blockCopyPaste={blockCopyPaste}
          setBlockCopyPaste={setBlockCopyPaste}
          metadataCloaking={metadataCloaking}
          setMetadataCloaking={setMetadataCloaking}
          readReceipts={readReceipts}
          setReadReceipts={setReadReceipts}
          absolutePrivacy={absolutePrivacy}
          setAbsolutePrivacy={setAbsolutePrivacy}
          addLog={addLog}
        />

        <div className={cn(
          "w-2.5 h-2.5 rounded-full transition-all duration-1000 animate-pulse",
          status === 'idle' 
            ? "bg-zinc-500 shadow-[0_0_10px_rgba(161,161,170,0.3)]" 
            : status === 'searching' 
            ? "bg-[#FF6B00] shadow-[0_0_10px_#FF6B00]" 
            : "bg-[#FFB300] shadow-[0_0_10px_#FFB300]"
        )} />
        <div>
          <span className={cn(
            "text-xs font-mono tracking-widest uppercase block",
            isDarkMode ? "text-white/40" : "text-zinc-500"
          )}>CRYPTALKO BRIDGE</span>
          <span className="font-mono text-xs font-bold uppercase tracking-widest" style={{ color: status === 'idle' ? (isDarkMode ? '#A1A1AA' : '#71717A') : status === 'searching' ? '#FF6B00' : '#FFB300' }}>
            {status === 'idle' ? 'STANDBY_OFFLINE' : status === 'searching' ? 'P2P_HANDSHAKE_BROADCAST' : 'TUNNEL_ONLINE_SECURED'}
          </span>
        </div>
      </div>

      {/* Quick Action Controls & Merged Controls */}
      <div className="flex flex-wrap items-center gap-2.5 justify-end w-full md:w-auto">
        {/* Light / Dark Mode Toggle Button */}
        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={cn(
            "px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 uppercase tracking-wider font-bold text-[9px] cursor-pointer h-9 shadow-[0_0_10px_rgba(255,107,0,0.15)]",
            isDarkMode 
              ? "bg-[#161618] border-[#FF6B00]/30 text-[#FF6B00] hover:bg-[#FF6B00]/5 hover:border-[#FF6B00] hover:shadow-[0_0_15px_rgba(255,107,0,0.3)]" 
              : "bg-white border-[#FF6B00]/40 text-[#FF6B00] hover:bg-orange-50/50 hover:border-[#FF6B00] hover:shadow-[0_0_12px_rgba(255,107,0,0.25)]"
          )}
          title={isDarkMode ? "الوضع النهاري" : "الوضع الليلي"}
        >
          {isDarkMode ? (
            <Sun size={11} className="text-[#FF6B00] animate-spin [animation-duration:8s]" />
          ) : (
            <Moon size={11} className="text-[#FF6B00]" />
          )}
          <span>{isDarkMode ? 'الوضع النهاري (JOUR)' : 'الوضع الليلي (NUIT)'}</span>
        </button>

        {/* AI Translation Toggle Button */}
        <button
          type="button"
          onClick={() => setIsTranslationEnabled(!isTranslationEnabled)}
          className={cn(
            "px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 uppercase tracking-wider font-bold text-[9px] cursor-pointer h-9 shadow-[0_0_10px_rgba(255,107,0,0.15)]",
            isTranslationEnabled 
              ? (isDarkMode 
                  ? "bg-[#FF6B00]/10 border-[#FF6B00] text-[#FF6B00] shadow-[0_0_15px_rgba(255,107,0,0.4)]" 
                  : "bg-orange-50 border-[#FF6B00] text-[#FF6B00] shadow-[0_0_12px_rgba(255,107,0,0.35)]")
              : (isDarkMode 
                  ? "bg-[#161618] border-[#FF6B00]/30 text-[#FF6B00]/60 hover:text-[#FF6B00] hover:border-[#FF6B00] hover:shadow-[0_0_12px_rgba(255,107,0,0.25)]" 
                  : "bg-white border-[#FF6B00]/40 text-[#FF6B00]/60 hover:text-[#FF6B00] hover:border-[#FF6B00] hover:shadow-[0_0_12px_rgba(255,107,0,0.25)]")
          )}
        >
          <Cpu size={11} className={cn("text-[#FF6B00]", isTranslationEnabled && "animate-spin [animation-duration:4s]")} />
          <span>الترجمة الفورية: {isTranslationEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* Target Language Custom Dropdown Selector */}
        <div ref={dropdownRef} className="relative select-none">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              "flex items-center gap-1.5 border rounded-lg px-3 h-9 transition-all cursor-pointer font-mono text-[9px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(255,107,0,0.15)]",
              isDarkMode 
                ? "bg-[#161618] border-[#FF6B00]/30 text-[#FF6B00] hover:bg-[#FF6B00]/5 hover:border-[#FF6B00] hover:shadow-[0_0_15px_rgba(255,107,0,0.3)]" 
                : "bg-white border-[#FF6B00]/40 text-[#FF6B00] hover:bg-orange-50/50 hover:border-[#FF6B00] hover:shadow-[0_0_12px_rgba(255,107,0,0.25)]"
            )}
          >
            <Globe size={11} className="text-[#FF6B00] animate-pulse" />
            <span className="text-current">
              {currentLanguageObj.name}
            </span>
            <ChevronDown size={10} className={cn("transition-transform duration-200 text-[#FF6B00]", isDropdownOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className={cn(
                  "absolute right-0 mt-2 w-48 max-h-72 overflow-y-auto rounded-xl shadow-2xl border backdrop-blur-md z-50 py-1.5",
                  isDarkMode 
                    ? "bg-[#111113]/95 border-white/10 text-white scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent" 
                    : "bg-white/95 border-zinc-200 text-zinc-800 scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent"
                )}
                style={{ direction: 'rtl' }}
              >
                {GLOBAL_LANGUAGES.map((lang) => {
                  const isSelected = lang.englishName === targetLanguage;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setTargetLanguage(lang.englishName);
                        setIsDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3.5 py-2 text-[10px] font-mono transition-all text-right cursor-pointer",
                        isSelected 
                          ? (isDarkMode ? "bg-[#FF6B00]/10 text-[#FF6B00] font-bold" : "bg-orange-50 text-orange-800 font-bold")
                          : (isDarkMode ? "hover:bg-white/5 text-white/70 hover:text-white" : "hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900")
                      )}
                    >
                      <span>{lang.name}</span>
                      {isSelected && <Check size={11} className="text-[#FF6B00]" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Operations Console Toggle Button */}
        <button
          type="button"
          onClick={() => setShowTerminal(!showTerminal)}
          className={cn(
            "px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 uppercase tracking-wider font-bold text-[9px] cursor-pointer h-9 shadow-[0_0_10px_rgba(255,107,0,0.15)]",
            showTerminal 
              ? (isDarkMode 
                  ? "bg-[#FF6B00]/10 border-[#FF6B00] text-[#FF6B00] shadow-[0_0_15px_rgba(255,107,0,0.4)]" 
                  : "bg-orange-50 border-[#FF6B00] text-[#FF6B00] shadow-[0_0_12px_rgba(255,107,0,0.35)]")
              : (isDarkMode 
                  ? "bg-[#161618] border-[#FF6B00]/30 text-[#FF6B00]/60 hover:text-[#FF6B00] hover:border-[#FF6B00] hover:shadow-[0_0_12px_rgba(255,107,0,0.25)]" 
                  : "bg-white border-[#FF6B00]/40 text-[#FF6B00]/60 hover:text-[#FF6B00] hover:border-[#FF6B00] hover:shadow-[0_0_12px_rgba(255,107,0,0.25)]")
          )}
          title="سجل العمليات والتحكم التكتيكي"
        >
          <Terminal size={11} className={cn("text-[#FF6B00]", showTerminal && "animate-pulse")} />
          <span>الكونسول: {showTerminal ? 'ON' : 'OFF'}</span>
        </button>

        {/* Bluetooth Activation Button */}
        <button
          type="button"
          onClick={handleToggleBluetooth}
          className={cn(
            "px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 uppercase tracking-wider font-black text-[9px] cursor-pointer h-9 shadow-[0_0_10px_rgba(255,107,0,0.15)]",
            isBluetoothMode 
              ? "bg-[#FF6B00] text-black border-[#FF6B00] hover:bg-orange-500 shadow-[0_0_15px_rgba(255,107,0,0.4)]" 
              : (isDarkMode 
                  ? "bg-[#161618] border-[#FF6B00]/30 text-[#FF6B00] hover:bg-[#FF6B00]/5 hover:border-[#FF6B00] hover:shadow-[0_0_15px_rgba(255,107,0,0.3)]" 
                  : "bg-white border-[#FF6B00]/40 text-[#FF6B00] hover:bg-orange-50/50 hover:border-[#FF6B00] hover:shadow-[0_0_12px_rgba(255,107,0,0.25)]")
          )}
        >
          <Bluetooth size={11} className={cn("text-current", isBluetoothMode && "animate-bounce")} />
          <span>{isBluetoothMode ? 'DISABLE MESH' : 'ACTIVATE BLE MESH'}</span>
        </button>

        {!isOnline && (
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-[9px] font-mono animate-pulse uppercase tracking-widest font-semibold h-9 shadow-[0_0_10px_rgba(255,107,0,0.1)]",
            isDarkMode ? "bg-[#FF6B00]/10 border-[#FF6B00]/30 text-[#FF6B00]" : "bg-orange-50 border-[#FF6B00]/30 text-orange-700"
          )}>
            <span className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full animate-ping" />
            <span>OFFLINE MODE // دون اتصال</span>
          </div>
        )}
      </div>
    </header>
  );
};
