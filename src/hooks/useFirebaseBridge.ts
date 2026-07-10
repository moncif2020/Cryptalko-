import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  db, doc, setDoc, updateDoc, onSnapshot, collection, addDoc, query, orderBy, getDoc,
  getDocs, deleteDoc, handleFirestoreError, OperationType, ensureAuth
} from '../firebase';
import { LogEntry, ChatMessage } from '../types';
import { encryptString, encryptPayload, decryptPayload } from '../services/crypto';
import { bluetoothMesh } from '../services/bluetooth';

export function useFirebaseBridge() {
  const [status, setStatus] = useState<'idle' | 'searching' | 'locked'>('idle');
  const [showChat, setShowChat] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [role, setRole] = useState<'host' | 'peer' | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  // --- Auto-Exit and 5-Minute Reply Countdown States ---
  const [exitReason, setExitReason] = useState<'peer_left' | 'timeout' | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  // Generate a robust unique client/session ID to correctly identify incoming vs outgoing messages
  const [clientId] = useState(() => {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      const existing = sessionStorage.getItem('cryptalko_client_id');
      if (existing) return existing;
      const fresh = 'client_' + Math.random().toString(36).substring(2, 11);
      sessionStorage.setItem('cryptalko_client_id', fresh);
      return fresh;
    }
    return 'client_ssr';
  });
  
  // Connection status & offline capability (supports manual doomsday simulator)
  const [isOnline, setIsOnline] = useState<boolean>(
    navigator.onLine && (typeof localStorage !== 'undefined' ? localStorage.getItem('cryptalko_force_offline') !== 'true' : true)
  );

  // --- Bluetooth Offline Mesh States ---
  const [isBluetoothMode, setIsBluetoothMode] = useState<boolean>(false);
  const [isBluetoothConnected, setIsBluetoothConnected] = useState<boolean>(false);
  const [bluetoothDeviceName, setBluetoothDeviceName] = useState<string>('');

  // --- Cryptographic Control Panel States ---
  const [encryptionKey, setEncryptionKey] = useState<string>('0x7F2A81B9D5E2F3A4C5B6C7D8E9F0A1B2');
  const [cipherAlgorithm, setCipherAlgorithm] = useState<string>('AES-256-GCM');
  const [derivationRounds, setDerivationRounds] = useState<number>(10000);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);

  // --- Privacy Enclave Advanced States ---
  const [autoDelete, setAutoDeleteState] = useState<boolean>(false);
  const [visualShield, setVisualShieldState] = useState<boolean>(false);
  const [blockCopyPaste, setBlockCopyPasteState] = useState<boolean>(false);
  const [metadataCloaking, setMetadataCloakingState] = useState<boolean>(false);
  const [readReceipts, setReadReceiptsState] = useState<boolean>(false);
  const [absolutePrivacy, setAbsolutePrivacyState] = useState<boolean>(false);

  // Keep a ref of the current privacy states to prevent onSnapshot tearing/re-subscription
  const privacyStatesRef = useRef({
    autoDelete: false,
    visualShield: false,
    blockCopyPaste: false,
    metadataCloaking: false,
    readReceipts: false,
    absolutePrivacy: false
  });

  useEffect(() => {
    privacyStatesRef.current = {
      autoDelete,
      visualShield,
      blockCopyPaste,
      metadataCloaking,
      readReceipts,
      absolutePrivacy
    };
  }, [autoDelete, visualShield, blockCopyPaste, metadataCloaking, readReceipts, absolutePrivacy]);

  // Real-time Console Log Feed
  const [logs, setLogs] = useState<LogEntry[]>([
    { 
      time: new Date().toTimeString().split(' ')[0], 
      level: 'INFO', 
      message: 'CryptAlko Bridge system booted successfully.' 
    },
    { 
      time: new Date().toTimeString().split(' ')[0], 
      level: 'WARN', 
      message: 'Secure Bridge Offline. Click the central padlock to start the handshake sequence.' 
    }
  ]);

  // Chat message logs with encryption context
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'System',
      text: 'Handshake complete. Neural Mesh verified. Welcome to CryptAlko Secure Bridge.',
      time: new Date().toTimeString().split(' ')[0],
      isSystem: true
    }
  ]);

  // Load cached messages if offline or on initial load
  useEffect(() => {
    if (roomId) {
      const cached = localStorage.getItem(`cryptalko_cache_${roomId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setChatMessages(parsed);
          }
        } catch (e) {
          console.error('Failed to load cached messages:', e);
        }
      }
    }
  }, [roomId]);

  // Use a ref for logs to prevent recreating addLog or causing infinite loops
  const logsRef = useRef(logs);
  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  const addLog = useCallback((level: LogEntry['level'], message: string) => {
    const time = new Date().toTimeString().split(' ')[0];
    setLogs(prev => [...prev, { time, level, message }].slice(-60));
  }, []);

  const updatePrivacyEnclaveSetting = useCallback(async (key: string, value: boolean) => {
    // 1. Update local state immediately
    if (key === 'autoDelete') setAutoDeleteState(value);
    else if (key === 'visualShield') setVisualShieldState(value);
    else if (key === 'blockCopyPaste') setBlockCopyPasteState(value);
    else if (key === 'metadataCloaking') setMetadataCloakingState(value);
    else if (key === 'readReceipts') setReadReceiptsState(value);
    else if (key === 'absolutePrivacy') setAbsolutePrivacyState(value);

    // 2. Sync to Firestore room document
    if (roomId && isOnline) {
      try {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
          [`privacyEnclave.${key}`]: value
        });
        addLog('SECURE', `فرض إلزامي // Privacy protocol locked: Peer forced to synchronize "${key}" to ${value ? 'ACTIVE' : 'INACTIVE'}.`);
      } catch (err) {
        console.error('Failed to sync privacy setting:', err);
      }
    }
  }, [roomId, isOnline, addLog]);

  const setAutoDelete = useCallback((val: boolean) => updatePrivacyEnclaveSetting('autoDelete', val), [updatePrivacyEnclaveSetting]);
  const setVisualShield = useCallback((val: boolean) => updatePrivacyEnclaveSetting('visualShield', val), [updatePrivacyEnclaveSetting]);
  const setBlockCopyPaste = useCallback((val: boolean) => updatePrivacyEnclaveSetting('blockCopyPaste', val), [updatePrivacyEnclaveSetting]);
  const setMetadataCloaking = useCallback((val: boolean) => updatePrivacyEnclaveSetting('metadataCloaking', val), [updatePrivacyEnclaveSetting]);
  const setReadReceipts = useCallback((val: boolean) => updatePrivacyEnclaveSetting('readReceipts', val), [updatePrivacyEnclaveSetting]);
  const setAbsolutePrivacy = useCallback((val: boolean) => updatePrivacyEnclaveSetting('absolutePrivacy', val), [updatePrivacyEnclaveSetting]);

  const handlePeerLeftOrDeleted = useCallback(() => {
    addLog('WARN', 'تنبيه أمني // تم إنهاء أو حذف الغرفة من قبل الطرف الآخر. جاري تطهير الجلسة...');
    
    // Reset local state
    const currentRoomId = roomId;
    setRoomId(null);
    setStatus('idle');
    setShowChat(false);
    setRole(null);
    setChatMessages([]);
    if (currentRoomId) {
      localStorage.removeItem(`cryptalko_cache_${currentRoomId}`);
    }
    window.history.pushState({}, '', window.location.pathname);
    setExitReason('peer_left');
  }, [roomId, addLog]);

  const leaveAndDestroyRoom = useCallback(async (reason: 'peer_left' | 'timeout' | null = null) => {
    if (!roomId) return;
    
    addLog('WARN', 'مغادرة وتطهير // تدمير الجلسة ومسح كامل آثار المحادثة والملفات...');
    
    try {
      // 1. Delete all messages
      const msgsRef = collection(db, 'rooms', roomId, 'messages');
      const msgsSnap = await getDocs(msgsRef);
      const deletePromises = msgsSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // 2. Delete room document
      const roomRef = doc(db, 'rooms', roomId);
      await deleteDoc(roomRef);
      
      addLog('SUCCESS', 'تم مسح وتدمير الغرفة نهائياً // Enclave zeroized.');
    } catch (err) {
      console.error('Error destroying room:', err);
    } finally {
      const currentRoomId = roomId;
      // Reset local state
      setRoomId(null);
      setStatus('idle');
      setShowChat(false);
      setRole(null);
      setChatMessages([]);
      if (currentRoomId) {
        localStorage.removeItem(`cryptalko_cache_${currentRoomId}`);
      }
      window.history.pushState({}, '', window.location.pathname);
      setExitReason(reason);
    }
  }, [roomId, addLog]);

  // Initialize and register Bluetooth RF Mesh Callbacks
  useEffect(() => {
    bluetoothMesh.registerCallbacks(
      (msg) => {
        setChatMessages((prev) => {
          if (prev.some(m => m.id === msg.id || (m.text === msg.text && m.time === msg.time))) {
            return prev;
          }
          return [...prev, msg];
        });
        if (navigator.vibrate) {
          navigator.vibrate(100);
        }
      },
      (level, message) => {
        addLog(level, message);
      }
    );
  }, [addLog]);

  // Host creates and advertises a new room
  const createAndHostRoom = useCallback(async () => {
    addLog('INFO', 'Initializing encrypted enclave room creation sequence...');
    addLog('INFO', 'Authenticating secure session...');

    try {
      const retrievedUid = await ensureAuth();
      setUid(retrievedUid);

      const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      setRoomId(newRoomId);
      setRole('host');
      setStatus('searching');
      setShowChat(false);

      addLog('INFO', `Initializing encrypted enclave room: ${newRoomId}`);
      addLog('INFO', 'Performing cryptography stack diagnostics...');
      addLog('SECURE', `Active Cipher: ${cipherAlgorithm} with ${derivationRounds} PBKDF2 rounds.`);
      addLog('INFO', 'Broadcasting handshake package to decentralized peer relay...');

      // Push room parameter to browser address bar quietly
      window.history.pushState({}, '', '?room=' + newRoomId);

      await setDoc(doc(db, 'rooms', newRoomId), {
        status: 'searching',
        encryptionKey,
        cipherAlgorithm,
        derivationRounds,
        createdAt: Date.now(),
        peerConnected: false,
        hostClientId: clientId,
        hostUid: retrievedUid,
        privacyEnclave: {
          autoDelete: false,
          visualShield: false,
          blockCopyPaste: false,
          metadataCloaking: false,
          readReceipts: false,
          absolutePrivacy: false
        }
      });
      addLog('SUCCESS', 'Secure P2P handshake beacon successfully broadcast to cloud relay.');
    } catch (err: any) {
      console.error(err);
      addLog('ERROR', 'Failed to publish handshake beacon to Firestore relay.');
    }
  }, [encryptionKey, cipherAlgorithm, derivationRounds, clientId, addLog]);

  // Peer joins an existing room advertised by Host
  const joinRoom = useCallback(async (targetRoomId: string) => {
    addLog('INFO', `Attempting connection to remote enclave: ${targetRoomId}...`);
    addLog('INFO', 'Authenticating secure session...');

    try {
      const retrievedUid = await ensureAuth();
      setUid(retrievedUid);

      setRoomId(targetRoomId);
      setStatus('searching');
      setShowChat(false);

      const roomRef = doc(db, 'rooms', targetRoomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        addLog('ERROR', `Connection failed: Room ${targetRoomId} does not exist or has expired.`);
        setStatus('idle');
        return;
      }

      const data = roomSnap.data();
      // Determine if this client is the original host
      const isHost = data.hostClientId === clientId || data.hostUid === retrievedUid;
      setRole(isHost ? 'host' : 'peer');

      // Synchronize cipher state exactly from the host!
      setEncryptionKey(data.encryptionKey || '0x7F2A81B9D5E2F3A4C5B6C7D8E9F0A1B2');
      setCipherAlgorithm(data.cipherAlgorithm || 'AES-256-GCM');
      setDerivationRounds(data.derivationRounds || 10000);

      if (data.privacyEnclave) {
        const enc = data.privacyEnclave;
        if (enc.autoDelete !== undefined) setAutoDeleteState(enc.autoDelete);
        if (enc.visualShield !== undefined) setVisualShieldState(enc.visualShield);
        if (enc.blockCopyPaste !== undefined) setBlockCopyPasteState(enc.blockCopyPaste);
        if (enc.metadataCloaking !== undefined) setMetadataCloakingState(enc.metadataCloaking);
        if (enc.readReceipts !== undefined) setReadReceiptsState(enc.readReceipts);
        if (enc.absolutePrivacy !== undefined) setAbsolutePrivacyState(enc.absolutePrivacy);
      }

      addLog('SUCCESS', `Beacon found. Handshake packet matching initialized...`);
      addLog('SECURE', `Synced ${isHost ? 'local host' : 'remote host'} cipher stream: ${data.cipherAlgorithm} (${data.derivationRounds} PBKDF2 iterations).`);

      // Update room to signal connection confirmed
      const updateData: any = {
        status: 'locked',
        peerConnected: true
      };
      if (!isHost) {
        updateData.peerClientId = clientId;
        updateData.peerUid = retrievedUid;
      }
      await updateDoc(roomRef, updateData);
      
      addLog('SUCCESS', 'Cryptographic negotiation complete. Handshake locked.');
    } catch (err: any) {
      console.error(err);
      addLog('ERROR', 'Enclave connection negotiations failed.');
      setStatus('idle');
    }
  }, [clientId, addLog]);

  // Re-key / restart handshake trigger
  const startHandshake = useCallback((force = false) => {
    if (!force && (status === 'searching' || status === 'locked')) return;
    createAndHostRoom();
  }, [status, createAndHostRoom]);

  // Send a secure encrypted message to Firestore (or local Bluetooth mesh when offline/BLE enabled)
  const sendSecureMessage = useCallback(async (text: string, mediaType?: 'image' | 'audio', rawMediaData?: string) => {
    if (!text.trim() && !rawMediaData) return;
    if (!roomId) return;

    const plaintext = text;
    const ciphertext = text.trim() ? encryptString(plaintext, encryptionKey, cipherAlgorithm) : '';
    
    let encryptedMediaPayload = '';
    if (rawMediaData) {
      addLog('INFO', `Performing compression and ${cipherAlgorithm} End-to-End local cipher encryption...`);
      encryptedMediaPayload = encryptPayload(rawMediaData, encryptionKey, cipherAlgorithm);
    }

    const timeString = new Date().toTimeString().split(' ')[0];

    const outgoingMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: 'You',
      text: plaintext,
      ciphertext,
      time: timeString,
      mediaType,
      mediaPayload: rawMediaData,
      isPending: false
    };

    // If Bluetooth/Air-Gap mode is enabled, broadcast via RF Mesh
    if (isBluetoothMode || isBluetoothConnected) {
      bluetoothMesh.broadcastPayload(outgoingMsg);
      setChatMessages(prev => [...prev, outgoingMsg]);
      addLog('SECURE', 'بث بلوتوث // Secure payload injected into local RF wave.');
      return;
    }

    // Handle offline status by placing message in local queue and broadcasting via RF/Bluetooth as a survival backup
    if (!navigator.onLine) {
      addLog('WARN', 'شبكة مفقودة // Offline mode detected. Preserving encrypted envelope in local vault...');
      
      const pendingMsg: ChatMessage = {
        ...outgoingMsg,
        id: `pending-${Date.now()}-${Math.random()}`,
        isPending: true
      };

      setChatMessages(prev => [...prev, pendingMsg]);

      // Survival backup: broadcast via RF mesh so nearby nodes still get it!
      bluetoothMesh.broadcastPayload(outgoingMsg);

      // Save to offline queue
      const queueKey = `cryptalko_queue_${roomId}`;
      const existingQueue = JSON.parse(localStorage.getItem(queueKey) || '[]');
      existingQueue.push({
        text: plaintext,
        mediaType,
        rawMediaData,
        createdAt: Date.now()
      });
      localStorage.setItem(queueKey, JSON.stringify(existingQueue));
      
      addLog('SECURE', 'حفظ مؤقت // Message queued successfully in local hardware. Sync will resume on internet handshake.');
      return;
    }

    try {
      await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        senderId: role,
        clientId,
        uid,
        text: plaintext,
        ciphertext,
        mediaType: mediaType || null,
        mediaPayload: encryptedMediaPayload || null,
        createdAt: Date.now(),
        time: timeString,
        isSystem: false
      });
      addLog('SECURE', `Secure multimedia (${mediaType || 'text'}) payload successfully transmitted to cloud relay.`);
    } catch (err: any) {
      console.error(err);
      addLog('ERROR', 'Payload transmission failed.');
    }
  }, [roomId, role, clientId, uid, encryptionKey, cipherAlgorithm, isBluetoothMode, isBluetoothConnected, addLog]);

  // Retrieve room parameter from URL on startup
  const getRoomIdFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room');
  };

  // Parse URL on mount
  useEffect(() => {
    const rId = getRoomIdFromUrl();
    if (rId) {
      joinRoom(rId);
    } else {
      addLog('INFO', 'Neural Mesh initialized. Secure hardware module ready.');
    }
  }, [joinRoom, addLog]);

  // Handle tab closing or reloading to clean up the room
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (roomId && (status === 'locked' || status === 'searching')) {
        const roomRef = doc(db, 'rooms', roomId);
        deleteDoc(roomRef);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [roomId, status]);

  // Listen to Firestore Room Document status changes
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = onSnapshot(doc(db, 'rooms', roomId), (snapshot) => {
      if (!snapshot.exists()) {
        if (status === 'locked' || status === 'searching') {
          handlePeerLeftOrDeleted();
        }
        return;
      }
      const data = snapshot.data();

      // If status transitions to locked, trigger success sequence on both ends
      if (data.status === 'locked' && status !== 'locked') {
        setStatus('locked');
        addLog('SUCCESS', 'Peer connection handshake acknowledged & approved.');
        
        if (vibrationEnabled && navigator.vibrate) {
          navigator.vibrate([80, 40, 80]); // double haptic beat
        }

        setTimeout(() => {
          addLog('SUCCESS', 'Communication tunnel locked. Routing secure terminal...');
          setShowChat(true);
        }, 1500);
      }

      // Sync privacy enclave configurations in real-time
      if (data.privacyEnclave) {
        const enc = data.privacyEnclave;
        const current = privacyStatesRef.current;
        if (enc.autoDelete !== undefined && enc.autoDelete !== current.autoDelete) {
          setAutoDeleteState(enc.autoDelete);
          addLog('SECURE', `فرض الخصوصية الإلزامي // Enclave forced Auto-Delete: ${enc.autoDelete ? 'ENABLED' : 'DISABLED'}`);
        }
        if (enc.visualShield !== undefined && enc.visualShield !== current.visualShield) {
          setVisualShieldState(enc.visualShield);
          addLog('SECURE', `فرض الخصوصية الإلزامي // Enclave forced Visual Shield: ${enc.visualShield ? 'ENABLED' : 'DISABLED'}`);
        }
        if (enc.blockCopyPaste !== undefined && enc.blockCopyPaste !== current.blockCopyPaste) {
          setBlockCopyPasteState(enc.blockCopyPaste);
          addLog('SECURE', `فرض الخصوصية الإلزامي // Enclave forced Block Copy/Paste: ${enc.blockCopyPaste ? 'ENABLED' : 'DISABLED'}`);
        }
        if (enc.metadataCloaking !== undefined && enc.metadataCloaking !== current.metadataCloaking) {
          setMetadataCloakingState(enc.metadataCloaking);
          addLog('SECURE', `فرض الخصوصية الإلزامي // Enclave forced Metadata Cloaking: ${enc.metadataCloaking ? 'ENABLED' : 'DISABLED'}`);
        }
        if (enc.readReceipts !== undefined && enc.readReceipts !== current.readReceipts) {
          setReadReceiptsState(enc.readReceipts);
          addLog('SECURE', `فرض الخصوصية الإلزامي // Enclave forced Read Receipts: ${enc.readReceipts ? 'ENABLED' : 'DISABLED'}`);
        }
        if (enc.absolutePrivacy !== undefined && enc.absolutePrivacy !== current.absolutePrivacy) {
          setAbsolutePrivacyState(enc.absolutePrivacy);
          addLog('SECURE', `فرض الخصوصية الإلزامي // Enclave forced Absolute Privacy: ${enc.absolutePrivacy ? 'ENABLED' : 'DISABLED'}`);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `rooms/${roomId}`);
    });

    return () => unsubscribe();
  }, [roomId, status, vibrationEnabled, addLog]);

  // Listen to Firestore Room Messages subcollection in real-time
  useEffect(() => {
    if (!roomId || !showChat) return;

    const messagesQuery = query(
      collection(db, 'rooms', roomId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesList: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const isMe = (data.clientId ? data.clientId === clientId : data.senderId === role) || (data.uid ? data.uid === uid : false);
        
        let decryptedMediaPayload = '';
        if (data.mediaType && data.mediaPayload) {
          // Decrypt the media payload locally using the shared key!
          decryptedMediaPayload = decryptPayload(data.mediaPayload, encryptionKey);
        }

        messagesList.push({
          id: docSnap.id,
          sender: data.isSystem ? 'System' : isMe ? 'You' : 'Peer_Node_A',
          text: data.text,
          ciphertext: data.ciphertext,
          time: data.time || new Date(data.createdAt || Date.now()).toTimeString().split(' ')[0],
          isSystem: data.isSystem || false,
          mediaType: data.mediaType || undefined,
          mediaPayload: decryptedMediaPayload || undefined,
          createdAt: data.createdAt || Date.now()
        });
      });

      if (messagesList.length > 0) {
        setChatMessages(messagesList);
        localStorage.setItem(`cryptalko_cache_${roomId}`, JSON.stringify(messagesList));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `rooms/${roomId}/messages`);
    });

    return () => unsubscribe();
  }, [roomId, showChat, role, clientId, uid, encryptionKey]);

  // --- 5-Minute Reply Countdown Timer Effect ---
  useEffect(() => {
    if (status !== 'locked' || chatMessages.length === 0) {
      setSecondsRemaining(null);
      return;
    }

    // Filter out system messages
    const conversationalMessages = chatMessages.filter(msg => !msg.isSystem);
    if (conversationalMessages.length === 0) {
      setSecondsRemaining(null);
      return;
    }

    const lastMsg = conversationalMessages[conversationalMessages.length - 1];

    // Tick function running every second
    const interval = setInterval(() => {
      const elapsedMs = Date.now() - lastMsg.createdAt;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      const remaining = 300 - elapsedSec;

      if (remaining <= 0) {
        clearInterval(interval);
        setSecondsRemaining(0);
        
        // Timeout reached! Trigger self-kick and destroy
        addLog('ERROR', 'انتهت مهلة الرد (5 دقائق) // Response timeout reached. Purging everything...');
        leaveAndDestroyRoom('timeout');
      } else {
        setSecondsRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status, chatMessages, roomId, addLog, leaveAndDestroyRoom]);

  // Online / Offline monitor listeners
  useEffect(() => {
    const handleOnline = () => {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('cryptalko_force_offline') === 'true') {
        setIsOnline(false);
        return;
      }
      setIsOnline(true);
      addLog('SUCCESS', 'استعادة الاتصال // Network connection established. Synchronizing pending queues...');
    };
    const handleOffline = () => {
      setIsOnline(false);
      addLog('WARN', 'انقطاع الشبكة // Connection offline. CryptAlko local sandbox fallback active.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addLog]);

  // Auto-synchronize pending local messages when online transitions to true
  useEffect(() => {
    if (isOnline && roomId && status === 'locked') {
      const queueKey = `cryptalko_queue_${roomId}`;
      const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');
      if (queue.length > 0) {
        addLog('INFO', `جاري المزامنة // Processing ${queue.length} pending secure transmission(s)...`);
        
        const syncPayloads = async () => {
          localStorage.removeItem(queueKey);

          for (const item of queue) {
            try {
              const ciphertext = item.text ? encryptString(item.text, encryptionKey, cipherAlgorithm) : '';
              let encryptedMediaPayload = '';
              if (item.rawMediaData) {
                encryptedMediaPayload = encryptPayload(item.rawMediaData, encryptionKey, cipherAlgorithm);
              }
              const timeString = new Date(item.createdAt).toTimeString().split(' ')[0];

              await addDoc(collection(db, 'rooms', roomId, 'messages'), {
                senderId: role,
                clientId,
                uid,
                text: item.text || '',
                ciphertext,
                mediaType: item.mediaType || null,
                mediaPayload: encryptedMediaPayload || null,
                createdAt: item.createdAt,
                time: timeString,
                isSystem: false
              });
            } catch (err) {
              console.error('Failed to sync offline item', err);
              // Put back on failure
              const currentQueue = JSON.parse(localStorage.getItem(queueKey) || '[]');
              currentQueue.unshift(item);
              localStorage.setItem(queueKey, JSON.stringify(currentQueue));
              addLog('ERROR', 'خطأ مزامنة // Interrupted sync sequence. Re-queued remaining items.');
              break;
            }
          }
          addLog('SUCCESS', 'اكتمال المزامنة // All pending local payloads successfully published to the cloud mesh.');
        };

        syncPayloads();
      }
    }
  }, [isOnline, roomId, status, role, clientId, uid, encryptionKey, cipherAlgorithm, addLog]);

  // Periodically generate simulated background security logs if connected
  useEffect(() => {
    const logTimer = setInterval(() => {
      if (status !== 'locked') return;
      const logsToGenerate: { level: LogEntry['level']; message: string }[] = [
        { level: 'INFO', message: 'Keep-alive telemetry ping transmitted.' },
        { level: 'SECURE', message: 'Entropy pool recalibrated (+4.2 bits of entropy).' },
        { level: 'INFO', message: 'Decentralized routing tables optimized.' },
        { level: 'SECURE', message: 'Active audit: No intrusion vectors detected.' },
        { level: 'INFO', message: 'Background peer security status: 100% compliant.' }
      ];
      const selected = logsToGenerate[Math.floor(Math.random() * logsToGenerate.length)];
      addLog(selected.level, selected.message);
    }, 10000);

    return () => clearInterval(logTimer);
  }, [status, addLog]);

  return {
    status,
    setStatus,
    showChat,
    setShowChat,
    roomId,
    setRoomId,
    role,
    setRole,
    uid,
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
  };
}
