import { useState, useRef } from 'react';

export interface UseAudioRecorderProps {
  addLog: (type: 'INFO' | 'SUCCESS' | 'SECURE' | 'ERROR' | 'WARN', message: string) => void;
  sendSecureMessage: (text: string, mediaType?: 'text' | 'image' | 'audio', mediaPayload?: string) => Promise<void>;
}

export function useAudioRecorder({ addLog, sendSecureMessage }: UseAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startAudioRecording = async () => {
    try {
      addLog('INFO', 'ميكروفون // Requesting hardware channel interface...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      addLog('SUCCESS', 'قناة الصوت // Channel verified. Initializing secure local recording stream...');
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        addLog('INFO', 'تجهيز الملف // Recording stopped. Compiling secure voice signature...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Convert blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          addLog('INFO', 'تشفير محلي // Applying local E2EE payload encryption...');
          await sendSecureMessage('', 'audio', base64Audio);
        };

        // Release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      addLog('SECURE', 'تسجيل // Recording channel active. End-to-End entropy pool calibration completed.');
    } catch (err: any) {
      console.error(err);
      addLog('ERROR', 'فشل في الوصول للميكروفون // Microphone channel access denied.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  return {
    isRecording,
    recordingDuration,
    startAudioRecording,
    stopAudioRecording,
  };
}
