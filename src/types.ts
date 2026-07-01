export interface LogEntry {
  time: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'SECURE';
  message: string;
}

export interface ChatMessage {
  id: string;
  sender: 'System' | 'You' | 'Peer_Node_A';
  text: string;
  ciphertext?: string;
  time: string;
  isSystem?: boolean;
  mediaType?: 'image' | 'audio';
  mediaPayload?: string;
  isPending?: boolean;
  createdAt?: number;
}
