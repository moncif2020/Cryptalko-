import { useState, useEffect, useRef, useCallback } from 'react';
import { db, doc, setDoc, updateDoc, onSnapshot, collection, addDoc, getDoc, handleFirestoreError, OperationType } from '../firebase';
import { deleteDoc, getDocs } from 'firebase/firestore';

export type CallStatus = 'idle' | 'ringing_out' | 'ringing_in' | 'connecting' | 'connected' | 'ended';

interface UseWebRtcCallProps {
  roomId: string | null;
  role: 'host' | 'peer' | null;
  addLog: (level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'SECURE', message: string) => void;
  isOnline: boolean;
}

export function useWebRtcCall({ roomId, role, addLog, isOnline }: UseWebRtcCallProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isSimulatedCall, setIsSimulatedCall] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const unsubCallRef = useRef<(() => void) | null>(null);
  const unsubIceRef = useRef<(() => void) | null>(null);

  // STUN Servers for NAT Traversal
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' }
  ];

  // Initialize Remote Audio Player in DOM safely
  useEffect(() => {
    const audio = document.createElement('audio');
    audio.autoplay = true;
    audio.id = 'secure-webrtc-remote-audio';
    remoteAudioRef.current = audio;
    document.body.appendChild(audio);

    return () => {
      if (audio && audio.parentNode) {
        audio.parentNode.removeChild(audio);
      }
    };
  }, []);

  // Timer for duration of call
  useEffect(() => {
    if (callStatus === 'connected') {
      setCallDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callStatus]);

  // Clean up all resources
  const cleanupCallResources = useCallback(() => {
    addLog('INFO', 'إعادة ضبط قنوات الصوت وتطهير الذاكرة السحابية...');

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    if (unsubCallRef.current) {
      unsubCallRef.current();
      unsubCallRef.current = null;
    }

    if (unsubIceRef.current) {
      unsubIceRef.current();
      unsubIceRef.current = null;
    }

    setIsMuted(false);
  }, [addLog]);

  // Handle End Call
  const endCall = useCallback(async (shouldWriteToDb = true) => {
    setCallStatus('ended');
    cleanupCallResources();

    if (!roomId) return;

    if (shouldWriteToDb && isOnline && !isSimulatedCall) {
      try {
        const callRef = doc(db, 'rooms', roomId, 'calls', 'current');
        await setDoc(callRef, { status: 'ended', timestamp: Date.now() });
        addLog('WARN', 'تم إنهاء الاتصال الصوتي وإغلاق نفق التشفير.');
      } catch (err) {
        console.error('Failed to end call in DB:', err);
      }
    } else {
      addLog('WARN', 'تم قطع اتصال الطوارئ المحلي بنجاح.');
    }

    setTimeout(() => {
      setCallStatus('idle');
      setIsSimulatedCall(false);
    }, 2000);
  }, [roomId, isOnline, isSimulatedCall, cleanupCallResources, addLog]);

  // Setup local audio source
  const setupLocalStream = async (): Promise<MediaStream | null> => {
    try {
      addLog('INFO', 'بروتوكول تهيئة الميكروفون: جاري طلب تصريح الوصول الآمن...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      addLog('SUCCESS', 'تم تأمين مدخل الميكروفون بنجاح.');
      return stream;
    } catch (err) {
      console.error('Failed to get local audio stream:', err);
      addLog('ERROR', 'فشل في الوصول إلى الميكروفون. يرجى تأكيد التصريحات.');
      return null;
    }
  };

  // Setup WebRTC Connection and tracks
  const createPeerConnection = (stream: MediaStream) => {
    const pc = new RTCPeerConnection({ iceServers });

    // Add local tracks
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Handle remote tracks
    pc.ontrack = (event) => {
      addLog('SECURE', 'تم استلام دفق صوتي مشفر من الطرف الآخر.');
      if (remoteAudioRef.current && event.streams[0]) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE Candidates generated locally -> Send to Firestore
    pc.onicecandidate = async (event) => {
      if (event.candidate && roomId) {
        const candidatesCol = collection(db, 'rooms', roomId, 'calls', 'current', 'candidates');
        await addDoc(candidatesCol, {
          candidate: JSON.stringify(event.candidate),
          sender: role,
          timestamp: Date.now()
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      addLog('INFO', `حالة الاتصال العصبية: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        setCallStatus('connected');
        addLog('SUCCESS', 'اكتمل نفق الاتصال الهاتفي المشفر بالكامل E2EE!');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        endCall(false);
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // Start Call (Caller Init)
  const startCall = async () => {
    if (!roomId || !role) return;

    if (!isOnline) {
      // Offline simulation fallback call!
      setIsSimulatedCall(true);
      setCallStatus('ringing_out');
      addLog('WARN', 'بث لاسلكي عبر تردد الطوارئ: لا يوجد اتصال بالإنترنت. تفعيل جسر الاتصال الصوتي المحلي المحاكي...');
      
      setTimeout(() => {
        setCallStatus('connected');
        addLog('SUCCESS', 'توصيل التردد اللاسلكي! دمج صوت الميكروفون في مصفاة الصوت التكتيكية (Robotic Air-Gap Filter).');
        // Let's loop local microphone back with a slight metallic effect just for fun, or play high quality secure noise!
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
          localStreamRef.current = stream;
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = stream; // Echo test loopback for simulated offline calls!
          }
        }).catch(() => {});
      }, 3000);
      return;
    }

    const stream = await setupLocalStream();
    if (!stream) return;

    setCallStatus('ringing_out');
    addLog('INFO', 'جاري إنشاء العرض وتوليد مفاتيح تشفير المحادثة...');

    const pc = createPeerConnection(stream);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Save offer to Firestore
    const callRef = doc(db, 'rooms', roomId, 'calls', 'current');
    await setDoc(callRef, {
      status: 'calling',
      caller: role,
      offer: {
        type: offer.type,
        sdp: offer.sdp
      },
      timestamp: Date.now()
    });

    addLog('INFO', 'بانتظار موافقة الطرف الآخر على الاتصال الفوري...');

    // Delete existing candidates if any
    try {
      const candidatesCol = collection(db, 'rooms', roomId, 'calls', 'current', 'candidates');
      const snaps = await getDocs(candidatesCol);
      snaps.forEach(async (d) => {
        await deleteDoc(d.ref);
      });
    } catch (e) {}

    // Listen for peer answer
    unsubCallRef.current = onSnapshot(callRef, async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();

      if (data.status === 'ended') {
        endCall(false);
        return;
      }

      if (data.status === 'answered' && data.answer && callStatus !== 'connected') {
        if (pc.signalingState === 'closed') return;
        addLog('INFO', 'تم استلام مفاتيح فك التشفير من الطرف الثاني. تفعيل القناة...');
        setCallStatus('connecting');
        const desc = new RTCSessionDescription(data.answer);
        try {
          await pc.setRemoteDescription(desc);
          // Start gathering remote ICE Candidates
          listenForRemoteIceCandidates();
        } catch (err) {
          console.error('Failed to set remote description:', err);
          addLog('ERROR', 'فشل في تهيئة القناة الآمنة للطرف البعيد.');
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `rooms/${roomId}/calls/current`);
    });
  };

  // Accept Call (Receiver Init)
  const acceptCall = async () => {
    if (!roomId || !role || !isOnline) return;

    const stream = await setupLocalStream();
    if (!stream) {
      // Can't accept if mic fails
      declineCall();
      return;
    }

    setCallStatus('connecting');
    addLog('INFO', 'تم قبول الاتصال. جاري تهيئة نفق الاستقبال والمصافحة...');

    try {
      const callRef = doc(db, 'rooms', roomId, 'calls', 'current');
      const snap = await getDoc(callRef);
      if (!snap.exists()) {
        addLog('ERROR', 'فشل قبول الاتصال: لم يعد الاتصال متاحاً.');
        endCall(false);
        return;
      }

      const data = snap.data();
      if (!data.offer) {
        addLog('ERROR', 'مواصفات الاتصال مفقودة.');
        endCall(false);
        return;
      }

      const pc = createPeerConnection(stream);
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Save answer to database
      await updateDoc(callRef, {
        status: 'answered',
        answer: {
          type: answer.type,
          sdp: answer.sdp
        }
      });

      addLog('SUCCESS', 'تم إرسال مفاتيح القبول. جاري دمج دفق الاتصال...');
      listenForRemoteIceCandidates();
    } catch (err) {
      console.error('Failed to accept call:', err);
      addLog('ERROR', 'فشل إكمال مصافحة الاتصال الهاتفي.');
      endCall(false);
    }
  };

  // Decline or Reject Incoming Call
  const declineCall = async () => {
    if (!roomId) return;
    addLog('WARN', 'تم رفض الاتصال الوارد.');
    
    if (isOnline && !isSimulatedCall) {
      try {
        const callRef = doc(db, 'rooms', roomId, 'calls', 'current');
        await setDoc(callRef, { status: 'ended', timestamp: Date.now() });
      } catch (err) {
        console.error('Error declining call:', err);
      }
    }
    
    setCallStatus('idle');
    setIsSimulatedCall(false);
    cleanupCallResources();
  };

  // Listen for remote ICE Candidates
  const listenForRemoteIceCandidates = () => {
    if (!roomId || !peerConnectionRef.current) return;

    const candidatesCol = collection(db, 'rooms', roomId, 'calls', 'current', 'candidates');
    unsubIceRef.current = onSnapshot(candidatesCol, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.sender !== role && peerConnectionRef.current) {
            try {
              const cand = JSON.parse(data.candidate);
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(cand));
            } catch (err) {
              console.error('Error adding ICE candidate:', err);
            }
          }
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `rooms/${roomId}/calls/current/candidates`);
    });
  };

  // Mute microphone
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        addLog('INFO', `الميكروفون الآمن: ${!audioTrack.enabled ? 'صامت (MUTED)' : 'مفعل (ACTIVE)'}`);
      }
    }
  };

  // Monitor incoming call signals
  useEffect(() => {
    if (!roomId || !role || !isOnline) return;

    const callRef = doc(db, 'rooms', roomId, 'calls', 'current');
    const unsubscribe = onSnapshot(callRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();

      // Check if there is an active calling event and we are the receiver
      if (data.status === 'calling' && data.caller !== role && callStatus === 'idle') {
        setCallStatus('ringing_in');
        addLog('SECURE', '📡 تنبيه! مكالمة صوتية واردة عبر نفق التشفير...');
        
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        }
      }

      // Handle remote cancellation or end
      if (data.status === 'ended' && (callStatus === 'ringing_in' || callStatus === 'ringing_out' || callStatus === 'connected' || callStatus === 'connecting')) {
        addLog('WARN', 'قام الطرف الآخر بإنهاء الاتصال أو إلغائه.');
        cleanupCallResources();
        setCallStatus('ended');
        setTimeout(() => setCallStatus('idle'), 2000);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `rooms/${roomId}/calls/current`);
    });

    return () => unsubscribe();
  }, [roomId, role, isOnline, callStatus, addLog, cleanupCallResources]);

  // Hook exports
  return {
    callStatus,
    isMuted,
    callDuration,
    isSimulatedCall,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute
  };
}
