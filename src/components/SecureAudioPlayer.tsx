import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SecureAudioPlayerProps {
  src: string;
}

export const SecureAudioPlayer = ({ src }: SecureAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="mt-2.5 p-3.5 bg-black/40 border border-[#FFB300]/10 rounded-xl flex items-center space-x-3 text-left">
      <audio ref={audioRef} src={src} className="hidden" />
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-[#FFB300]/10 hover:bg-[#FFB300]/20 border border-[#FFB300]/30 flex items-center justify-center text-[#FFB300] transition-all cursor-pointer shrink-0"
      >
        {isPlaying ? (
          <div className="flex space-x-0.5 justify-center items-center">
            <span className="w-0.5 h-2.5 bg-[#FFB300] animate-pulse" />
            <span className="w-0.5 h-2.5 bg-[#FFB300] animate-pulse [animation-delay:0.15s]" />
            <span className="w-0.5 h-2.5 bg-[#FFB300] animate-pulse [animation-delay:0.3s]" />
          </div>
        ) : (
          <Play size={11} className="ml-0.5 text-[#FFB300]" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-[8px] font-mono text-white/40 mb-1">
          <span className="truncate mr-2">SECURE_VOICE_MEMO.WAV</span>
          <span className="shrink-0">{formatTime(currentTime)} / {formatTime(duration || 0)}</span>
        </div>
        <div className="flex items-end space-x-0.5 h-3.5 overflow-hidden opacity-75">
          {Array.from({ length: 28 }).map((_, i) => {
            const heightClass = [
              'h-2', 'h-1', 'h-3', 'h-2', 'h-4', 'h-1', 'h-3', 'h-2',
              'h-1', 'h-4', 'h-2', 'h-3', 'h-1', 'h-2', 'h-4', 'h-3',
              'h-1', 'h-2', 'h-3', 'h-4', 'h-2', 'h-1', 'h-3', 'h-2',
              'h-1', 'h-3', 'h-2', 'h-1'
            ][i];
            return (
              <div
                key={i}
                className={cn(
                  "w-0.5 rounded-full bg-[#FFB300]/25 transition-all",
                  heightClass,
                  isPlaying && "bg-[#FFB300] animate-pulse"
                )}
                style={{
                  animationDelay: `${i * 0.03}s`,
                  animationDuration: '0.6s'
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
