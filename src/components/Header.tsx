import { useState, useEffect, useRef } from 'react';
import { Cpu, Bluetooth, Sun, Moon, ChevronDown, Check, Globe } from 'lucide-react';
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
            "px-2.5 py-1.5 rounded-lg border transition-all flex items-center space-x-1.5 uppercase tracking-wider font-bold text-[9px] cursor-pointer h-9",
            isDarkMode 
              ? "bg-white/5 border-white/10 text-amber-400 hover:bg-white/10 hover:border-amber-400/40" 
              : "bg-zinc-100 border-zinc-200 text-amber-600 hover:bg-zinc-200 hover:border-amber-600/40"
          )}
          title={isDarkMode ? "الوضع النهاري" : "الوضع الليلي"}
        >
          {isDarkMode ? <Sun size={11} className="text-amber-400 animate-spin [animation-duration:8s]" /> : <Moon size={11} className="text-amber-600" />}
          <span>{isDarkMode ? 'الوضع النهاري (Jour)' : 'الوضع الليلي (Nuit)'}</span>
        </button>

        {/* AI Translation Toggle Button */}
        <button
          type="button"
          onClick={() => setIsTranslationEnabled(!isTranslationEnabled)}
          className={cn(
            "px-2.5 py-1.5 rounded-lg border transition-all flex items-center space-x-1.5 uppercase tracking-wider font-bold text-[9px] cursor-pointer h-9",
            isTranslationEnabled 
              ? (isDarkMode ? "bg-[#FFB300]/10 border-[#FFB300]/40 text-[#FFB300]" : "bg-amber-100 border-amber-300 text-amber-800")
              : (isDarkMode ? "bg-white/5 border-white/10 text-white/40 hover:text-white" : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900")
          )}
        >
          <Cpu size={11} className={cn(isTranslationEnabled && "animate-spin [animation-duration:4s]")} />
          <span>الترجمة الفورية: {isTranslationEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* Target Language Custom Dropdown Selector */}
        <div ref={dropdownRef} className="relative select-none">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              "flex items-center space-x-2 border rounded-lg px-3 h-9 transition-all cursor-pointer font-mono text-[9px] font-bold uppercase tracking-wider",
              isDarkMode 
                ? "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-amber-500/30" 
                : "bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200 hover:border-amber-600/30"
            )}
          >
            <Globe size={11} className={isDarkMode ? "text-amber-400 animate-pulse" : "text-amber-600 animate-pulse"} />
            <span className={cn(isDarkMode ? "text-white/80" : "text-zinc-700")}>
              {currentLanguageObj.name}
            </span>
            <ChevronDown size={10} className={cn("transition-transform duration-200", isDropdownOpen && "rotate-180")} />
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
                          ? (isDarkMode ? "bg-[#FFB300]/10 text-[#FFB300] font-bold" : "bg-amber-50 text-amber-800 font-bold")
                          : (isDarkMode ? "hover:bg-white/5 text-white/70 hover:text-white" : "hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900")
                      )}
                    >
                      <span>{lang.name}</span>
                      {isSelected && <Check size={11} className={isDarkMode ? "text-[#FFB300]" : "text-amber-600"} />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bluetooth Activation Button */}
        <button
          type="button"
          onClick={handleToggleBluetooth}
          className={cn(
            "px-2.5 py-1.5 rounded-lg border transition-all flex items-center space-x-1.5 uppercase tracking-wider font-black text-[9px] cursor-pointer shadow-sm h-9",
            isBluetoothMode 
              ? "bg-amber-500 text-black border-amber-600 hover:bg-amber-400" 
              : (isDarkMode ? "bg-[#121212] border-white/10 text-[#FFB300] hover:border-[#FFB300]/40" : "bg-white border-zinc-200 text-amber-600 hover:border-amber-400")
          )}
        >
          <Bluetooth size={11} className={cn(isBluetoothMode && "animate-bounce")} />
          <span>{isBluetoothMode ? 'DISABLE MESH' : 'ACTIVATE BLE MESH'}</span>
        </button>

        {!isOnline && (
          <div className={cn(
            "flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-[9px] font-mono animate-pulse uppercase tracking-widest font-semibold h-9",
            isDarkMode ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-amber-50 border-amber-200 text-amber-700"
          )}>
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
            <span>OFFLINE MODE // دون اتصال</span>
          </div>
        )}
      </div>
    </header>
  );
};
