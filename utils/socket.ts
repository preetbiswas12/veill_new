import { io, Socket } from 'socket.io-client';
import EncryptionService from './encryption';
import StorageService from './storage';

const SERVER_URL = 'https://veill.qzz.io';

let socket: Socket | null = null;

export type SocketMessage = {
  messageId: string;
  senderId: number;
  encryptedPayload: string;
  payloadHash: string;
  contentType: string;
  tempId?: string;
  chunkCount?: number;
  totalSize?: number;
  timestamp: number;
};

export type SocketReceipt = {
  messageId: string;
  status: 'delivered' | 'read';
  readBy?: number;
  timestamp: number;
};

export type SocketCallSignal = {
  callId: string;
  fromUserId: number;
  toUserId: number;
  type: 'initiate' | 'offer' | 'answer' | 'ice-candidate' | 'end' | 'call-initiated' | 'incoming-call' | 'call-accepted' | 'call-rejected' | 'call-ended' | 'call-error' | 'call-toggle-mute' | 'call-toggle-video';
  sdp?: any;
  candidate?: any;
  livekitRoom?: string;
  callType?: 'voice' | 'video';
  callerName?: string;
  roomName?: string;
  token?: string;
  e2eeKeyId?: string;
  wsUrl?: string;
  error?: string;
  muted?: boolean;
  videoOff?: boolean;
};

type MessageHandler = (msg: SocketMessage) => void;
type ReceiptHandler = (receipt: SocketReceipt) => void;
type CallHandler = (signal: SocketCallSignal) => void;
type PresenceHandler = (data: { userId: number; online: boolean }) => void;

class SocketServiceClass {
  private messageHandlers: MessageHandler[] = [];
  private receiptHandlers: ReceiptHandler[] = [];
  private callHandlers: CallHandler[] = [];
  private presenceHandlers: PresenceHandler[] = [];
  private currentUserId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  async connect(userId: number, token: string): Promise<Socket> {
    const url = SERVER_URL;

    if (socket?.connected) {
      socket.disconnect();
    }

    this.currentUserId = userId;

    socket = io(url, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
      this.reconnectAttempts = 0;
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.log('[Socket] Connection error:', err.message);
      this.reconnectAttempts++;
    });

    socket.on('new-message', (data: SocketMessage) => {
      this.messageHandlers.forEach(h => h(data));
    });

    socket.on('message-deleted', (data: { messageId: string; deletedBy: number }) => {
      console.log('[Socket] Message deleted:', data.messageId);
    });

    socket.on('read-receipt', (data: SocketReceipt) => {
      this.receiptHandlers.forEach(h => h(data));
    });

    socket.on('messages-read', (data: { chatId: string; lastMessageId: string; readBy: number; timestamp: number }) => {
      console.log('[Socket] Messages read:', data.chatId);
    });

    socket.on('message-delivered', (data: { messageId: string; conversationId?: string; deliveredAt: number; readBy: number }) => {
      console.log('[Socket] Message delivered:', data.messageId);
    });

    socket.on('user-online', (data: { userId: number; online: boolean }) => {
      this.presenceHandlers.forEach(h => h(data));
    });

    socket.on('call-initiated', (data: SocketCallSignal) => {
      this.callHandlers.forEach(h => h(data));
    });

    socket.on('incoming-call', (data: SocketCallSignal) => {
      this.callHandlers.forEach(h => h(data));
    });

    socket.on('call-accepted', (data: SocketCallSignal) => {
      this.callHandlers.forEach(h => h(data));
    });

    socket.on('call-rejected', (data: SocketCallSignal) => {
      this.callHandlers.forEach(h => h(data));
    });

    socket.on('call-ended', (data: { callId: string; reason?: string }) => {
      console.log('[Socket] Call ended:', data.callId);
    });

    socket.on('webrtc-signal', (data: SocketCallSignal) => {
      this.callHandlers.forEach(h => h(data));
    });

    return socket;
  }

  async disconnect(): Promise<void> {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }

  isConnected(): boolean {
    return socket?.connected || false;
  }

  getSocket(): Socket | null {
    return socket;
  }

  getCurrentUserId(): number | null {
    return this.currentUserId;
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  onReceipt(handler: ReceiptHandler): () => void {
    this.receiptHandlers.push(handler);
    return () => {
      this.receiptHandlers = this.receiptHandlers.filter(h => h !== handler);
    };
  }

  onCall(handler: CallHandler): () => void {
    this.callHandlers.push(handler);
    return () => {
      this.callHandlers = this.callHandlers.filter(h => h !== handler);
    };
  }

  onPresence(handler: PresenceHandler): () => void {
    this.presenceHandlers.push(handler);
    return () => {
      this.presenceHandlers = this.presenceHandlers.filter(h => h !== handler);
    };
  }

  async sendEncryptedMessage(
    recipientId: number | string,
    plaintext: string,
    contentType: string = 'text',
    tempId?: string,
    chunkCount = 1,
    totalSize = 0
  ): Promise<{ success: boolean; messageId?: string; status?: string; error?: string }> {
    if (!socket?.connected) {
      return { success: false, error: 'Not connected' };
    }

    try {
      const recipientIdStr = typeof recipientId === 'number' ? String(recipientId) : recipientId;
      const peerPublicKey = await EncryptionService.getPeerKey(recipientIdStr);
      if (!peerPublicKey) {
        return { success: false, error: 'No encryption key for recipient' };
      }

      const encryptedPayload = await EncryptionService.encryptForPeer(peerPublicKey, plaintext);
      const payloadHash = await EncryptionService.sha256(encryptedPayload);

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ success: false, error: 'Timeout waiting for server acknowledgment' });
        }, 10000);

        socket!.emit('send-message', {
          recipientId,
          encryptedPayload,
          payloadHash,
          contentType,
          tempId,
          chunkCount,
          totalSize,
        }, (response: any) => {
          clearTimeout(timeout);
          resolve(response || { success: false, error: 'No response from server' });
        });
      });
    } catch (err) {
      console.error('[Socket] Send message error:', err);
      return { success: false, error: 'Encryption failed' };
    }
  }

  async fetchPendingMessages(): Promise<any[]> {
    if (!socket?.connected) return [];

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve([]);
      }, 10000);

      socket!.emit('get-pending', (response: any) => {
        clearTimeout(timeout);
        resolve(response?.messages || []);
      });
    });
  }

  sendReadReceipt(messageId: string, recipientId: number | string, status: 'delivered' | 'read' = 'read'): void {
    if (!socket?.connected) return;
    socket.emit('read-receipt', {
      messageId,
      recipientId,
      status,
      readBy: this.currentUserId || 0,
      timestamp: Date.now(),
    });
  }

  markChatRead(chatId: string, lastMessageId: string): void {
    if (!socket?.connected) return;
    socket.emit('mark-read', { chatId, lastMessageId });
  }

  deleteMessage(messageId: string, recipientId: number | string): void {
    if (!socket?.connected) return;
    socket.emit('delete-message', { messageId, recipientId });
  }

  sendTyping(recipientId: number | string, isTyping: boolean): void {
    if (!socket?.connected) return;
    socket.emit('typing', { recipientId, isTyping });
  }

  initiateCall(recipientId: number | string, type: 'audio' | 'video' = 'audio'): void {
    if (!socket?.connected) return;
    socket.emit('initiate-call', { recipientId, type });
  }

  acceptCall(callId: string): void {
    if (!socket?.connected) return;
    socket.emit('accept-call', { callId });
  }

  rejectCall(callId: string): void {
    if (!socket?.connected) return;
    socket.emit('reject-call', { callId });
  }

  endCall(callId: string): void {
    if (!socket?.connected) return;
    socket.emit('end-call', { callId });
  }

  sendWebRTCSignal(signal: Omit<SocketCallSignal, 'fromUserId'>): void {
    if (!socket?.connected) return;
    socket.emit('webrtc-signal', {
      ...signal,
      fromUserId: this.currentUserId,
    });
  }
}

export const SocketService = new SocketServiceClass();
export default SocketService;
