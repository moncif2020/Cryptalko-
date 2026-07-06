import { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, X, Zap, Trash2, EyeOff, Lock, FileText, CheckCircle, 
  Cpu, Info, Coins, Sun, Moon, Bluetooth, RefreshCw, Menu, ChevronDown
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface PrivacyDropdownProps {
  isDarkMode: boolean;
  setIsDarkMode: (mode: boolean) => void;
  isTranslationEnabled: boolean;
  setIsTranslationEnabled: (enabled: boolean) => void;
  targetLanguage: string;
  setTargetLanguage: (lang: string) => void;
  isBluetoothMode: boolean;
  handleToggleBluetooth: () => Promise<void>;
  
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
  
  // Add log trigger
  addLog: (type: 'INFO' | 'SUCCESS' | 'SECURE' | 'ERROR' | 'WARN', message: string) => void;
}

export const PrivacyDropdown = ({
  isDarkMode,
  setIsDarkMode,
  isTranslationEnabled,
  setIsTranslationEnabled,
  targetLanguage,
  setTargetLanguage,
  isBluetoothMode,
  handleToggleBluetooth,
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
}: PrivacyDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPro, setIsPro] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeStep, setUpgradeStep] = useState('');
  const [copiedAddress, setCopiedAddress] = useState<'XMR' | 'BTC' | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Reset copy notifications
  useEffect(() => {
    if (copiedAddress) {
      const timer = setTimeout(() => setCopiedAddress(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [copiedAddress]);

  const handleUpgrade = () => {
    if (isPro) return;
    setIsUpgrading(true);
    addLog('INFO', 'بروتوكول الترقية // Starting simulated cryptographic upgrade sequence...');
    
    const steps = [
      'ربط القناة اللامركزية // CONNECTING DECENTRALIZED MEMPOOL...',
      'توليد مفتاح المعمية التكتيكي // GENERATING MILITARY-GRADE AES-GCM SESSION KEY...',
      'التحقق من عقد السيادة // VALIDATING SOVEREIGN STAKE CONTRACT...',
      'تنشيط الزر السحري // PARSING THE MAGIC BUTTON INJECTOR...',
      'الترقية نشطة بالكامل // UPGRADE PACKAGES SUCCESSFULLY DEPLOYED!'
    ];

    let currentStep = 0;
    setUpgradeStep(steps[currentStep]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setUpgradeStep(steps[currentStep]);
        addLog('SECURE', `Magic Button System: ${steps[currentStep]}`);
      } else {
        clearInterval(interval);
        setIsPro(true);
        setIsUpgrading(false);
        addLog('SUCCESS', 'تم تنشيط الميزات المطلقة // THE MAGIC BUTTON SECURE EXTRACTIONS FULLY UNLOCKED.');
      }
    }, 1200);
  };

  const simulateCryptoPayment = (coin: 'XMR' | 'BTC') => {
    setCopiedAddress(coin);
    const mockAddress = coin === 'XMR' 
      ? '44AFF3xq5XS75Cg4Y...monero_sovereign_enclave_node' 
      : 'bc1qxy2kg3ut...bitcoin_lightning_survival_bridge';
      
    navigator.clipboard.writeText(mockAddress);
    addLog('SECURE', `ممر الدفع اللامركزي نشط // Decentralized ${coin} payment gateway linked! Mock wallet address copied to clipboard.`);
    addLog('SUCCESS', `تم نسخ عنوان محفظة ${coin} // Address copied: ${mockAddress.substring(0, 24)}...`);
  };

  return (
    <div ref={containerRef} className="relative select-none">
      {/* Menu Trigger Button - absolute top far left */}
      <button
        type="button"
        id="privacy-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "px-3 py-2 rounded-xl border transition-all flex items-center gap-2 uppercase tracking-wider font-black text-[10px] cursor-pointer h-10 shadow-[0_0_10px_rgba(255,107,0,0.15)]",
          isOpen
            ? "bg-[#FF6B00] text-black border-[#FF6B00] hover:bg-orange-500 shadow-[0_0_15px_rgba(255,107,0,0.4)]"
            : (isDarkMode 
                ? "bg-[#161618] border-[#FF6B00]/30 text-[#FF6B00] hover:bg-[#FF6B00]/5 hover:border-[#FF6B00] hover:shadow-[0_0_15px_rgba(255,107,0,0.3)]" 
                : "bg-white border-[#FF6B00]/40 text-[#FF6B00] hover:bg-orange-50/50 hover:border-[#FF6B00] hover:shadow-[0_0_12px_rgba(255,107,0,0.25)]")
        )}
        title="قائمة الخصوصية والتحكم التكتيكي"
      >
        <Menu size={14} className={cn("transition-transform duration-300 text-current", isOpen && "rotate-90")} />
        <ShieldAlert size={12} className={cn("text-current", isOpen && "animate-pulse")} />
        <span>PRIVACY MENU // قائمة الخصوصية</span>
        <ChevronDown size={11} className={cn("transition-transform duration-200 text-current", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "absolute left-0 mt-2.5 w-[360px] md:w-[420px] rounded-2xl border shadow-2xl overflow-hidden flex flex-col z-50 max-h-[80vh] transition-colors duration-300",
              isDarkMode 
                ? "bg-[#121214] border-white/10 text-white" 
                : "bg-white border-zinc-200 text-zinc-900"
            )}
            style={{ direction: 'rtl' }}
          >
            {/* Header section matching original Enclave */}
            <div className={cn(
              "px-5 py-3.5 border-b flex items-center justify-between shrink-0 relative z-10",
              isDarkMode ? "border-white/5 bg-black/40" : "border-zinc-100 bg-zinc-50"
            )}>
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-9 h-9 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center border border-[#FF6B00]/20 text-[#FF6B00] shadow-[0_0_12px_rgba(255,107,0,0.15)]">
                  <ShieldAlert size={18} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="font-sans font-extrabold text-[13px] tracking-wide leading-tight uppercase flex items-center gap-1.5 justify-start">
                    <span>حجرة الخصوصية // ENCLAVE</span>
                    <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-mono uppercase tracking-widest animate-pulse">
                      Active
                    </span>
                  </h2>
                  <p className="font-mono text-[8px] tracking-[0.15em] text-[#FF6B00] uppercase font-bold text-right">
                    COMMAND & CONTROL // لوحة التحكم
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className={cn(
                  "p-1.5 rounded-lg transition-all hover:bg-white/5 cursor-pointer",
                  isDarkMode ? "text-white/40 hover:text-white" : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100"
                )}
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable controls list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 relative z-10 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              
              {/* Quick Sync State Indicators */}
              <div className={cn(
                "p-2.5 rounded-xl border flex flex-wrap gap-2 justify-between items-center text-[8.5px] font-mono font-bold uppercase",
                isDarkMode ? "bg-black/20 border-white/5" : "bg-zinc-50 border-zinc-100"
              )}>
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500">مزامنة الحالة:</span>
                </div>
                
                {/* Day / Night toggle */}
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={cn(
                    "px-2 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer",
                    isDarkMode ? "bg-white/5 border-white/10 text-amber-400" : "bg-white border-zinc-200 text-amber-600"
                  )}
                >
                  {isDarkMode ? <Sun size={9} /> : <Moon size={9} />}
                  <span>{isDarkMode ? "JOUR" : "NUIT"}</span>
                </button>

                {/* Translation toggle */}
                <button
                  onClick={() => setIsTranslationEnabled(!isTranslationEnabled)}
                  className={cn(
                    "px-2 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer",
                    isTranslationEnabled ? "bg-[#FFB300]/10 border-[#FFB300]/20 text-[#FFB300]" : "bg-white border-zinc-200 text-zinc-500"
                  )}
                >
                  <Cpu size={9} />
                  <span>الترجمة: {isTranslationEnabled ? "ON" : "OFF"}</span>
                </button>

                {/* Bluetooth toggle */}
                <button
                  onClick={handleToggleBluetooth}
                  className={cn(
                    "px-2 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer",
                    isBluetoothMode ? "bg-amber-500 border-amber-600 text-black" : "bg-white border-zinc-200 text-amber-600"
                  )}
                >
                  <Bluetooth size={9} />
                  <span>{isBluetoothMode ? "MESH ON" : "MESH OFF"}</span>
                </button>
              </div>

              {/* Unlock Magic Button Upgrade section */}
              <div className={cn(
                "p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 relative overflow-hidden",
                isPro 
                  ? (isDarkMode ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50 border-emerald-200")
                  : (isDarkMode ? "bg-[#2c1a0c]/60 border-[#FF6B00]/20 text-white" : "bg-orange-50/50 border-orange-200 text-zinc-900")
              )}>
                <div className="flex items-start space-x-2.5 space-x-reverse z-10 text-right">
                  <div className={cn(
                    "w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-black shadow-lg",
                    isPro ? "bg-emerald-500 animate-pulse" : "bg-[#FF6B00] animate-bounce"
                  )}>
                    <Zap size={18} className={isPro ? "" : "fill-black"} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className={cn(
                      "font-bold text-[11.5px] leading-snug",
                      isPro ? "text-emerald-400" : (isDarkMode ? "text-orange-400" : "text-orange-800")
                    )}>
                      {isPro ? "تم تنشيط الزر السحري!" : "تنشيط \"الزر السحري\""}
                    </h3>
                    <p className={cn(
                      "text-[9px] leading-relaxed",
                      isDarkMode ? "text-white/60" : "text-zinc-500"
                    )}>
                      {isPro 
                        ? "أصبحت الاستخراجات السيادية والمعايير التكتيكية نشطة تماماً."
                        : "افتح بروتوكولات الحماية المتقدمة باستخدام عملات معماة مجهولة."
                      }
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleUpgrade}
                  disabled={isUpgrading || isPro}
                  className={cn(
                    "px-3 py-1 rounded-lg font-mono text-[9px] font-black uppercase tracking-wider transition-all z-10 whitespace-nowrap cursor-pointer shrink-0 border",
                    isPro 
                      ? "bg-transparent border-emerald-500/30 text-emerald-400 cursor-default"
                      : isUpgrading
                      ? "bg-zinc-800 border-zinc-700 text-white animate-pulse"
                      : "bg-[#FF6B00] border-[#FF6B00] text-black hover:bg-orange-500 shadow-md shadow-orange-500/20"
                  )}
                >
                  {isPro ? "نشط" : isUpgrading ? "جاري..." : "ترقية"}
                </button>

                {!isPro && (
                  <div className="absolute inset-0 bg-gradient-to-l from-orange-500/5 to-transparent pointer-events-none" />
                )}
              </div>

              {/* Upgrading Status Bar */}
              <AnimatePresence>
                {isUpgrading && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className={cn(
                      "p-2.5 rounded-xl border font-mono text-[8px] flex items-center space-x-2 space-x-reverse justify-start",
                      isDarkMode ? "bg-black border-white/5 text-orange-400" : "bg-orange-50 border-orange-100 text-orange-800"
                    )}>
                      <RefreshCw size={10} className="animate-spin text-orange-500 shrink-0" />
                      <span className="uppercase tracking-widest font-black animate-pulse">{upgradeStep}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 6 Toggles */}
              <div className="space-y-2">
                
                {/* 1. Auto-Delete Messages */}
                <div className={cn(
                  "p-2.5 rounded-xl border flex items-center justify-between transition-all",
                  autoDelete 
                    ? (isDarkMode ? "bg-[#FF6B00]/5 border-[#FF6B00]/20" : "bg-orange-50 border-orange-200")
                    : (isDarkMode ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-white border-zinc-200 hover:border-zinc-300")
                )}>
                  <div className="flex items-start space-x-2.5 space-x-reverse text-right">
                    <div className={cn(
                      "w-8.5 h-8.5 rounded-xl shrink-0 flex items-center justify-center border transition-all",
                      isDarkMode ? "bg-white/5 border-white/10 text-white/50" : "bg-zinc-100 border-zinc-200 text-zinc-600"
                    )}>
                      <Trash2 size={14} />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-[11px] flex items-center gap-1 justify-start">
                        <span>حذف تلقائي للمحادثات</span>
                        <Zap size={9} className="text-[#FF6B00] fill-[#FF6B00] shrink-0" />
                      </h4>
                      <p className={cn("text-[9px]", isDarkMode ? "text-white/45" : "text-zinc-500")}>
                        تختفي الرسائل من الشاشة تلقائياً بعد 60 ثانية.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setAutoDelete(!autoDelete);
                      addLog('INFO', `Auto-delete parameter recalibrated: ${!autoDelete ? 'ENABLED (60s loop)' : 'DISABLED'}`);
                    }}
                    className={cn(
                      "w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 relative",
                      autoDelete ? "bg-[#FF6B00]" : (isDarkMode ? "bg-zinc-800" : "bg-zinc-300")
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 absolute top-0.5",
                      autoDelete ? "left-0.5" : "left-4.5"
                    )} />
                  </button>
                </div>

                {/* 2. Visual Shield */}
                <div className={cn(
                  "p-2.5 rounded-xl border flex items-center justify-between transition-all",
                  visualShield 
                    ? (isDarkMode ? "bg-[#FF6B00]/5 border-[#FF6B00]/20" : "bg-orange-50 border-orange-200")
                    : (isDarkMode ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-white border-zinc-200 hover:border-zinc-300")
                )}>
                  <div className="flex items-start space-x-2.5 space-x-reverse text-right">
                    <div className={cn(
                      "w-8.5 h-8.5 rounded-xl shrink-0 flex items-center justify-center border transition-all",
                      isDarkMode ? "bg-white/5 border-white/10 text-white/50" : "bg-zinc-100 border-zinc-200 text-zinc-600"
                    )}>
                      <EyeOff size={14} />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-[11px] flex items-center gap-1 justify-start">
                        <span>شاشة الحماية المرئية</span>
                        <Zap size={9} className="text-[#FF6B00] fill-[#FF6B00] shrink-0" />
                      </h4>
                      <p className={cn("text-[9px]", isDarkMode ? "text-white/45" : "text-zinc-500")}>
                        تعتيم المحتوى فوراً عند مغادرة التبويب أو تقليص النافذة.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setVisualShield(!visualShield);
                      addLog('SECURE', `Visual Tab obscuring shield: ${!visualShield ? 'ACTIVE' : 'INACTIVE'}`);
                    }}
                    className={cn(
                      "w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 relative",
                      visualShield ? "bg-[#FF6B00]" : (isDarkMode ? "bg-zinc-800" : "bg-zinc-300")
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 absolute top-0.5",
                      visualShield ? "left-0.5" : "left-4.5"
                    )} />
                  </button>
                </div>

                {/* 3. Block Copy/Paste */}
                <div className={cn(
                  "p-2.5 rounded-xl border flex items-center justify-between transition-all",
                  blockCopyPaste 
                    ? (isDarkMode ? "bg-[#FF6B00]/5 border-[#FF6B00]/20" : "bg-orange-50 border-orange-200")
                    : (isDarkMode ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-white border-zinc-200 hover:border-zinc-300")
                )}>
                  <div className="flex items-start space-x-2.5 space-x-reverse text-right">
                    <div className={cn(
                      "w-8.5 h-8.5 rounded-xl shrink-0 flex items-center justify-center border transition-all",
                      isDarkMode ? "bg-white/5 border-white/10 text-white/50" : "bg-zinc-100 border-zinc-200 text-zinc-600"
                    )}>
                      <Lock size={14} />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-[11px] flex items-center gap-1 justify-start">
                        <span>حظر النسخ واللصق</span>
                        <Zap size={9} className="text-[#FF6B00] fill-[#FF6B00] shrink-0" />
                      </h4>
                      <p className={cn("text-[9px]", isDarkMode ? "text-white/45" : "text-zinc-500")}>
                        منع تحديد النصوص تماماً وحظر القوائم الجانبية للحافظة.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setBlockCopyPaste(!blockCopyPaste);
                      addLog('WARN', `E2EE protection: Right click and clipboard interactions are now ${!blockCopyPaste ? 'BLOCKED' : 'UNBLOCKED'}`);
                    }}
                    className={cn(
                      "w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 relative",
                      blockCopyPaste ? "bg-[#FF6B00]" : (isDarkMode ? "bg-zinc-800" : "bg-zinc-300")
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 absolute top-0.5",
                      blockCopyPaste ? "left-0.5" : "left-4.5"
                    )} />
                  </button>
                </div>

                {/* 4. Metadata Cloaking */}
                <div className={cn(
                  "p-2.5 rounded-xl border flex items-center justify-between transition-all",
                  metadataCloaking 
                    ? (isDarkMode ? "bg-[#FF6B00]/5 border-[#FF6B00]/20" : "bg-orange-50 border-orange-200")
                    : (isDarkMode ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-white border-zinc-200 hover:border-zinc-300")
                )}>
                  <div className="flex items-start space-x-2.5 space-x-reverse text-right">
                    <div className={cn(
                      "w-8.5 h-8.5 rounded-xl shrink-0 flex items-center justify-center border transition-all",
                      isDarkMode ? "bg-white/5 border-white/10 text-white/50" : "bg-zinc-100 border-zinc-200 text-zinc-600"
                    )}>
                      <FileText size={14} />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-[11px] flex items-center gap-1 justify-start">
                        <span>تمويه الملفات والبيانات</span>
                        <Zap size={9} className="text-[#FF6B00] fill-[#FF6B00] shrink-0" />
                      </h4>
                      <p className={cn("text-[9px]", isDarkMode ? "text-white/45" : "text-zinc-500")}>
                        تشهير الأسماء وتجريد بيانات EXIF والجغرافيّة من الصور.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMetadataCloaking(!metadataCloaking);
                      addLog('SECURE', `Filename & File-system Metadata Obfuscator: ${!metadataCloaking ? 'ACTIVE' : 'INACTIVE'}`);
                    }}
                    className={cn(
                      "w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 relative",
                      metadataCloaking ? "bg-[#FF6B00]" : (isDarkMode ? "bg-zinc-800" : "bg-zinc-300")
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 absolute top-0.5",
                      metadataCloaking ? "left-0.5" : "left-4.5"
                    )} />
                  </button>
                </div>

                {/* 5. Read Receipts */}
                <div className={cn(
                  "p-2.5 rounded-xl border flex items-center justify-between transition-all",
                  readReceipts 
                    ? (isDarkMode ? "bg-[#FF6B00]/5 border-[#FF6B00]/20" : "bg-orange-50 border-orange-200")
                    : (isDarkMode ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-white border-zinc-200 hover:border-zinc-300")
                )}>
                  <div className="flex items-start space-x-2.5 space-x-reverse text-right">
                    <div className={cn(
                      "w-8.5 h-8.5 rounded-xl shrink-0 flex items-center justify-center border transition-all",
                      isDarkMode ? "bg-white/5 border-white/10 text-white/50" : "bg-zinc-100 border-zinc-200 text-zinc-600"
                    )}>
                      <CheckCircle size={14} />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-[11px] flex items-center gap-1 justify-start">
                        <span>إشعارات القراءة</span>
                        <Zap size={9} className="text-[#FF6B00] fill-[#FF6B00] shrink-0" />
                      </h4>
                      <p className={cn("text-[9px]", isDarkMode ? "text-white/45" : "text-zinc-500")}>
                        عرض مؤشرات القراءة (✓✓) فور قراءة الطرف الآخر للمحادثة.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setReadReceipts(!readReceipts);
                      addLog('INFO', `Read receipts telemetry transmission: ${!readReceipts ? 'BROADCASTING' : 'DISABLED'}`);
                    }}
                    className={cn(
                      "w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 relative",
                      readReceipts ? "bg-[#FF6B00]" : (isDarkMode ? "bg-zinc-800" : "bg-zinc-300")
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 absolute top-0.5",
                      readReceipts ? "left-0.5" : "left-4.5"
                    )} />
                  </button>
                </div>

                {/* 6. Absolute Privacy */}
                <div className={cn(
                  "p-2.5 rounded-xl border flex items-center justify-between transition-all",
                  absolutePrivacy 
                    ? (isDarkMode ? "bg-[#FF6B00]/5 border-[#FF6B00]/20" : "bg-orange-50 border-orange-200")
                    : (isDarkMode ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-white border-zinc-200 hover:border-zinc-300")
                )}>
                  <div className="flex items-start space-x-2.5 space-x-reverse text-right">
                    <div className={cn(
                      "w-8.5 h-8.5 rounded-xl shrink-0 flex items-center justify-center border transition-all",
                      isDarkMode ? "bg-white/5 border-white/10 text-white/50" : "bg-zinc-100 border-zinc-200 text-zinc-600"
                    )}>
                      <Cpu size={14} />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-[11px] flex items-center gap-1 justify-start">
                        <span>السرّية المطلقة</span>
                        <Zap size={9} className="text-[#FF6B00] fill-[#FF6B00] shrink-0" />
                      </h4>
                      <p className={cn("text-[9px]", isDarkMode ? "text-white/45" : "text-zinc-500")}>
                        تعطيل محركات الذكاء الاصطناعي كليّاً وفك الارتباط السحابي.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setAbsolutePrivacy(!absolutePrivacy);
                      if (!absolutePrivacy) {
                        setIsTranslationEnabled(false);
                        addLog('WARN', 'الأمن المطبق // Absolute Privacy active. AI engines decoupled. Real-time translation severed.');
                      } else {
                        addLog('INFO', 'AI services restabilized for neural matching.');
                      }
                    }}
                    className={cn(
                      "w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 relative",
                      absolutePrivacy ? "bg-[#FF6B00]" : (isDarkMode ? "bg-zinc-800" : "bg-zinc-300")
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 absolute top-0.5",
                      absolutePrivacy ? "left-0.5" : "left-4.5"
                    )} />
                  </button>
                </div>
              </div>

              {/* SOVEREIGN ECONOMY */}
              <div className="space-y-2 pt-2 text-right">
                <h4 className="font-mono text-[9px] tracking-[0.15em] text-zinc-500 uppercase font-extrabold flex items-center gap-1.5 justify-start">
                  <Coins size={10} className="text-[#FF6B00]" />
                  <span>اقتصاد السيادة // SOVEREIGN ECONOMY</span>
                </h4>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Monero option */}
                  <button
                    onClick={() => simulateCryptoPayment('XMR')}
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-center space-y-0.5 group",
                      copiedAddress === 'XMR'
                        ? (isDarkMode ? "bg-[#FF6B00]/10 border-[#FF6B00]/40 text-white" : "bg-orange-50 border-orange-300 text-zinc-950")
                        : (isDarkMode ? "bg-[#1d1d21] border-white/5 hover:border-white/10" : "bg-zinc-50 border-zinc-200 hover:border-zinc-300")
                    )}
                  >
                    <span className={cn(
                      "font-mono text-[8px] tracking-widest uppercase transition-colors",
                      isDarkMode ? "text-white/40 group-hover:text-white/70" : "text-zinc-400 group-hover:text-zinc-600"
                    )}>
                      MONERO (XMR)
                    </span>
                    <span className="font-bold text-[10px] text-[#FF6B00] tracking-wide">
                      {copiedAddress === 'XMR' ? 'تم النسخ!' : 'Anonymous'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-500/[0.02] to-transparent pointer-events-none" />
                  </button>

                  {/* Bitcoin option */}
                  <button
                    onClick={() => simulateCryptoPayment('BTC')}
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-center space-y-0.5 group",
                      copiedAddress === 'BTC'
                        ? (isDarkMode ? "bg-[#FF6B00]/10 border-[#FF6B00]/40 text-white" : "bg-orange-50 border-orange-300 text-zinc-950")
                        : (isDarkMode ? "bg-[#1d1d21] border-white/5 hover:border-white/10" : "bg-zinc-50 border-zinc-200 hover:border-zinc-300")
                    )}
                  >
                    <span className={cn(
                      "font-mono text-[8px] tracking-widest uppercase transition-colors",
                      isDarkMode ? "text-white/40 group-hover:text-white/70" : "text-zinc-400 group-hover:text-zinc-600"
                    )}>
                      BITCOIN (BTC)
                    </span>
                    <span className="font-bold text-[10px] text-[#FF6B00] tracking-wide">
                      {copiedAddress === 'BTC' ? 'تم النسخ!' : 'Lightning'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-500/[0.02] to-transparent pointer-events-none" />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer info block */}
            <div className={cn(
              "px-5 py-2.5 border-t text-center flex items-center justify-center space-x-1.5 shrink-0 relative z-10 font-mono text-[8px] font-bold tracking-widest",
              isDarkMode ? "border-white/5 bg-black/60 text-white/30" : "border-zinc-100 bg-zinc-50 text-zinc-400"
            )}>
              <Info size={10} className={isDarkMode ? "text-white/20" : "text-zinc-400"} />
              <span>المعلومات تحفظ مؤقتاً في الرام فقط // RAM ONLY</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
