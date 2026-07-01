import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, X, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface CameraScannerProps {
  onScan: (scannedText: string) => void;
  onClose: () => void;
  addLog: (level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'SECURE', message: string) => void;
}

export default function CameraScanner({ onScan, onClose, addLog }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize camera stream
  const startCamera = async (currentFacing: 'environment' | 'user') => {
    setLoading(true);
    setError(null);
    
    // Stop any existing stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    try {
      addLog('INFO', `Requesting hardware access to camera (facingMode: ${currentFacing})...`);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: currentFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        videoRef.current.play();
      }
      setLoading(false);
      addLog('SUCCESS', 'Webcam video stream locked successfully.');
    } catch (err: any) {
      console.error('Camera access error:', err);
      let errMsg = 'تعذر الوصول إلى الكاميرا. يرجى التحقق من الأذونات.';
      if (err.name === 'NotAllowedError') {
        errMsg = 'تم رفض إذن الكاميرا. يرجى تفعيل الصلاحية من إعدادات المتصفح.';
      } else if (err.name === 'NotFoundError') {
        errMsg = 'لم يتم العثور على كاميرا في هذا الجهاز.';
      }
      setError(errMsg);
      setLoading(false);
      addLog('ERROR', `Camera stream negotiation failed: ${err.message || 'Permission denied'}`);
    }
  };

  // Toggle front/rear camera
  const toggleCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      // Cleanup tracks on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Frame processing loop
  useEffect(() => {
    if (loading || error) return;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw video frame to our offscreen canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Grab ImageData buffer for jsQR
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            // Found a QR Code!
            addLog('SUCCESS', 'Decrypted QR code payload signature.');
            onScan(code.data);
            
            // Stop tracks immediately
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => track.stop());
            }
            return; // Exit loop
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [loading, error]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div className="relative w-full max-w-md bg-[#161616] border border-[#FF6B00]/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header bar */}
        <div className="p-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="text-[#FF6B00]" size={16} />
            <span className="font-mono text-xs font-bold tracking-wider text-[#FF6B00] uppercase">
              مسح الرمز // QR HANDSHAKE
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Area */}
        <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 z-10 bg-[#121212]">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#FF6B00] animate-spin" />
              <p className="font-mono text-xs text-white/50">جاري بدء تشغيل الكاميرا...</p>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center space-y-4 z-10 bg-[#121212]">
              <CameraOff className="text-red-500" size={40} />
              <p className="font-sans text-sm text-white/80 leading-relaxed font-semibold">
                {error}
              </p>
              <button
                onClick={() => startCamera(facingMode)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-mono text-xs border border-white/10 rounded-xl transition-all"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : (
            <>
              {/* Webcam Video */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover pointer-events-none"
                muted
                playsInline
              />

              {/* Offscreen canvas for frame capture */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Cyberpunk Overlay Laser and Reticle */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Aiming Reticle Frame */}
                <div className="relative w-64 h-64 border border-white/10 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                  {/* Glowing corners */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#FF6B00] rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#FF6B00] rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#FF6B00] rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#FF6B00] rounded-br-lg" />

                  {/* Pulsing Target Grid */}
                  <div className="absolute inset-4 border border-dashed border-white/5 rounded-lg animate-pulse" />

                  {/* Laser line effect */}
                  <div className="absolute left-0 right-0 h-0.5 bg-[#FF6B00] shadow-[0_0_15px_#FF6B00] animate-[scan_2s_infinite_ease-in-out]" />
                </div>

                <div className="mt-6 px-4 py-1.5 rounded-full bg-black/60 border border-white/5 text-[10px] font-mono text-[#FFB300] tracking-widest uppercase shadow-md animate-pulse">
                  ضع الرمز داخل الإطار للمزامنة
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer controls */}
        <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
            المستشعر: {facingMode === 'environment' ? 'الخلفي' : 'الأمامي'}
          </span>

          {!error && !loading && (
            <button
              onClick={toggleCamera}
              className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-mono text-xs border border-white/10 rounded-xl transition-all"
            >
              <RefreshCw size={12} />
              <span>تبديل الكاميرا</span>
            </button>
          )}
        </div>
      </div>

      {/* Embedded CSS for the scanner laser animation */}
      <style>{`
        @keyframes scan {
          0% { top: 10%; opacity: 0.8; }
          50% { top: 90%; opacity: 1; }
          100% { top: 10%; opacity: 0.8; }
        }
      `}</style>
    </motion.div>
  );
}
