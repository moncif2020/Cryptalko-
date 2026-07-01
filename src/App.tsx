import { useEffect, useRef, useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, Unlock, ShieldCheck, Cpu, Image as ImageIcon, Loader2, 
  Settings, Terminal, RefreshCw, Trash2, Send, CheckCircle, ShieldAlert, KeyRound, Sliders, Play, Camera,
  Mic, Square, Paperclip, Volume2, Bluetooth, Radio, WifiOff
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenAI } from "@google/genai";
import CameraScanner from './components/CameraScanner';
import { LogEntry, ChatMessage } from './types';
import { useFirebaseBridge } from './hooks/useFirebaseBridge';
import { encryptString } from './services/crypto';
import { bluetoothMesh } from './services/bluetooth';
import ErrorBoundary from './components/ErrorBoundary';
// Modular Components
import { SecureAudioPlayer } from './components/SecureAudioPlayer';
import { NeuralMesh } from './components/NeuralMesh';
import { SecurePadlock } from './components/SecurePadlock';
import { GLOBAL_LANGUAGES } from './constants/languages';
import { Header } from './components/Header';
import { ChatPanel } from './components/ChatPanel';
import { TerminalLogs } from './components/TerminalLogs';
import { RoomControls } from './components/RoomControls';

// Custom Hooks
import { useAiTranslation } from './hooks/useAiTranslation';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useWebRtcCall } from './hooks/useWebRtcCall';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Utilities & Multimedia Helpers ---
const compressImage = (dataUrl: string, maxWidth = 400, maxHeight = 400, quality = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
  });
};

export default function App() {
  const {
    status,
    setStatus,
    showChat,
    setShowChat,
    roomId,
    setRoomId,
    role,
    setRole,
    encryptionKey,
    setEncryptionKey,
    cipherAlgorithm,
    setCipherAlgorithm,
    derivationRounds,
    setDerivationRounds,
    vibrationEnabled,
    setVibrationEnabled,
    logs,
    setLogs,
    chatMessages,
    addLog,
    createAndHostRoom,
    joinRoom,
    startHandshake,
    sendSecureMessage,
    isOnline,
    isBluetoothMode,
    setIsBluetoothMode,
    isBluetoothConnected,
    setIsBluetoothConnected,
    bluetoothDeviceName,
    setBluetoothDeviceName,
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
    exitReason,
    setExitReason,
    secondsRemaining,
    leaveAndDestroyRoom,
  } = useFirebaseBridge();

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConcept, setShowConcept] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // --- Privacy Enclave Advanced States ---
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [isBlurred, setIsBlurred] = useState<boolean>(false);

  // Tick current time for auto-delete reactive UI update
  useEffect(() => {
    if (!autoDelete) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [autoDelete]);

  // Visual Shield Tab obscuring & window blur handler
  useEffect(() => {
    if (!visualShield) {
      setIsBlurred(false);
      return;
    }
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);
    const handleVisibilityChange = () => {
      if (document.hidden) setIsBlurred(true);
      else setIsBlurred(false);
    };
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [visualShield]);

  // Block Copy/Paste clipboard security hook
  useEffect(() => {
    if (!blockCopyPaste) return;
    const preventAll = (e: Event) => {
      e.preventDefault();
      addLog('WARN', 'أمن الحافظة // Clipboard transfer attempt blocked by Enclave protocol.');
    };
    document.addEventListener('copy', preventAll);
    document.addEventListener('cut', preventAll);
    document.addEventListener('paste', preventAll);
    document.addEventListener('contextmenu', preventAll);
    document.addEventListener('selectstart', preventAll);
    return () => {
      document.removeEventListener('copy', preventAll);
      document.removeEventListener('cut', preventAll);
      document.removeEventListener('paste', preventAll);
      document.removeEventListener('contextmenu', preventAll);
      document.removeEventListener('selectstart', preventAll);
    };
  }, [blockCopyPaste, addLog]);

  // --- AI Neural Translation Custom Hook ---
  const {
    isTranslationEnabled,
    setIsTranslationEnabled,
    targetLanguage,
    setTargetLanguage,
    translations,
  } = useAiTranslation({ chatMessages, addLog });

  // Absolute Privacy AI isolation enforcement
  useEffect(() => {
    if (absolutePrivacy && isTranslationEnabled) {
      setIsTranslationEnabled(false);
      addLog('WARN', 'الأمن المطلق // AI translation forced OFF due to Absolute Privacy settings.');
    }
  }, [absolutePrivacy, isTranslationEnabled, setIsTranslationEnabled, addLog]);

  // --- Audio Recording Custom Hook ---
  const {
    isRecording,
    recordingDuration,
    startAudioRecording,
    stopAudioRecording,
  } = useAudioRecorder({ addLog, sendSecureMessage });

  // --- Secure Audio Call WebRTC Custom Hook ---
  const {
    callStatus,
    isMuted,
    callDuration,
    isSimulatedCall,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute
  } = useWebRtcCall({ roomId, role, addLog, isOnline });

  const handleQrScan = (scannedText: string) => {
    setIsScanning(false);
    if (!scannedText) return;

    addLog('INFO', `تم التقاط بيانات QR: "${scannedText}"`);

    // Parse scanned text to see if it's a URL with a room parameter or direct 6-digit code
    try {
      if (scannedText.includes('?room=') || scannedText.includes('&room=')) {
        const urlObj = new URL(scannedText);
        const code = urlObj.searchParams.get('room');
        if (code && code.length === 6) {
          addLog('SUCCESS', `تم فك تشفير رابط الغرفة والمزامنة: ${code}`);
          joinRoom(code.toUpperCase());
          return;
        }
      }
      
      const match = scannedText.match(/[?&]room=([A-Z0-9]{6})/i);
      if (match && match[1]) {
        const code = match[1];
        addLog('SUCCESS', `تم استخراج كود الغرفة: ${code}`);
        joinRoom(code.toUpperCase());
        return;
      }
    } catch (e) {
      // Ignore URL exceptions
    }

    // fallback to check if string is directly a 6-digit room code
    const cleanCode = scannedText.trim().toUpperCase();
    if (cleanCode.length === 6 && /^[A-Z0-9]{6}$/.test(cleanCode)) {
      addLog('SUCCESS', `تم العثور على رمز الغرفة: ${cleanCode}`);
      joinRoom(cleanCode);
    } else {
      addLog('ERROR', `الرمز الممسوح غير صالح: ${scannedText.slice(0, 30)}`);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const finalFileName = metadataCloaking 
      ? `cloaked_${Math.random().toString(36).substring(3, 9)}.bin` 
      : file.name;

    if (metadataCloaking) {
      addLog('SECURE', `حجب الميتا // Metadata Cloaked! Original filename "${file.name}" scrambled to "${finalFileName}". Purging all EXIF, GPS, and device attributes.`);
    } else {
      addLog('INFO', `استيراد صورة // File: ${file.name} (${Math.round(file.size / 1024)} KB)`);
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawDataUrl = event.target?.result as string;
      addLog('INFO', 'ضغط الصورة // Performing local downscaling and format compression...');
      
      const compressedDataUrl = await compressImage(rawDataUrl, 400, 400, 0.6);
      
      addLog('SUCCESS', `تم الضغط بنجاح // Target payload: ${Math.round(compressedDataUrl.length / 1024)} KB.`);
      addLog('INFO', 'تشفير الصورة // Generating cryptographic envelope...');
      
      await sendSecureMessage('', 'image', compressedDataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !roomId) return;
    const msg = inputMessage;
    setInputMessage('');
    await sendSecureMessage(msg);
  };

  const handleToggleBluetooth = async () => {
    if (isBluetoothMode) {
      setIsBluetoothMode(false);
      setIsBluetoothConnected(false);
      setBluetoothDeviceName('');
      addLog('WARN', 'تعطيل شبكة البلوتوث // BLE RF Mesh disconnected. Reverting to standard routing.');
    } else {
      setIsBluetoothMode(true);
      addLog('INFO', 'بروتوكول البلوتوث // Initializing BLE RF controller...');
      const success = await bluetoothMesh.connectRealBluetooth();
      setIsBluetoothConnected(true);
      if (success) {
        setBluetoothDeviceName('BLE_SURVIVAL_NODE_1');
        addLog('SUCCESS', 'توصيل البلوتوث // Real physical BLE transmitter locked and ready.');
      } else {
        setBluetoothDeviceName('AIR_GAP_CROSS_TAB_RF');
        addLog('SUCCESS', 'توصيل محاكي البلوتوث // Local RF Air-Gap Mesh Active (Cross-tab broadcast loop). Open this room in another tab to communicate completely offline!');
      }
    }
  };

  const generateConceptArt = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    addLog('INFO', 'Contacting generative mainframe to synthesize high-fidelity UI mockup...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: "A high-end cyber-security mobile interface for 'CryptAlko' titled 'The Fortified Digital Bridge'. Ultra-dark Charcoal Black background (#121212) with a subtle concrete texture. Central interactive QR code designed as a digital neural mesh with nodes connected by thin light lines. In the center, a bold neon orange logo (#FF6B00) featuring the text 'CryptAlko' in a heavy tech-mono font with a light stream effect inside the letters. Below the text, a massive, heavy-duty glowing orange padlock icon with a pulsing core light. Ambient orange particles floating around the QR code representing P2P peer discovery. High-contrast, cinematic lighting, futuristic encryption aesthetic, 8k resolution, sleek and professional UI/UX design, Unreal Engine 5 render style.",
            },
          ],
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          setGeneratedImage(`data:image/png;base64,${base64EncodeString}`);
          setShowConcept(true);
          addLog('SUCCESS', '8K Cinematic concept art generated and cached successfully.');
          break;
        }
      }
    } catch (error) {
      console.error("Image generation failed:", error);
      addLog('ERROR', 'Generative mainframe synthesis failed. Check API configurations.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Full URL for Device B scanning
  const getScanUrl = () => {
    if (!roomId) return '';
    return window.location.origin + window.location.pathname + "?room=" + roomId;
  };

  const filteredChatMessages = autoDelete 
    ? chatMessages.filter(msg => {
        if (msg.isSystem) return true;
        const msgCreatedAt = msg.createdAt || Date.now();
        return currentTime - msgCreatedAt < 60000;
      })
    : chatMessages;

  return (
    <div className={cn(
      "min-h-screen flex flex-col md:flex-row overflow-hidden relative font-sans transition-all duration-300",
      isDarkMode 
        ? "bg-[#121212] text-white selection:bg-[#FF6B00]/40 selection:text-white" 
        : "bg-zinc-50 text-zinc-900 selection:bg-amber-500/20 selection:text-zinc-900"
    )}>
      {/* Concrete Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-0"
        style={{
          backgroundImage: `url('https://www.transparenttextures.com/patterns/concrete-wall.png')`,
          backgroundSize: '400px'
        }}
      />

      {/* Decorative Outer Cyber-Grid Gridlines */}
      <div className={cn(
        "absolute inset-0 border pointer-events-none z-0 m-4 rounded-3xl transition-colors duration-300",
        isDarkMode ? "border-white/5" : "border-zinc-200"
      )} />
      
      {/* Dynamic Glow Accents */}
      <div className={cn(
        "absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br blur-[120px] rounded-full pointer-events-none transition-all duration-300",
        isDarkMode ? "from-[#FF6B00]/5 to-transparent" : "from-amber-500/5 to-transparent"
      )} />
      <div className={cn(
        "absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr blur-[120px] rounded-full pointer-events-none transition-all duration-300",
        isDarkMode ? "from-[#FFB300]/5 to-transparent" : "from-orange-500/5 to-transparent"
      )} />

      {/* --- Main Application Container --- */}
      <div className="flex-1 flex flex-col relative z-10 w-full">
        {/* Modern App Bar Header */}
        <Header 
          status={status}
          isTranslationEnabled={isTranslationEnabled}
          setIsTranslationEnabled={setIsTranslationEnabled}
          targetLanguage={targetLanguage}
          setTargetLanguage={setTargetLanguage}
          isBluetoothMode={isBluetoothMode}
          handleToggleBluetooth={handleToggleBluetooth}
          isOnline={isOnline}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
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

        {/* Content Body */}
        <div className="flex-1 flex flex-col justify-center items-center p-4">
          <AnimatePresence mode="wait">
            {showConcept ? (
              <ErrorBoundary fallbackTitle="عطل في توليد التصاميم // MAINFRAME GENERATION FAULT">
                <motion.div
                  key="concept"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-4xl p-4 flex flex-col items-center"
                >
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-orange-500/30 shadow-2xl shadow-orange-500/20">
                    {generatedImage && (
                      <img 
                        src={generatedImage} 
                        alt="CryptAlko Concept Art" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-8 left-8 right-8">
                      <h2 className="text-2xl font-mono font-bold text-[#FF6B00] uppercase tracking-[0.2em]">Neural Mesh Concept Art</h2>
                      <p className="text-xs text-gray-400 mt-2 font-mono">8K RESOLUTION // CINEMATIC LIGHTING // AI GENERATED</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowConcept(false)}
                    className="mt-8 px-8 py-3 bg-[#FF6B00] text-black font-mono font-bold uppercase tracking-widest rounded-xl hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20"
                  >
                    Back to Tunnel Context
                  </button>
                </motion.div>
              </ErrorBoundary>
            ) : !showChat ? (
              <motion.div
                key="bridge"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 1 }}
                className="relative w-full max-w-xl py-6 px-4 flex flex-col items-center"
              >
                <div className="relative flex flex-col items-center w-full">
                  <NeuralMesh isLocked={status === 'locked'} value={getScanUrl() || "CRYPTALKO_SECURE_BRIDGE_P2P"} />
                  
                  {/* Interactive padlock button trigger */}
                  <div 
                    onClick={() => {
                      if (status === 'idle') {
                        startHandshake(true);
                      }
                    }}
                    className={cn(
                      "absolute inset-0 flex items-center justify-center transition-all duration-300",
                      status === 'idle' 
                        ? "cursor-pointer pointer-events-auto hover:scale-[1.03] active:scale-[0.98] group/padlock" 
                        : "pointer-events-none"
                    )}
                  >
                    <SecurePadlock isLocked={status === 'locked'} status={status} isDarkMode={isDarkMode} />
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 text-center"
                  >
                    <p className={cn(
                      "text-xs font-mono tracking-[0.25em] uppercase",
                      isDarkMode ? "text-white/50" : "text-zinc-500"
                    )}>
                      {status === 'idle' 
                        ? 'Bridge Offline // Tap Padlock to Host' 
                        : status === 'searching' 
                        ? 'Establishing P2P Secure Handshake...' 
                        : 'Tunnel Cryptography Verified'}
                    </p>
                    <div className="mt-4 flex items-center justify-center space-x-2">
                       <div className={cn(
                         "w-1.5 h-1.5 rounded-full animate-pulse",
                         status === 'idle' ? "bg-zinc-500" : status === 'searching' ? "bg-[#FF6B00]" : "bg-[#FFB300]"
                       )} />
                       <span className={cn(
                         "text-[10px] font-mono tracking-widest",
                         isDarkMode ? "text-white/40" : "text-zinc-500"
                       )}>
                         {status === 'idle' 
                           ? 'SECURE_TUNNEL_STANDBY' 
                           : status === 'searching' 
                           ? 'SOLVING_CRYPTOGRAPHIC_DIFFICULTY' 
                           : 'ENCRYPTION_ACTIVE_AES256'}
                       </span>
                    </div>
                  </motion.div>
                </div>

                {/* --- Manual Join & Active Handshake Option Components --- */}
                <RoomControls 
                  status={status}
                  role={role}
                  roomId={roomId}
                  addLog={addLog}
                  joinRoom={joinRoom}
                  getScanUrl={getScanUrl}
                  setIsScanning={setIsScanning}
                  isDarkMode={isDarkMode}
                />

                {/* Concept Art Button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={generateConceptArt}
                  disabled={isGenerating}
                  className="mt-8 flex items-center space-x-2.5 px-4 py-2.5 rounded-xl border border-[#FF6B00]/20 bg-black/40 text-[#FF6B00] hover:bg-[#FF6B00]/10 hover:border-[#FF6B00]/40 transition-all group cursor-pointer"
                >
                  {isGenerating ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <ImageIcon size={14} className="group-hover:scale-110 transition-transform" />
                  )}
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
                    {isGenerating ? 'Synthesizing...' : 'View 8K Concept Art'}
                  </span>
                </motion.button>
              </motion.div>
            ) : (
              <ChatPanel 
                role={role}
                roomId={roomId}
                chatMessages={filteredChatMessages}
                isOnline={isOnline}
                isTranslationEnabled={isTranslationEnabled}
                targetLanguage={targetLanguage}
                translations={translations}
                isRecording={isRecording}
                recordingDuration={recordingDuration}
                startAudioRecording={startAudioRecording}
                stopAudioRecording={stopAudioRecording}
                handleImageSelect={handleImageSelect}
                inputMessage={inputMessage}
                setInputMessage={setInputMessage}
                handleSendMessage={handleSendMessage}
                
                // Pass WebRTC call props
                callStatus={callStatus}
                isMuted={isMuted}
                callDuration={callDuration}
                isSimulatedCall={isSimulatedCall}
                startCall={startCall}
                acceptCall={acceptCall}
                declineCall={declineCall}
                endCall={endCall}
                toggleMute={toggleMute}
                isDarkMode={isDarkMode}
                readReceipts={readReceipts}
                
                // Pass new props
                leaveAndDestroyRoom={leaveAndDestroyRoom}
                secondsRemaining={secondsRemaining}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- Side-Drawer Terminal & Cryptographic Settings Panels --- */}
      <TerminalLogs 
        showTerminal={showTerminal}
        setShowTerminal={setShowTerminal}
        logs={logs}
        setLogs={setLogs}
        encryptionKey={encryptionKey}
        setEncryptionKey={setEncryptionKey}
        cipherAlgorithm={cipherAlgorithm}
        setCipherAlgorithm={setCipherAlgorithm}
        derivationRounds={derivationRounds}
        setDerivationRounds={setDerivationRounds}
        vibrationEnabled={vibrationEnabled}
        setVibrationEnabled={setVibrationEnabled}
        addLog={addLog}
        startHandshake={startHandshake}
        isDarkMode={isDarkMode}
      />

      {/* Settings / Console Drawer Toggle Action Overlay Trigger button */}
      <button 
        type="button"
        onClick={() => setShowTerminal(!showTerminal)}
        className="fixed bottom-6 right-6 z-30 p-4 bg-zinc-900 border border-white/10 text-white/70 hover:text-white rounded-full hover:border-[#FF6B00]/40 hover:bg-black/90 cursor-pointer shadow-xl transition-all group"
        title="Toggle Operations Console"
      >
        <Terminal size={20} className="group-hover:scale-110 group-hover:text-[#FF6B00] transition-all" />
      </button>

      {/* --- camera based QR code scanner --- */}
      <AnimatePresence>
        {isScanning && (
          <ErrorBoundary fallbackTitle="عطل في الكاميرا // CAMERA INTERFACE FAULT">
            <CameraScanner 
              onScan={handleQrScan} 
              onClose={() => setIsScanning(false)} 
              addLog={addLog}
            />
          </ErrorBoundary>
        )}
      </AnimatePresence>

      {/* --- Visual Shield Obfuscation Backdrop --- */}
      <AnimatePresence>
        {isBlurred && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none font-mono"
          >
            <div className="w-16 h-16 rounded-full bg-[#FF6B00]/10 flex items-center justify-center border border-[#FF6B00]/20 text-[#FF6B00] mb-4 animate-pulse">
              <ShieldAlert size={28} />
            </div>
            <h2 className="text-sm font-bold text-[#FF6B00] tracking-widest uppercase mb-1">
              Visual Shield Active // شاشة الحماية نشطة
            </h2>
            <p className="text-[10px] text-white/40 max-w-xs leading-relaxed uppercase">
              Screen content obfuscated to prevent shoulder-surfing and viewport captures.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Session Terminated / Purged Notification Overlay --- */}
      <AnimatePresence>
        {exitReason && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none font-mono"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 mb-4 animate-bounce">
              <ShieldAlert size={28} />
            </div>
            <h2 className="text-sm font-bold text-red-500 tracking-widest uppercase mb-1">
              {exitReason === 'timeout' 
                ? 'انتهت مهلة الرد // RESPONSE TIMEOUT' 
                : 'تم إنهاء الجلسة تلقائياً // SESSION TERMINATED'}
            </h2>
            <p className="text-[10px] text-white/60 max-w-sm leading-relaxed mb-6 px-4" style={{ direction: 'rtl' }}>
              {exitReason === 'timeout'
                ? 'مرت 60 ثانية على إرسال الرسالة دون رد من الطرف الآخر. تم تدمير الغرفة نهائياً من قاعدة البيانات وطرد الطرفين وتطهير كامل الملفات المتبادلة.'
                : 'خرج الطرف الآخر من الغرفة أو أغلقت الجلسة. تم الخروج تلقائياً وتطهير المحادثات والملفات المتبادلة بالكامل وحذف الغرفة لحماية خصوصيتك.'}
            </p>
            <button
              onClick={() => setExitReason(null)}
              className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-black font-mono font-bold text-xs uppercase rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer"
            >
              مفهوم // UNDERSTOOD
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 left-0 w-32 h-32 border-t border-l border-gray-800/40 pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-b border-r border-gray-800/40 pointer-events-none z-0" />
    </div>
  );
}
