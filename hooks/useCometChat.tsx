import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { normalizeCometChatUserId, getCallChannelId, getCallMessageEvent } from '@/lib/cometchat';

export interface CometChatUser {
  id: string;
  name?: string;
  image?: string;
  username?: string;
}

export interface CometChatConversation {
  id: string;
  type: string;
  name?: string;
  image?: string;
  latestMessage?: any;
  unreadCount: number;
}

export interface IncomingCometChatCall {
  channelId: string;
  peerUserId: string;
  video: boolean;
  callerId: string;
}

export type CometChatCallState = 'idle' | 'connecting' | 'joined' | 'ended';

interface CometChatContextType {
  user: CometChatUser | null;
  chatClient: any | null;
  conversations: CometChatConversation[];
  loadingConversations: boolean;
  loading: boolean;
  error: string | null;
  messagesByConversation: Map<string, any[]>;
  loadingMessages: Map<string, boolean>;
  sendTextMessage: (targetId: string, content: string, chatType?: string) => Promise<void>;
  getOrCreateConversation: (targetId: string, chatType?: string) => Promise<CometChatConversation>;
  createGroup: (name: string, memberIds: string[]) => Promise<string>;
  searchUsers: (query: string) => Promise<CometChatUser[]>;
  updateCurrentUserProfile: (fields: { nickName?: string; avatarUrl?: string }) => Promise<void>;
  refreshConversations: () => Promise<void>;
  refreshMessages: (conversationId: string, chatType?: string) => Promise<void>;
  markConversationRead: (conversationId: string, chatType?: string) => Promise<void>;
  sendCallInvite: (peerUserId: string, channelId: string, video: boolean) => Promise<void>;
  startCall: (channelId: string, video: boolean, joinImmediately: boolean) => Promise<void>;
  endCall: () => Promise<void>;
  toggleAudio: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  switchCamera: () => void;
  rtcState: CometChatCallState;
  isJoined: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  localUid: string | null;
  localVideoCanvas: any;
  remoteUids: string[];
  messageReceipts: Map<string, any[]>;
  getMessageReceipts: (messageId: string) => Promise<any[]>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  incomingCall: IncomingCometChatCall | null;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: () => void;
  callError: string | null;
}

const CometChatContext = createContext<CometChatContextType | null>(null);

export const useCometChat = (): CometChatContextType => {
  const context = useContext(CometChatContext);
  if (!context) {
    throw new Error('useCometChat must be used within a CometChatProvider');
  }
  return context;
};

export const getMessageText = (message: any) => {
  if (!message) return '';
  const text = typeof message.getText === 'function' ? message.getText() : message.content || message.text || message.body?.content || '';
  return text || '';
};

interface CometChatProviderProps {
  children: ReactNode;
  user: CometChatUser | null;
}

export const CometChatProvider = ({ children, user }: CometChatProviderProps) => {
  const [currentUser, setCurrentUser] = useState<CometChatUser | null>(user);
  const [conversations, setConversations] = useState<CometChatConversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messagesByConversation, setMessagesByConversation] = useState<Map<string, any[]>>(new Map());
  const [loadingMessages, setLoadingMessages] = useState<Map<string, boolean>>(new Map());

  const [rtcState, setRtcState] = useState<CometChatCallState>('idle');
  const [isJoined, setIsJoined] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [localUid, setLocalUid] = useState<string | null>(null);
  const [remoteUids, setRemoteUids] = useState<string[]>([]);
  const [incomingCall, setIncomingCall] = useState<IncomingCometChatCall | null>(null);
  const [callError, setCallError] = useState<string | null>(null);

  const userRef = useRef<CometChatUser | null>(user);
  useEffect(() => {
    userRef.current = user;
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setLoadingConversations(false);
      setConversations([]);
      setMessagesByConversation(new Map());
      return;
    }

    let cancelled = false;
    const initialize = async () => {
      try {
        const appId = process.env.EXPO_PUBLIC_COMETCHAT_APP_ID;
        const region = process.env.EXPO_PUBLIC_COMETCHAT_REGION || 'us';
        if (!appId) {
          setError('CometChat App ID is not configured');
          return;
        }

        const authKey = process.env.EXPO_PUBLIC_COMETCHAT_API_KEY || process.env.COMETCHAT_API_KEY || '';
        if (!authKey) {
          setError('CometChat Auth Key is not configured');
          return;
        }
        const normalizedUserId = normalizeCometChatUserId(user.id);

        const settings = new (CometChat.AppSettingsBuilder as any)()
          .subscribePresenceForAllUsers()
          .setRegion(region)
          .build();
        await (CometChat.init as any)(appId, settings);

        const existingUser = await (CometChat.getLoggedinUser as any)?.();
        if (!existingUser) {
          const cometUser = new (CometChat as any).User(normalizedUserId);
          cometUser.setName(user.name || normalizedUserId);
          await (CometChat.createUser as any)(cometUser, authKey);
        }

        await (CometChat.login as any)(normalizedUserId, authKey);

        setCurrentUser({ ...user, id: normalizedUserId, username: normalizedUserId });
        await refreshConversations();
        if (!cancelled) setLoading(false);
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Unable to initialize CometChat');
        if (!cancelled) setLoading(false);
      }
    };

    void initialize();

    return () => {
      cancelled = true;
      try {
        (CometChat.logout as any)?.();
      } catch {
        // ignore
      }
    };
  }, [user]);

  const refreshConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const result = await (CometChat as any).getConversations?.();
      const list = result || [];
      const mapped: CometChatConversation[] = list.map((conv: any) => ({
        id: typeof conv.getConversationId === 'function' ? conv.getConversationId() : (conv.conversationId || conv.id || ''),
        type: typeof conv.getConversationType === 'function' ? conv.getConversationType() : (conv.conversationType || 'user'),
        name: typeof conv.getConversationWith === 'function' ? conv.getConversationWith() : (conv.name || ''),
        image: typeof conv.getAvatar === 'function' ? conv.getAvatar() : (conv.image || ''),
        latestMessage: typeof conv.getLastMessage === 'function' ? conv.getLastMessage() : undefined,
        unreadCount: typeof conv.getUnreadMessageCount === 'function' ? conv.getUnreadMessageCount() : (conv.unreadCount || 0),
      }));
      mapped.sort((a, b) => {
        const timeA = a.latestMessage?.getSentAt ? a.latestMessage.getSentAt() : (a.latestMessage?.timestamp || 0);
        const timeB = b.latestMessage?.getSentAt ? b.latestMessage.getSentAt() : (b.latestMessage?.timestamp || 0);
        return (timeB || 0) - (timeA || 0);
      });
      setConversations(mapped);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const refreshMessages = useCallback(async (conversationId: string, chatType?: string) => {
    try {
      setLoadingMessages((prev) => new Map(prev).set(conversationId, true));
      const result = await (CometChat as any).getMessages?.(conversationId);
      const list = result || [];
      setMessagesByConversation((prev) => {
        const next = new Map(prev);
        next.set(conversationId, list);
        return next;
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load messages');
    } finally {
      setLoadingMessages((prev) => new Map(prev).set(conversationId, false));
    }
  }, []);

  const sendTextMessage = useCallback(async (targetId: string, content: string, chatType?: string) => {
    try {
      const message = new (CometChat as any).TextMessage(targetId, content, chatType || 'user');
      await (CometChat.sendMessage as any)(message);
      await refreshMessages(targetId, chatType);
      await refreshConversations();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to send message');
      throw caught;
    }
  }, [refreshMessages, refreshConversations]);

  const getOrCreateConversation = useCallback(async (targetId: string, chatType?: string) => {
    const typeStr = chatType || 'user';
    try {
      const result = await (CometChat.getConversation as any)?.(targetId, typeStr);
      return {
        id: typeof result.getConversationId === 'function' ? result.getConversationId() : (result.conversationId || targetId),
        type: typeof result.getConversationType === 'function' ? result.getConversationType() : (result.conversationType || typeStr),
        name: typeof result.getConversationWith === 'function' ? result.getConversationWith() : (result.name || targetId),
        image: typeof result.getAvatar === 'function' ? result.getAvatar() : (result.image || ''),
        latestMessage: typeof result.getLastMessage === 'function' ? result.getLastMessage() : undefined,
        unreadCount: typeof result.getUnreadMessageCount === 'function' ? result.getUnreadMessageCount() : 0,
      };
    } catch {
      return {
        id: targetId,
        type: typeStr,
        name: targetId,
        image: '',
        latestMessage: undefined,
        unreadCount: 0,
      };
    }
  }, []);

  const createGroup = useCallback(async (name: string, memberIds: string[]) => {
    try {
      const group = await (CometChat.createGroup as any)({ guid: '', name, members: memberIds.map((id) => ({ uid: id })) });
      await refreshConversations();
      return typeof group.getGuid === 'function' ? group.getGuid() : (group.guid || '');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create group');
      throw caught;
    }
  }, [refreshConversations]);

  const searchUsers = useCallback(async (query: string) => {
    try {
      const normalizedQuery = query.trim();
      if (!normalizedQuery) return [];
      const result = await (CometChat as any).getUsers?.(normalizedQuery);
      return result.map((u: any) => ({
        id: typeof u.getUid === 'function' ? u.getUid() : (u.uid || ''),
        name: typeof u.getName === 'function' ? u.getName() : (u.name || ''),
        image: typeof u.getAvatar === 'function' ? u.getAvatar() : (u.avatar || ''),
        username: typeof u.getUid === 'function' ? u.getUid() : (u.uid || ''),
      }));
    } catch {
      return [];
    }
  }, []);

  const updateCurrentUserProfile = useCallback(async (fields: { nickName?: string; avatarUrl?: string }) => {
    try {
      await (CometChat as any).updateUserInfo?.({ uid: currentUser?.id || '', name: fields.nickName || currentUser?.name, avatar: fields.avatarUrl || currentUser?.image });
      setCurrentUser((prev) => prev ? { ...prev, name: fields.nickName || prev.name, image: fields.avatarUrl || prev.image } : prev);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update profile');
      throw caught;
    }
  }, [currentUser]);

  const markConversationRead = useCallback(async (conversationId: string, chatType?: string) => {
    try {
      await (CometChat.markConversationAsRead as any)?.(conversationId, chatType || 'user');
      await refreshConversations();
    } catch {
      // ignore
    }
  }, [refreshConversations]);

  const [messageReceipts, setMessageReceipts] = useState<Map<string, any[]>>(new Map());

  const getMessageReceipts = useCallback(async (messageId: string) => {
    try {
      const receipts = await (CometChat as any).getMessageReceipts?.(messageId);
      setMessageReceipts((prev) => {
        const next = new Map(prev);
        next.set(messageId, receipts || []);
        return next;
      });
      return receipts || [];
    } catch {
      return [];
    }
  }, []);

  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      await (CometChat as any).markAsRead?.(messageId);
    } catch {
      // ignore
    }
  }, []);

  const startCall = useCallback(async (channelId: string, video: boolean, joinImmediately: boolean) => {
    try {
      setCallError(null);
      setRtcState('connecting');
      setIsJoined(false);
      setRemoteUids([]);
      setVideoEnabled(video);

      setLocalUid('local');
      setRemoteUids(['remote']);

      if (joinImmediately) {
        setRtcState('joined');
        setIsJoined(true);
      } else {
        setRtcState('connecting');
      }
    } catch (caught) {
      setCallError(caught instanceof Error ? caught.message : 'Call failed');
      setRtcState('idle');
    }
  }, []);

  const endCall = useCallback(async () => {
    setRtcState('idle');
    setIsJoined(false);
    setAudioEnabled(true);
    setVideoEnabled(false);
    setLocalUid(null);
    setRemoteUids([]);
    setIncomingCall(null);
    setCallError(null);
  }, []);

  const toggleAudio = useCallback(async () => {
    setAudioEnabled((prev) => !prev);
  }, []);

  const toggleVideo = useCallback(async () => {
    setVideoEnabled((prev) => !prev);
  }, []);

  const switchCamera = useCallback(() => {
    // Stub for camera switch in CometChat SDK
  }, []);

  const sendCallInvite = useCallback(async (peerUserId: string, channelId: string, video: boolean) => {
    try {
      const message = new (CometChat as any).CustomMessage(peerUserId, getCallMessageEvent(), {
        params: { channelId, video: String(video), callerId: currentUser?.id || '', callerUid: peerUserId },
        isOnline: true,
      });
      await (CometChat.sendCustomMessage as any)(message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to send call invite');
    }
  }, [currentUser]);

  const acceptIncomingCall = useCallback(async () => {
    const call = incomingCall;
    if (!call) return;
    setIncomingCall(null);
    await startCall(call.channelId, call.video, true);
  }, [incomingCall, startCall]);

  const rejectIncomingCall = useCallback(() => {
    setIncomingCall(null);
    setRtcState('idle');
  }, []);

  const value = useMemo<CometChatContextType>(
    () => ({
      user: currentUser,
      chatClient: null,
      conversations,
      loadingConversations,
      loading,
      error,
      messagesByConversation,
      loadingMessages,
      sendTextMessage,
      getOrCreateConversation,
      createGroup,
      searchUsers,
      updateCurrentUserProfile,
      refreshConversations,
      refreshMessages,
      markConversationRead,
      sendCallInvite,
      startCall,
      endCall,
      toggleAudio,
      toggleVideo,
      switchCamera,
      rtcState,
      isJoined,
      audioEnabled,
      videoEnabled,
      localUid,
      localVideoCanvas: { uid: 0 },
      messageReceipts,
      getMessageReceipts,
      markMessageAsRead,
      remoteUids,
      incomingCall,
      acceptIncomingCall,
      rejectIncomingCall,
      callError,
    }),
    [
      currentUser,
      conversations,
      loadingConversations,
      loading,
      error,
      messagesByConversation,
      loadingMessages,
      sendTextMessage,
      getOrCreateConversation,
      createGroup,
      searchUsers,
      updateCurrentUserProfile,
      refreshConversations,
      refreshMessages,
      markConversationRead,
      sendCallInvite,
      startCall,
      endCall,
      toggleAudio,
      toggleVideo,
      rtcState,
      isJoined,
      audioEnabled,
      videoEnabled,
      localUid,
      messageReceipts,
      getMessageReceipts,
      markMessageAsRead,
      remoteUids,
      incomingCall,
      acceptIncomingCall,
      rejectIncomingCall,
      callError,
    ]
  );

  return <CometChatContext.Provider value={value}>{children}</CometChatContext.Provider>;
};

