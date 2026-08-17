import SocketService, { SocketMessage } from './socket';
import EncryptionService from './encryption';
import StorageService from './storage';
import AuthService from './auth';

export type ChatMessage = {
  _id: string;
  text: string;
  createdAt: Date;
  user: {
    _id: number;
    name: string;
  };
  contentType?: string;
  tempId?: string;
  decrypted?: boolean;
  replyTo?: {
    _id: string | number;
    user: {
      _id: number;
      name: string;
    };
    text: string;
  };
};

export type Conversation = {
  id: string;
  peerId: number;
  peerName: string;
  peerAvatar: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: number;
  isOnline: boolean;
};

type MessageHandler = (messages: ChatMessage[]) => void;
type ConversationHandler = (conversations: Conversation[]) => void;
type TypingHandler = (peerId: number, isTyping: boolean) => void;

class ChatServiceClass {
  private messageHandlers: MessageHandler[] = [];
  private conversationHandlers: ConversationHandler[] = [];
  private typingHandlers: TypingHandler[] = [];
  private currentPeerId: number | null = null;
  private localMessages: Map<string, ChatMessage[]> = new Map();
  private peerPublicKeys: Map<number, string> = new Map();

  async initialize(userId: number): Promise<void> {
    await AuthService.connectToServer(userId);
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    this.cleanupSocketListeners();
    
    this.unsubscribeMessage = SocketService.onMessage(async (msg: SocketMessage) => {
      try {
        const decrypted = await this.decryptMessage(msg);
        this.messageHandlers.forEach(h => h([decrypted]));
      } catch (err) {
        console.error('[Chat] Decrypt error:', err);
      }
    });

    this.unsubscribeReceipt = SocketService.onReceipt((receipt) => {
      console.log('[Chat] Receipt:', receipt);
    });

    this.unsubscribePresence = SocketService.onPresence((data) => {
      console.log('[Chat] Presence:', data);
    });
  }

  private unsubscribeMessage: (() => void) | null = null;
  private unsubscribeReceipt: (() => void) | null = null;
  private unsubscribePresence: (() => void) | null = null;

  private cleanupSocketListeners(): void {
    this.unsubscribeMessage?.();
    this.unsubscribeReceipt?.();
    this.unsubscribePresence?.();
  }

  private async decryptMessage(msg: SocketMessage): Promise<ChatMessage> {
    let decryptedText = '';
    let decrypted = false;

    try {
      const senderIdStr = String(msg.senderId);
      const peerPublicKey = await EncryptionService.getPeerKey(senderIdStr);
      
      if (peerPublicKey) {
        decryptedText = await EncryptionService.decryptFromPeer(peerPublicKey, msg.encryptedPayload);
        decrypted = true;
      } else {
        decryptedText = '[Encrypted message - key not available]';
      }
    } catch (err) {
      console.error('[Chat] Decrypt failed:', err);
      decryptedText = '[Decryption failed]';
    }

    return {
      _id: msg.messageId,
      text: decryptedText,
      createdAt: new Date(msg.timestamp),
      user: {
        _id: msg.senderId,
        name: msg.senderId === 1 ? 'You' : 'Contact',
      },
      contentType: msg.contentType,
      tempId: msg.tempId,
      decrypted,
    };
  }

  async sendMessage(
    peerId: number,
    text: string,
    replyTo?: {
      _id: string | number;
      user: {
        _id: number;
        name: string;
      };
      text: string;
    }
  ): Promise<{ success: boolean; tempId?: string; error?: string }> {
    if (!text.trim()) return { success: false, error: 'Empty message' };

    try {
      const peerPublicKey = await EncryptionService.getPeerKey(String(peerId));
      if (!peerPublicKey) {
        return { success: false, error: 'No encryption key for peer' };
      }

      const encryptedPayload = await EncryptionService.encryptForPeer(peerPublicKey, text);
      const payloadHash = await EncryptionService.sha256(encryptedPayload);
      const tempId = `temp_${Date.now()}`;

      const result = await SocketService.sendEncryptedMessage(
        peerId,
        encryptedPayload,
        'text',
        tempId,
        1,
        text.length
      );

      if (result.success) {
        const localMsg: ChatMessage = {
          _id: result.messageId || tempId,
          text,
          createdAt: new Date(),
          user: { _id: 1, name: 'You' },
          contentType: 'text',
          tempId,
          decrypted: true,
          replyTo: replyTo
            ? {
                _id: String(replyTo._id),
                user: replyTo.user,
                text: replyTo.text,
              }
            : undefined,
        };

        const key = this.getChatKey(peerId);
        const existing = this.localMessages.get(key) || [];
        this.localMessages.set(key, [...existing, localMsg]);

        await StorageService.addMessage(key, localMsg as any);

        return { success: true, tempId };
      }

      return { success: false, error: result.error || 'Failed to send' };
    } catch (err) {
      console.error('[Chat] Send error:', err);
      return { success: false, error: 'Encryption failed' };
    }
  }

  async loadMessages(peerId: number): Promise<ChatMessage[]> {
    const key = this.getChatKey(peerId);
    
    const localMessages = await StorageService.getMessages(key);
    if (localMessages.length > 0) {
      const parsed = localMessages.map((msg: any) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
      })) as ChatMessage[];
      this.localMessages.set(key, parsed);
      return parsed;
    }

    return this.localMessages.get(key) || [];
  }

  async loadConversations(): Promise<Conversation[]> {
    const chats = await StorageService.getChats();
    return chats.map((chat) => ({
      id: chat.id,
      peerId: parseInt(chat.id.replace(/\D/g, '').slice(0, 8)) || 0,
      peerName: chat.from,
      peerAvatar: chat.img,
      lastMessage: chat.msg,
      lastMessageAt: new Date(chat.date),
      unreadCount: chat.unreadCount || 0,
      isOnline: false,
    }));
  }

  async exchangeKeys(peerId: number, peerPublicKey: string): Promise<void> {
    await EncryptionService.setPeerKey(String(peerId), peerPublicKey);
    this.peerPublicKeys.set(peerId, peerPublicKey);
  }

  async getPeerPublicKey(peerId: number): Promise<string | null> {
    return EncryptionService.getPeerKey(String(peerId));
  }

  async sendImage(peerId: number, imageUri: string): Promise<{ success: boolean; tempId?: string; error?: string }> {
    try {
      const peerPublicKey = await EncryptionService.getPeerKey(String(peerId));
      if (!peerPublicKey) {
        return { success: false, error: 'No encryption key for peer' };
      }

      const encryptedUri = await EncryptionService.encryptForPeer(peerPublicKey, imageUri);
      const payloadHash = await EncryptionService.sha256(encryptedUri);
      const tempId = `temp_img_${Date.now()}`;

      const result = await SocketService.sendEncryptedMessage(
        peerId,
        encryptedUri,
        'image',
        tempId,
        1,
        imageUri.length
      );

      if (result.success) {
        return { success: true, tempId };
      }

      return { success: false, error: result.error };
    } catch (err) {
      console.error('[Chat] Send image error:', err);
      return { success: false, error: 'Failed to send image' };
    }
  }

  sendTyping(peerId: number, isTyping: boolean): void {
    SocketService.sendTyping(peerId, isTyping);
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  onConversationUpdate(handler: ConversationHandler): () => void {
    this.conversationHandlers.push(handler);
    return () => {
      this.conversationHandlers = this.conversationHandlers.filter(h => h !== handler);
    };
  }

  onTyping(handler: TypingHandler): () => void {
    this.typingHandlers.push(handler);
    return () => {
      this.typingHandlers = this.typingHandlers.filter(h => h !== handler);
    };
  }

  private getChatKey(peerId: number): string {
    return `chat_${peerId}`;
  }

  async fetchPendingMessages(): Promise<ChatMessage[]> {
    const pending = await SocketService.fetchPendingMessages();
    const decrypted: ChatMessage[] = [];
    
    for (const msg of pending) {
      try {
        const decryptedMsg = await this.decryptMessage(msg);
        decrypted.push(decryptedMsg);
      } catch (err) {
        console.error('[Chat] Decrypt pending error:', err);
      }
    }

    return decrypted;
  }

  disconnect(): void {
    this.cleanupSocketListeners();
    this.messageHandlers = [];
    this.conversationHandlers = [];
    this.typingHandlers = [];
    SocketService.disconnect();
  }
}

export const ChatService = new ChatServiceClass();
export default ChatService;
