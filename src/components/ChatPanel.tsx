import { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Loader2, ShieldAlert, Volume2, 
  Image as ImageIcon, Square, Send, Mic, Phone, PhoneCall, PhoneOff, MicOff, Activity, Trash2
} from 'lucide-react';
import { SecureAudioPlayer } from './SecureAudioPlayer';
import { ChatMessage } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ChatPanelProps {
  role: 'host' | 'peer';
  roomId: string | null;
  chatMessages: ChatMessage[];
  isOnline: boolean;
  isTranslationEnabled: boolean;
  targetLanguage: string;
  translations: Record<string, {
    text: string;
    audio?: string;
    loading: boolean;
    error?: string;
  }>;
  isRecording: boolean;
  recordingDuration: number;
  startAudioRecording: () => void;
  stopAudioRecording: () => void;
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  
  // E2EE Audio Call States & Methods
  callStatus: 'idle' | 'ringing_out' | 'ringing_in' | 'connecting' | 'connected' | 'ended';
  isMuted: boolean;
  callDuration: number;
  isSimulatedCall: boolean;
  startCall: () => void;
  acceptCall: () => void;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  isDarkMode: boolean;
  readReceipts?: boolean;
  
  // New props for session destruction and auto-purging
  leaveAndDestroyRoom: () => Promise<void>;
  secondsRemaining?: number | null;
}

export const ChatPanel = ({
  role,
  roomId,
  chatMessages,
  isOnline,
  isTranslationEnabled,
  targetLanguage,
  translations,
  isRecording,
  recordingDuration,
  startAudioRecording,
  stopAudioRecording,
  handleImageSelect,
  inputMessage,
  setInputMessage,
  handleSendMessage,
  
  // Destructure Audio Call Props
  callStatus,
  isMuted,
  callDuration,
  isSimulatedCall,
  startCall,
  acceptCall,
  declineCall,
  endCall,
  toggleMute,
  isDarkMode,
  readReceipts,
  
  // New props
  leaveAndDestroyRoom,
  secondsRemaining,
}: ChatPanelProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div
      key="chat"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative w-full max-w-3xl h-[70vh] border rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all duration-300",
        isDarkMode ? "bg-[#161616]/90 border-white/5" : "bg-white border-zinc-200"
      )}
    >
      {/* Chat Panel Status Bar */}
      <div className={cn(
        "p-4 border-b flex items-center justify-between transition-colors",
        isDarkMode ? "border-white/5 bg-black/40" : "border-zinc-200 bg-zinc-100"
      )}>
        <div className="flex items-center space-x-4">
          <div className="w-9 h-9 rounded-full bg-[#FFB300]/10 flex items-center justify-center text-[#FFB300]">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h2 className="font-mono text-xs font-bold text-[#FFB300] tracking-wider uppercase">
              {role === 'host' ? 'SECURE P2P HOST (NODE A)' : 'SECURE P2P PEER (NODE B)'}
            </h2>
            <p className={cn(
              "text-[9px] font-mono",
              isDarkMode ? "text-white/40" : "text-zinc-500"
            )}>
              ROOM: {roomId} // ENCRYPTED STREAM // TUNNEL LATENCY: 14ms
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3.5">
          {/* DESTROY & LEAVE BUTTON */}
          <button
            onClick={leaveAndDestroyRoom}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all text-[9px] font-mono uppercase tracking-wider font-bold cursor-pointer"
            title="مغادرة وتدمير المحادثة نهائياً"
          >
            <Trash2 size={10} className="ml-1" />
            <span>تدمير ومغادرة (Destroy & Leave)</span>
          </button>

          {/* SECURE TELEPHONE INITIATION TRIGGER BUTTON */}
          {callStatus === 'idle' && (
            <button
              onClick={startCall}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300 border border-green-500/20 hover:border-green-500/40 rounded-xl transition-all text-[9px] font-mono uppercase tracking-wider font-bold cursor-pointer"
              title="ابدأ اتصالاً هاتفياً تكتيكياً E2EE"
            >
              <Phone size={10} className="animate-pulse" />
              <span>اتصال تكتيكي (Secure Call)</span>
            </button>
          )}

          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              isOnline ? "bg-[#FFB300]" : "bg-amber-500"
            )} />
            <span className={cn(
              "text-[9px] font-mono uppercase tracking-widest",
              isOnline ? "text-[#FFB300]/60" : "text-amber-500"
            )}>
              {isOnline ? 'Active Tunnel' : 'SANDBOX_OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {callStatus !== 'idle' ? (
        /* --- RENDER E2EE TACTICAL VOICE CALL MODULE OVERLAY --- */
        <div className="flex-1 flex flex-col items-center justify-center bg-[#0d0d0d] relative z-30 p-6 text-center font-mono select-none">
          {/* Decorative radar sweep / glowing pulse */}
          <div className="relative mb-8 flex items-center justify-center">
            <div className={cn(
              "absolute w-44 h-44 rounded-full border border-green-500/10 animate-ping duration-1000"
            )} />
            <div className={cn(
              "absolute w-32 h-32 rounded-full border border-[#FF6B00]/20 animate-pulse duration-2000"
            )} />
            <div className="absolute w-24 h-24 rounded-full bg-[#121212] border border-white/5 flex items-center justify-center" />
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all z-10",
              callStatus === 'ringing_in' ? "bg-amber-500/20 text-amber-500 animate-bounce" :
              callStatus === 'ringing_out' ? "bg-green-500/20 text-green-400 animate-pulse" :
              callStatus === 'connected' ? "bg-[#FF6B00]/20 text-[#FF6B00]" : "bg-red-500/10 text-red-400"
            )}>
              {callStatus === 'connected' ? (
                <PhoneCall size={28} className="animate-pulse" />
              ) : callStatus === 'ended' ? (
                <PhoneOff size={28} />
              ) : (
                <Phone size={28} className="animate-bounce" />
              )}
            </div>
          </div>

          {/* Custom Status labels in Arabic and English */}
          <div className="space-y-3 max-w-md">
            {callStatus === 'ringing_out' && (
              <>
                <h3 className="text-sm font-bold text-green-400 tracking-wider uppercase animate-pulse">
                  جاري إرسال نداء الاتصال المشفر...
                </h3>
                <p className="text-[10px] text-white/50 leading-relaxed font-mono">
                  SECURE VOICE DIAL // OUTBOUND HANDSHAKE PENDING REMOTE ACKNOWLEDGEMENT
                </p>
                <div className="text-[9px] text-white/30 italic">
                  بانتظار قبول الطرف الآخر لربط نفق الصوت E2EE
                </div>
              </>
            )}

            {callStatus === 'ringing_in' && (
              <>
                <h3 className="text-sm font-bold text-amber-500 tracking-wider uppercase animate-bounce">
                  اتصال هاتفي وارد آمن E2EE!
                </h3>
                <p className="text-[10px] text-white/50 leading-relaxed font-mono">
                  INBOUND SECURE TELEPHONE SIGNAL // DETECTED REMOTE HANDSHAKE REQUEST
                </p>
                <div className="text-[9px] text-white/30 italic">
                  انقر على زر القبول الأخضر أدناه لبدء المحادثة المشفرة
                </div>
              </>
            )}

            {callStatus === 'connecting' && (
              <>
                <h3 className="text-sm font-bold text-[#FFB300] tracking-wider uppercase flex items-center justify-center space-x-2">
                  <Loader2 size={14} className="animate-spin" />
                  <span>جاري إنشاء نفق الصوت الآمن...</span>
                </h3>
                <p className="text-[10px] text-white/50 leading-relaxed font-mono">
                  ESTABLISHING WebRTC PEER CONNECTIONS // RESOLVING ENCRYPTION SCHEMES
                </p>
              </>
            )}

            {callStatus === 'connected' && (
              <>
                <h3 className="text-sm font-bold text-[#FF6B00] tracking-wider uppercase flex items-center justify-center space-x-1.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                  <span>قناة اتصال تكتيكية مشفرة بالكامل</span>
                </h3>
                <p className="text-2xl font-black text-white tracking-widest pt-1.5 font-mono">
                  {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                </p>
                <p className="text-[9px] text-white/40 leading-relaxed font-mono">
                  CHANNEL LOCK: ACTIVE // ENCRYPTION: AES-256-GCM / CHACHA20 // LATENCY: ~12ms
                </p>
                
                {/* Simulated Audio Spectrum Visualizer */}
                <div className="flex items-center justify-center space-x-1 h-8 mt-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1].map((bar, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-[#FF6B00] rounded-full transition-all"
                      style={{
                        height: `${Math.max(15, Math.sin(Date.now() / 200 + i) * 80 + 30)}%`,
                        animation: `pulse 1s ease-in-out infinite alternate`,
                        animationDelay: `${i * 0.05}s`
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            {callStatus === 'ended' && (
              <>
                <h3 className="text-sm font-bold text-red-500 tracking-wider uppercase">
                  تم إنهاء الاتصال بنجاح
                </h3>
                <p className="text-[10px] text-white/40 leading-relaxed font-mono">
                  SECURE VOICE SESSION TERMINATED // PURGING ENTROPY CORES
                </p>
              </>
            )}
          </div>

          {/* Offline Simulated mode banner */}
          {isSimulatedCall && callStatus !== 'ended' && (
            <div className="mt-5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded text-[9px] font-mono uppercase tracking-widest">
              وضع الطوارئ المحاكي // OFFLINE TRANSMITTER EMERGENCY BACKUP ACTIVE
            </div>
          )}

          {/* Tactical controls */}
          <div className="mt-10 flex items-center justify-center space-x-4">
            {/* Accept button (Ringing In only) */}
            {callStatus === 'ringing_in' && (
              <button
                type="button"
                onClick={acceptCall}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center space-x-2"
              >
                <Phone size={14} className="ml-1" />
                <span>قبول الاتصال (Accept)</span>
              </button>
            )}

            {/* Decline button (Ringing In only) */}
            {callStatus === 'ringing_in' && (
              <button
                type="button"
                onClick={declineCall}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center space-x-2"
              >
                <PhoneOff size={14} className="ml-1" />
                <span>رفض (Decline)</span>
              </button>
            )}

            {/* Mute Button (Connected only) */}
            {callStatus === 'connected' && (
              <button
                type="button"
                onClick={toggleMute}
                className={cn(
                  "p-3.5 rounded-full border transition-all cursor-pointer",
                  isMuted 
                    ? "bg-amber-500/20 border-amber-500 text-amber-500" 
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                )}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}

            {/* Decline / End Call for Outgoing/Connected */}
            {(callStatus === 'ringing_out' || callStatus === 'connected' || callStatus === 'connecting') && (
              <button
                type="button"
                onClick={() => endCall()}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center space-x-2 shadow-lg shadow-red-950/40"
              >
                <PhoneOff size={14} className="ml-1" />
                <span>قطع الاتصال (Disconnect)</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* --- RENDER STANDARD MESSAGES & CONTROLS --- */
        <>
          {secondsRemaining !== null && secondsRemaining !== undefined && (() => {
            const conversationalMessages = chatMessages.filter(msg => !msg.isSystem);
            const lastMsg = conversationalMessages[conversationalMessages.length - 1];
            const isWaitingForReply = lastMsg ? lastMsg.sender === 'You' : false;
            return (
              <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center justify-between text-red-500 font-mono text-[10px] animate-pulse">
                <div className="flex items-center space-x-1.5 space-x-reverse">
                  <ShieldAlert size={12} className="text-red-500 animate-bounce ml-1.5" />
                  <span className="font-sans font-bold text-right" style={{ direction: 'rtl' }}>
                    {isWaitingForReply 
                      ? 'بانتظار رد الطرف الآخر لتفادي التدمير التلقائي والخروج:' 
                      : 'الرجاء الرد لتفادي التدمير التلقائي والخروج فوراً:'}
                  </span>
                </div>
                <div className="font-bold tracking-widest">
                  REPLY TIMEOUT: <span className="text-red-400 font-black">{secondsRemaining}s</span>
                </div>
              </div>
            );
          })()}

          {/* Messages Display */}
          <div className={cn(
            "flex-1 p-6 font-mono text-xs space-y-4 overflow-y-auto transition-colors duration-300",
            isDarkMode ? "bg-black/20" : "bg-zinc-50/50"
          )}>
            {chatMessages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex flex-col space-y-1.5",
                  msg.sender === 'You' ? "items-end" : "items-start"
                )}
              >
                <div className="flex items-center space-x-2">
                  <span className={cn(
                    "text-[9px] uppercase tracking-wider",
                    msg.sender === 'You' 
                      ? "text-[#FFB300]/70" 
                      : msg.sender === 'System' 
                      ? "text-[#FF6B00]/70" 
                      : (isDarkMode ? "text-white/40" : "text-zinc-500")
                  )}>
                    {msg.sender === 'You' ? 'OUTBOUND_PAYLOAD' : msg.sender === 'System' ? 'SYSTEM_DIAGNOSTIC' : 'INBOUND_PAYLOAD'}
                  </span>
                  <span className={cn(
                    "text-[9px]",
                    isDarkMode ? "text-white/20" : "text-zinc-400"
                  )}>{msg.time}</span>
                  {msg.sender === 'You' && !msg.isPending && (
                    <span className={cn(
                      "text-[9.5px] font-mono font-black ml-1.5",
                      readReceipts ? "text-emerald-400" : (isDarkMode ? "text-white/25" : "text-zinc-400")
                    )}>
                      {readReceipts ? '✓✓ READ' : '✓ SENT'}
                    </span>
                  )}
                  {msg.isPending && (
                    <span className="text-[8px] font-bold text-amber-500 animate-pulse uppercase tracking-widest border border-amber-500/30 px-1.5 py-0.5 bg-amber-500/10 rounded">
                      LOCAL_QUEUED
                    </span>
                  )}
                </div>
                
                <div className={cn(
                  "p-4 rounded-xl max-w-[85%] border transition-all text-left",
                  msg.sender === 'You' 
                    ? (isDarkMode ? "bg-[#FFB300]/5 border-[#FFB300]/25 text-[#FFB300]" : "bg-amber-50 border-amber-300 text-amber-800 shadow-sm")
                    : msg.sender === 'System'
                    ? (isDarkMode ? "bg-black/60 border-[#FF6B00]/20 text-white/90" : "bg-zinc-100 border-orange-200 text-orange-800") + " italic"
                    : (isDarkMode ? "bg-white/5 border-white/5 text-white/90" : "bg-white border-zinc-200 text-zinc-800 shadow-sm")
                )}>
                  {(() => {
                    const isIncoming = msg.sender !== 'You' && msg.sender !== 'System';
                    if (!isTranslationEnabled || !isIncoming) {
                      return (
                        <>
                          {msg.text && <p>{msg.text}</p>}
                          
                          {/* Render Decrypted Image */}
                          {msg.mediaType === 'image' && msg.mediaPayload && (
                            <div className="mt-1 rounded-lg overflow-hidden border border-[#FFB300]/20 max-w-sm relative group bg-[#111]">
                              <img 
                                src={msg.mediaPayload} 
                                alt="Encrypted Payload Decrypted Locally" 
                                className="w-full h-auto object-cover max-h-64 cursor-zoom-in"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/80 rounded border border-[#FFB300]/40 text-[7px] text-[#FFB300] font-mono uppercase tracking-wider">
                                DECRYPTED_IMAGE
                              </div>
                            </div>
                          )}

                          {/* Render Decrypted Audio Custom Player */}
                          {msg.mediaType === 'audio' && msg.mediaPayload && (
                            <SecureAudioPlayer src={msg.mediaPayload} />
                          )}
                        </>
                      );
                    }

                    // Get translation state
                    const cacheKey = `${msg.id}_${targetLanguage}`;
                    const trans = translations[cacheKey];

                    return (
                      <div className="space-y-3">
                        {/* Display loader if fetching */}
                        {(!trans || trans.loading) && (
                          <div className="flex items-center space-x-2 py-2 text-[#FFB300]">
                            <Loader2 size={12} className="animate-spin" />
                            <span className="text-[9px] uppercase tracking-widest animate-pulse font-mono">Neural AI Translation decrypting...</span>
                          </div>
                        )}

                        {/* Display error if failed */}
                        {trans?.error && (
                          <div className="text-red-400 text-[10px] italic flex items-center space-x-1.5 font-mono">
                            <ShieldAlert size={12} />
                            <span>Translation Error // خطأ في الترجمة ({trans.error})</span>
                          </div>
                        )}

                        {/* Display translation text & media */}
                        {trans && !trans.loading && !trans.error && (
                          <div className="space-y-2.5">
                            {/* Translated Audio (Voice-to-Voice) */}
                            {msg.mediaType === 'audio' && trans.audio && (
                              <div className="border border-[#FFB300]/20 rounded-xl p-1.5 bg-black/40">
                                <div className="px-3 pt-1.5 text-[8px] font-bold text-[#FFB300] uppercase tracking-widest flex items-center space-x-1">
                                  <Volume2 size={10} className="animate-pulse" />
                                  <span>AI Voice Translation // الترجمة الصوتية الذكية ({targetLanguage})</span>
                                </div>
                                <SecureAudioPlayer src={trans.audio} />
                              </div>
                            )}

                            {/* Translated Text Content */}
                            {trans.text && (
                              <div className="text-white/90 text-[13px] font-sans bg-[#FFB300]/5 border border-[#FFB300]/10 rounded-xl p-3 relative">
                                <p className="leading-relaxed">{trans.text}</p>
                                <div className="absolute -top-2 right-2 px-1 py-0.5 bg-black/80 border border-[#FFB300]/30 text-[6px] text-[#FFB300] font-mono rounded tracking-widest uppercase">
                                  Decrypted Translate
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Original content collapsible/underneath as reference */}
                        <div className="border-t border-white/5 pt-2.5 mt-2">
                          <span className={cn(
                            "text-[8px] uppercase tracking-widest block mb-1",
                            isDarkMode ? "text-white/30" : "text-zinc-400"
                          )}>
                            Original payload reference // الرسالة الأصلية:
                          </span>
                          {msg.text && <p className={cn(
                            "italic font-mono text-[10px] break-words",
                            isDarkMode ? "text-white/40" : "text-zinc-500"
                          )}>"{msg.text}"</p>}
                          
                          {msg.mediaType === 'image' && msg.mediaPayload && (
                            <div className="mt-1 rounded-lg overflow-hidden border border-white/10 max-w-sm relative group bg-[#111] opacity-60 hover:opacity-100 transition-all">
                              <img 
                                src={msg.mediaPayload} 
                                alt="Original Image" 
                                className="w-full h-auto object-cover max-h-48 cursor-zoom-in"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          {msg.mediaType === 'audio' && msg.mediaPayload && (
                            <div className="opacity-50 hover:opacity-100 transition-all">
                              <SecureAudioPlayer src={msg.mediaPayload} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Ciphertext Representation for High-End Cyber Aesthetics */}
                  {msg.ciphertext && (
                    <div className={cn(
                      "mt-2.5 pt-2 border-t text-[9px] font-mono break-all select-all",
                      isDarkMode ? "border-white/10 text-white/30" : "border-zinc-200 text-zinc-400"
                    )}>
                      <span className="text-[#FF6B00]/50 block font-bold mb-0.5">CIPHERTEXT (Hex payload):</span>
                      {msg.ciphertext}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input Controls */}
          <div className={cn(
            "px-4 py-3 border-t flex flex-col space-y-2.5 transition-colors",
            isDarkMode ? "border-white/5 bg-black/50" : "border-zinc-200 bg-zinc-100"
          )}>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageSelect} 
              accept="image/*" 
              className="hidden" 
            />

            {/* Recording Status Bar */}
            {isRecording && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between bg-red-500/10 border border-red-500/30 px-3.5 py-2.5 rounded-xl text-xs font-mono text-red-400"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  <span className="font-bold tracking-widest uppercase text-[10px]">RECORDING AUDIO...</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs">
                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={stopAudioRecording}
                    className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-black font-bold uppercase tracking-wider rounded text-[9px] transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <Square size={10} className="fill-black" />
                    <span>STOP</span>
                  </button>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              {/* Attachment trigger button */}
              <button 
                type="button"
                disabled={isRecording}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "p-3 rounded-xl transition-all shrink-0 cursor-pointer disabled:opacity-50 border",
                  isDarkMode 
                    ? "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10" 
                    : "bg-white border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                )}
                title="Attach Encrypted Image"
              >
                <ImageIcon size={15} />
              </button>

              {/* Voice recorder trigger button */}
              <button 
                type="button"
                onClick={isRecording ? stopAudioRecording : startAudioRecording}
                className={cn(
                  "p-3 rounded-xl border transition-all shrink-0 cursor-pointer",
                  isRecording 
                    ? "bg-red-500/20 border-red-500 text-red-400" 
                    : (isDarkMode ? "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10" : "bg-white border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50")
                )}
                title={isRecording ? "Stop Recording" : "Record Voice Memo"}
              >
                <Mic size={15} className={cn(isRecording && "animate-pulse")} />
              </button>

              {/* Message input */}
              <div className="relative flex-1 flex items-center">
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isRecording}
                  placeholder={isRecording ? "Recording active..." : "Type secure outbound message..."}
                  className={cn(
                    "w-full border rounded-xl px-4 py-3.5 pr-12 font-mono text-xs transition-all disabled:opacity-50 focus:outline-none focus:ring-1",
                    isDarkMode 
                      ? "bg-[#121212] border-white/5 text-white/90 placeholder-white/20 focus:border-[#FFB300]/50 focus:ring-[#FFB300]/20" 
                      : "bg-white border-zinc-300 text-zinc-800 placeholder-zinc-400 focus:border-amber-500 focus:ring-amber-500/20"
                  )}
                />
                <button 
                  type="submit"
                  disabled={isRecording || !inputMessage.trim()}
                  className="absolute right-3 p-2 bg-[#FFB300]/10 text-[#FFB300] hover:bg-[#FFB300]/20 disabled:opacity-30 rounded-lg transition-all cursor-pointer"
                >
                  <Send size={13} />
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </motion.div>
  );
};
