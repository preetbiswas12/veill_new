import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { File as FsFile } from 'expo-file-system';

import { STORIES_GUID, normalizeCometChatUserId } from '@/lib/cometchat';
import { registerDeviceForPush, unregisterDeviceFromPush } from '@/lib/push';
import {
  SECURE_CHUNK,
  SECURE_START,
  SECURE_TEXT,
  conversationKey,
  customPayloadOf,
  ingestSecuredMessage,
  isSecuredCarrier,
  isSecureText,
  openTextEnvelope,
  participantTagFor,
  prepareTransfer,
  registerSecureKeyResolver,
  registerSealedTextResolver,
  sealText,
  secureTextOf,
} from '@/lib/secure-media';
import type { SecuredKind, TextEnvelope } from '@/lib/secure-media';

export interface CometChatUser {
  id: string;
  name?: string;
  image?: string;
  username?: string;
}

export interface CometChatGroup {
  id: string;
  name: string;
  image?: string;
  memberCount: number;
  /** The shared stories group backs the Updates tab and is not a real group. */
  isStoriesBacking?: boolean;
}

export interface CometChatConversation {
  id: string;
  type: string;
  name?: string;
  image?: string;
  latestMessage?: any;
  /** Epoch milliseconds of the last message, when known. */
  timestamp?: number;
  unreadCount: number;
}

export interface IncomingCometChatCall {
  sessionId: string;
  peerUserId: string;
  video: boolean;
  callerId: string;
  callerName?: string;
  callerImage?: string;
}

export interface ActiveCometChatCall {
  sessionId: string;
  peerId: string;
  video: boolean;
  direction: 'incoming' | 'outgoing';
}

export type CometChatCallState = 'idle' | 'connecting' | 'joined' | 'ended';

export interface OutgoingMedia {
  uri: string;
  name: string;
  kind: 'image' | 'video' | 'file';
  mimeType?: string;
  /** File size in bytes, when known. */
  size?: number;
}

export interface CallHistoryEntry {
  id: string;
  peerId: string;
  peerName?: string;
  peerImage?: string;
  video: boolean;
  /** True when the current user placed the call. */
  outgoing: boolean;
  /** Raw CometChat call action (initiated / answered / rejected / …). */
  action: string;
  timestamp: number;
}

export interface MessageAttachment {
  url: string;
  name: string;
  mimeType: string;
}

export interface MessageReaction {
  reaction: string;
  count: number;
  mine: boolean;
}

export interface StoryAttachment {
  /**
   * The transfer id in the reassembly store - a story's bytes travel through
   * the encrypted carrier (`ve:start`/`ve:chunk` custom messages), never as a
   * plaintext CDN file, so there is no `url` on the payload. The viewer
   * decrypts through `useSecureMedia(id)`.
   */
  id: string;
  type: 'image' | 'video';
  at: number;
}

export interface StoryAuthor {
  senderId: string;
  name?: string;
  image?: string;
  mine: boolean;
  /** Oldest first. */
  items: StoryAttachment[];
}

interface CometChatContextType {
  user: CometChatUser | null;
  chatClient: any | null;
  /** True once the CometChat session is live and listeners are registered. */
  sessionReady: boolean;
  /** Sign in with a CometChat UID (no password); remembered on the device. */
  loginAs: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  conversations: CometChatConversation[];
  loadingConversations: boolean;
  loading: boolean;
  error: string | null;
  messagesByConversation: Map<string, any[]>;
  loadingMessages: Map<string, boolean>;
  sendTextMessage: (targetId: string, content: string, chatType?: string) => Promise<void>;
  sendMediaMessage: (targetId: string, media: OutgoingMedia, chatType?: string) => Promise<void>;
  /**
   * Sends media through the private pipeline (lib/secure-media.ts): encrypted,
   * chunked, verified. `onProgress` ticks as each chunk is acknowledged by
   * CometChat, from the moment the announce lands.
   */
  sendSecureMedia: (
    targetId: string,
    media: OutgoingMedia,
    chatType?: string,
    onProgress?: (done: number, total: number) => void
  ) => Promise<void>;
  getOrCreateConversation: (targetId: string, chatType?: string) => Promise<CometChatConversation>;
  createGroup: (name: string, memberIds: string[]) => Promise<string>;
  /** Groups the signed-in user is a member of, for the Communities tab. */
  groups: CometChatGroup[];
  loadingGroups: boolean;
  refreshGroups: () => Promise<void>;
  /** Uids this account has blocked, via the SDK's blocked-users API. */
  blockedIds: string[];
  refreshBlockedUsers: () => Promise<void>;
  toggleBlockUser: (uid: string) => Promise<boolean>;
  isBlocked: (uid: string) => boolean;
  /** Per-conversation push mute, from the SDK's push preferences. */
  mutedConversations: string[];
  setConversationMuted: (conversationId: string, muted: boolean) => Promise<void>;
  /** Globally disables push for this account. */
  pushEnabled: boolean | null;
  setPushEnabled: (enabled: boolean) => Promise<void>;
  refreshPushPreferences: () => Promise<void>;
  /** Deletes every loaded message in a conversation. */
  clearConversation: (conversationId: string, chatType?: string) => Promise<number>;
  searchUsers: (query: string) => Promise<CometChatUser[]>;
  updateCurrentUserProfile: (fields: { nickName?: string; avatarUrl?: string }) => Promise<void>;
  refreshConversations: () => Promise<void>;
  refreshMessages: (conversationId: string, chatType?: string) => Promise<void>;
  markConversationRead: (conversationId: string, chatType?: string) => Promise<void>;
  markConversationUnread: (conversationId: string, chatType?: string) => Promise<void>;
  /** Uids currently typing, per conversation. */
  typingByConversation: Map<string, string[]>;
  sendTyping: (conversationId: string, chatType: string | undefined, active: boolean) => void;
  toggleReaction: (conversationId: string, message: any, reaction: string) => Promise<void>;
  deleteMessage: (conversationId: string, message: any) => Promise<void>;
  startCall: (peerUserId: string, video: boolean) => Promise<void>;
  endCall: () => Promise<void>;
  /** Restores local call state; cancels/ends anything still in flight. */
  resetCall: () => void;
  toggleAudio: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  switchCamera: () => void;
  rtcState: CometChatCallState;
  audioEnabled: boolean;
  videoEnabled: boolean;
  localUid: string | null;
  activeCall: ActiveCometChatCall | null;
  incomingCall: IncomingCometChatCall | null;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: () => Promise<void>;
  /** `callToken`/`callSettings` feed `<CometChatCalls.Component />` once joined. */
  callToken: string | null;
  callSettings: any | null;
  callError: string | null;
  callHistory: CallHistoryEntry[];
  loadingCallHistory: boolean;
  refreshCallHistory: () => Promise<void>;
  stories: StoryAuthor[];
  storiesLoading: boolean;
  refreshStories: () => Promise<boolean>;
  sendStory: (media: OutgoingMedia) => Promise<void>;
  messageReceipts: Map<string, any[]>;
  getMessageReceipts: (messageId: string) => Promise<any[]>;
  markMessageAsRead: (messageId: string) => Promise<void>;
}

const CometChatContext = createContext<CometChatContextType | null>(null);

export const useCometChat = (): CometChatContextType => {
  const context = useContext(CometChatContext);
  if (!context) {
    throw new Error('useCometChat must be used within a CometChatProvider');
  }
  return context;
};

const MESSAGE_LISTENER_ID = 'signal-clone-messages';
const CALL_LISTENER_ID = 'signal-clone-calls';

/** Cancel an outgoing call when nobody answers within this window. */
const NO_ANSWER_TIMEOUT_MS = 45_000;

/** Stories older than this are hidden. */
const STORY_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * A client that crashes or backgrounds mid-keystroke never sends "stopped
 * typing", so a typing indicator is dropped this long after the last signal.
 */
const TYPING_EXPIRY_MS = 6_000;

type CallsSdk = typeof import('@cometchat/calls-sdk-react-native').CometChatCalls;

const CALLS_SDK_UNAVAILABLE =
  'Calling is unavailable in this build. Rebuild the app with the native calling module (npx expo prebuild, then npx expo run:android|ios).';

let callsSdkCache: CallsSdk | null | undefined;

/**
 * The calls SDK touches native WebRTC while loading, so it is required lazily:
 * until the binary has been rebuilt with the calling module, calls fail with a
 * clear message instead of crashing the app at startup.
 */
export const getCallingSdk = (): CallsSdk | null => {
  if (callsSdkCache === undefined) {
    try {
      const mod = require('@cometchat/calls-sdk-react-native') as { CometChatCalls?: CallsSdk };
      callsSdkCache = mod.CometChatCalls ?? null;
    } catch {
      callsSdkCache = null;
    }
  }
  return callsSdkCache;
};

/** `CometChatCalls.init` may only run once per JS context. */
let callsInitPromise: Promise<void> | null = null;

const getCallAuthKey = () =>
  process.env.EXPO_PUBLIC_COMETCHAT_API_KEY || process.env.COMETCHAT_API_KEY || '';

const ensureCallsInitialized = (): Promise<void> => {
  if (callsInitPromise) return callsInitPromise;
  const sdk = getCallingSdk();
  if (!sdk) return Promise.reject(new Error(CALLS_SDK_UNAVAILABLE));

  const appId = process.env.EXPO_PUBLIC_COMETCHAT_APP_ID || '';
  const region = (process.env.EXPO_PUBLIC_COMETCHAT_REGION || 'us').toLowerCase();
  const authKey = getCallAuthKey();

  const promise = (async () => {
    const result = await sdk.init({ appId, region, authKey } as any);
    if (result && result.success === false) {
      throw new Error(result.error?.message || 'Unable to initialize the calling SDK');
    }
  })();
  callsInitPromise = promise;
  promise.catch(() => {
    // Allow the next call attempt to retry a failed init.
    if (callsInitPromise === promise) callsInitPromise = null;
  });
  return promise;
};

const describeError = (caught: any, fallback: string): string => {
  const candidates = [
    typeof caught === 'string' ? caught : undefined,
    caught?.message,
    caught?.error?.message,
    caught?.errorDescription,
    typeof caught?.details === 'string' ? caught.details : undefined,
  ];
  return candidates.find((value) => typeof value === 'string' && value) || fallback;
};

const MIME_BY_EXTENSION: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  pdf: 'application/pdf',
  txt: 'text/plain',
  csv: 'text/csv',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
};

const guessMimeType = (name: string, kind: OutgoingMedia['kind']): string => {
  const extension = (name.split('.').pop() || '').toLowerCase();
  return (
    MIME_BY_EXTENSION[extension] ||
    (kind === 'image' ? 'image/jpeg' : kind === 'video' ? 'video/mp4' : 'application/octet-stream')
  );
};

const toEpochMs = (value?: number) => {
  if (!value) return undefined;
  // CometChat may hand back seconds; normalise to milliseconds.
  return value < 1e12 ? value * 1000 : value;
};

const messageSentAt = (message: any): number => {
  if (!message) return 0;
  if (typeof message.getSentAt === 'function') {
    return toEpochMs(message.getSentAt()) ?? 0;
  }
  if (message.sentAt) return toEpochMs(message.sentAt) ?? 0;
  if (message.serverTime) {
    const parsed = new Date(message.serverTime).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

/** Epoch milliseconds for a message, normalised from seconds if needed. */
export const getMessageTimestamp = (message: any) => messageSentAt(message);

const messageKind = (message: any): string =>
  String((typeof message?.getType === 'function' ? message.getType() : message?.type) || '');

const messageCategory = (message: any): string =>
  String(
    (typeof message?.getCategory === 'function' ? message.getCategory() : message?.category) || ''
  );

const callMessageAction = (message: any): string =>
  String(
    (typeof message?.getAction === 'function' ? message.getAction() : message?.action) || ''
  ).toLowerCase();

/** Human label for a CometChat call-message action. */
export const getCallStatusText = (action: string): string => {
  switch ((action || '').toLowerCase()) {
    case 'answered':
    case 'ongoing':
    case 'ended':
      return 'Completed';
    case 'unanswered':
      return 'Missed';
    case 'rejected':
      return 'Declined';
    case 'cancelled':
      return 'Cancelled';
    case 'busy':
      return 'Busy';
    default:
      return '';
  }
};

export const getMessageAttachment = (message: any): MessageAttachment | null => {
  try {
    if (typeof message?.getAttachments !== 'function') return null;
    const attachments = message.getAttachments() || [];
    const first = attachments[0];
    if (!first) return null;
    const url =
      (typeof first.getUrl === 'function' ? first.getUrl() : first.url) ||
      (typeof first.getUrl === 'function' ? '' : first.url) ||
      '';
    if (!url) return null;
    return {
      url,
      name: (typeof first.getName === 'function' ? first.getName() : first.name) || '',
      mimeType: (typeof first.getMimeType === 'function' ? first.getMimeType() : first.mimeType) || '',
    };
  } catch {
    return null;
  }
};

/** Reactions attached to a message, flattened for rendering. */
export const getMessageReactions = (message: any): MessageReaction[] => {
  try {
    if (typeof message?.getReactions !== 'function') return [];
    return (message.getReactions() || [])
      .map((item: any) => ({
        reaction: item?.getReaction?.() || '',
        count: item?.getCount?.() || 0,
        mine: Boolean(item?.getReactedByMe?.()),
      }))
      .filter((item: MessageReaction) => item.reaction);
  } catch {
    return [];
  }
};

const hasReceiptValue = (value: any) =>
  typeof value === 'number' ? value > 0 : Boolean(value);

/** `Read` / `Delivered` summary for an outgoing message, if any. */
export const getMessageReceiptLabel = (receipts?: any[]): string => {
  if (!receipts?.length) return '';
  const read = receipts.some((receipt) => hasReceiptValue(receipt?.getReadAt?.()));
  if (read) return 'Read';
  const delivered = receipts.some((receipt) =>
    hasReceiptValue(receipt?.getDeliveredAt?.())
  );
  return delivered ? 'Delivered' : '';
};

/** Caption or text body of a message, without media/call labelling. */
export const getMessageBody = (message: any): string => {
  if (!message) return '';
  // Sealed text decrypts here, so everything downstream — bubbles, copy,
  // reply quotes, forward, info rows — sees the plaintext without knowing
  // there is an envelope. While the key is not ready yet this stays empty
  // and callers show their own locked placeholder.
  if (isSecureText(message)) return secureTextOf(message).text ?? '';
  if (typeof message.getCaption === 'function') {
    const caption = message.getCaption();
    if (caption) return caption;
  }
  if (typeof message.getText === 'function') {
    const text = message.getText();
    if (text) return text;
  }
  const data = customPayloadOf(
    typeof message.getData === 'function' ? message.getData() : undefined
  );
  return data?.text || message.text || message.content || message.body?.content || '';
};

/** One-line description used in chat lists and system rows. */
export const getMessageText = (message: any): string => {
  if (!message) return '';
  if (messageCategory(message) === 'call') {
    const label = messageKind(message) === 'video' ? 'Video call' : 'Voice call';
    const status = getCallStatusText(callMessageAction(message));
    return status ? `${label} · ${status}` : label;
  }
  // Secured-media carriers never describe their payload in plaintext: the
  // conversation preview says what arrived, never what it looks like.
  if (isSecuredCarrier(message)) {
    const data = customPayloadOf(
      typeof message?.getData === 'function' ? message.getData() : message?.data
    );
    if (typeof data?.n === 'number') return '🔒 Media'; // a chunk, mid-flight
    if (data?.kind === 'video') return '🔒 Video';
    if (data?.kind === 'file') return `🔒 ${data?.name || 'File'}`;
    return '🔒 Photo';
  }
  // Sealed text previews open exactly like the thread bubbles: the keys are
  // local, so the conversation list shows the real last line. The wire still
  // never carries plaintext - only this on-device read path sees it.
  if (isSecureText(message)) {
    const state = secureTextOf(message);
    if (state.text) return state.text;
    if (state.failed) return 'This message could not be verified';
    return '🔒 Encrypted message';
  }
  const body = getMessageBody(message);
  if (body) return body;
  const attachment = getMessageAttachment(message);
  if (attachment) {
    const kind = messageKind(message);
    if (kind === 'image') return 'Photo';
    if (kind === 'video') return 'Video';
    return attachment.name || 'Attachment';
  }
  return '';
};

const conversationTargetId = (conversation: any, type: string) => {
  const withEntity =
    typeof conversation.getConversationWith === 'function'
      ? conversation.getConversationWith()
      : undefined;
  const id =
    (type === 'group'
      ? withEntity?.getGuid?.()
      : withEntity?.getUid?.()) ||
    conversation.getConversationId?.() ||
    conversation.conversationId ||
    '';
  return id as string;
};

/**
 * CometChat rejects with a plain object ({ code, details, message }) rather
 * than an Error instance, so the raw object used to vanish into the fallback
 * string and left nothing to debug from. Surface the code: the banner and the
 * console both carry it.
 */
const describeSdkError = (caught: unknown, fallback: string): string => {
  if (caught instanceof Error) return caught.message;
  const e = caught as { code?: unknown; message?: unknown; details?: { message?: unknown } } | null;
  if (!e || typeof e !== 'object') return fallback;
  const code = typeof e.code === 'string' ? e.code : '';
  const detail =
    (typeof e.details?.message === 'string' && e.details.message) ||
    (typeof e.message === 'string' && e.message) ||
    '';
  const text = detail ? (code ? `${code}: ${detail}` : detail) : code;
  return text || fallback;
};

const mapConversation = (conversation: any): CometChatConversation => {
  const type =
    (typeof conversation.getConversationType === 'function'
      ? conversation.getConversationType()
      : conversation.conversationType) || 'user';
  const withEntity =
    typeof conversation.getConversationWith === 'function'
      ? conversation.getConversationWith()
      : undefined;
  const latestMessage =
    typeof conversation.getLastMessage === 'function'
      ? conversation.getLastMessage()
      : undefined;

  return {
    id: conversationTargetId(conversation, type),
    type,
    name: withEntity?.getName?.() || conversation.name || undefined,
    image: withEntity?.getAvatar?.() || withEntity?.getIcon?.() || conversation.image || undefined,
    latestMessage,
    timestamp: toEpochMs(messageSentAt(latestMessage)),
    unreadCount:
      typeof conversation.getUnreadMessageCount === 'function'
        ? conversation.getUnreadMessageCount()
        : conversation.unreadCount || 0,
  };
};

/**
 * Identity for this install. CometChat has no password auth of its own, so the
 * app signs in directly with a UID: the first launch creates the user with the
 * App Auth Key, and the choice is remembered so the app reopens straight into
 * the chats. There is no separate identity provider in the loop.
 */
export interface CometIdentity {
  uid: string;
  name: string;
  image?: string;
}

const IDENTITY_STORAGE_KEY = 'veill.identity';

/** AsyncStorage is a native module, so it is required lazily and optionally. */
const getStorage = (): any | null => {
  try {
    return require('@react-native-async-storage/async-storage').default;
  } catch {
    return null;
  }
};

const readStoredIdentity = async (): Promise<CometIdentity | null> => {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const stored = await storage.getItem(IDENTITY_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as CometIdentity;
    return parsed?.uid ? parsed : null;
  } catch {
    return null;
  }
};

const writeStoredIdentity = async (identity: CometIdentity): Promise<void> => {
  const storage = getStorage();
  if (!storage) return;
  try {
    await storage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // Persisting is best-effort; the session still works this launch.
  }
};

const clearStoredIdentity = async (): Promise<void> => {
  const storage = getStorage();
  if (!storage) return;
  try {
    await storage.removeItem(IDENTITY_STORAGE_KEY);
  } catch {
    // ignore
  }
};

interface CometChatProviderProps {
  children: ReactNode;
}

/** `init` may only run once per JS context, even across remounts. */
let initPromise: Promise<boolean> | null = null;

export const CometChatProvider = ({ children }: CometChatProviderProps) => {
  const [identity, setIdentity] = useState<CometIdentity | null>(null);
  const [currentUser, setCurrentUser] = useState<CometChatUser | null>(null);
  const [conversations, setConversations] = useState<CometChatConversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messagesByConversation, setMessagesByConversation] = useState<Map<string, any[]>>(new Map());
  const [loadingMessages, setLoadingMessages] = useState<Map<string, boolean>>(new Map());
  const [sessionReady, setSessionReady] = useState(false);
  const [chatClient, setChatClient] = useState<any | null>(null);

  const [rtcState, setRtcState] = useState<CometChatCallState>('idle');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [localUid, setLocalUid] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCometChatCall | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCometChatCall | null>(null);
  const [callToken, setCallToken] = useState<string | null>(null);
  const [callSettings, setCallSettings] = useState<any | null>(null);
  const [callError, setCallError] = useState<string | null>(null);
  const [callHistory, setCallHistory] = useState<CallHistoryEntry[]>([]);
  const [loadingCallHistory, setLoadingCallHistory] = useState(false);
  const [stories, setStories] = useState<StoryAuthor[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [groups, setGroups] = useState<CometChatGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [mutedConversations, setMutedConversations] = useState<string[]>([]);
  const [pushEnabled, setPushEnabledState] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const userRef = useRef<CometChatUser | null>(null);
  const identityLoadingRef = useRef(false);
  const conversationTypesRef = useRef<Map<string, string>>(new Map());
  const conversationsRef = useRef<CometChatConversation[]>([]);
  const ringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const incomingCallRef = useRef<IncomingCometChatCall | null>(null);
  const activeCallRef = useRef<ActiveCometChatCall | null>(null);
  const rtcStateRef = useRef<CometChatCallState>('idle');
  const storiesGroupReadyRef = useRef(false);

  const resolveConversationType = useCallback((conversationId: string) => {
    return conversationTypesRef.current.get(conversationId) || 'user';
  }, []);

  // Restore the remembered identity on cold start so returning users skip the
  // login screen entirely.
  useEffect(() => {
    let cancelled = false;
    void readStoredIdentity().then((stored) => {
      if (stored && !cancelled) setIdentity(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Sign in as `name`, creating the CometChat user the first time. */
  const loginAs = useCallback(async (name: string) => {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      const message = 'Enter a name to continue';
      setAuthError(message);
      throw new Error(message);
    }
    setAuthError(null);
    const uid = normalizeCometChatUserId(trimmed.toLowerCase().replace(/\s+/g, '_'));
    const next: CometIdentity = { uid, name: trimmed };
    setIdentity(next);
    await writeStoredIdentity(next);
  }, []);

  const signOut = useCallback(async () => {
    await clearStoredIdentity();
    setIdentity(null);
    setAuthError(null);
  }, []);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const refreshConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const request = new (CometChat as any).ConversationsRequestBuilder()
        .setLimit(50)
        .build();
      const result = (await request.fetchNext()) || [];
      const mapped: CometChatConversation[] = result
        .map(mapConversation)
        // The stories group is a media sink, not a chat.
        .filter((conversation: CometChatConversation) => conversation.id !== STORIES_GUID);

      const typeMap = new Map<string, string>();
      mapped.forEach((conversation) => typeMap.set(conversation.id, conversation.type));
      conversationTypesRef.current = typeMap;

      mapped.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setConversations(mapped);
    } catch (caught) {
      console.warn('[conversations] load failed', caught);
      setError(describeSdkError(caught, 'Unable to load conversations'));
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const refreshMessages = useCallback(
    async (conversationId: string, chatType?: string) => {
      try {
        setLoadingMessages((prev) => new Map(prev).set(conversationId, true));
        const type = chatType || resolveConversationType(conversationId);
        const builder = new (CometChat as any).MessagesRequestBuilder().setLimit(50);
        if (type === 'group') {
          builder.setGUID(conversationId);
        } else {
          builder.setUID(conversationId);
        }
        // v4 pagination: `fetchNext()` walks forward (newer than an anchor)
        // and refuses to run without one, while `fetchPrevious()` walks older
        // from the server's newest page - so a bare fetchPrevious() is the
        // initial history load.
        const result = (await builder.build().fetchPrevious()) || [];
        // History replays through the ingest so transfers that streamed in
        // while this conversation was closed rehydrate: the chunks are already
        // stored as custom messages, and the receiver needs only to reassemble.
        for (const message of result) {
          ingestSecuredMessage(message, conversationId);
        }
        const ordered = [...result].sort((a, b) => messageSentAt(a) - messageSentAt(b));
        setMessagesByConversation((prev) => {
          const next = new Map(prev);
          next.set(conversationId, ordered);
          return next;
        });
      } catch (caught) {
        console.warn('[messages] load failed', conversationId, caught);
        setError(describeSdkError(caught, 'Unable to load messages'));
      } finally {
        setLoadingMessages((prev) => new Map(prev).set(conversationId, false));
      }
    },
    [resolveConversationType]
  );

  const appendMessage = useCallback((conversationId: string, message: any) => {
    setMessagesByConversation((prev) => {
      const existing = prev.get(conversationId);
      if (!existing) return prev;
      const messageId = message?.getId?.();
      const deduped = messageId
        ? existing.filter((item) => item?.getId?.() !== messageId)
        : existing;
      const next = new Map(prev);
      next.set(
        conversationId,
        [...deduped, message].sort((a, b) => messageSentAt(a) - messageSentAt(b))
      );
      return next;
    });
  }, []);

  /**
   * Text travels sealed by default: the content becomes a ve:text custom
   * message encrypted under the conversation's key, exactly like media.
   * Two honest exceptions, declared rather than silent:
   *   - content over the sealed ceiling (4096 bytes) falls back to an
   *     ordinary TextMessage — unsealed, but never truncated;
   *   - the push tray shows a generic "New message" body, because the push
   *     extension holds no key and there is no honest way around that.
   * A seal that cannot be delivered throws rather than degrading to a
   * plaintext send.
   */
  const sendTextMessage = useCallback(
    async (targetId: string, content: string, chatType?: string) => {
      const type = chatType || resolveConversationType(targetId);

      let envelope: TextEnvelope | null = null;
      try {
        envelope = sealText(
          content,
          conversationKey(
            targetId,
            participantTagFor(
              targetId,
              type,
              userRef.current?.id ?? null
            )
          )
        );
      } catch {
        envelope = null;
      }

      if (envelope) {
        const message = new (CometChat as any).CustomMessage(
          targetId,
          type === 'group' ? 'group' : 'user',
          SECURE_TEXT,
          envelope
        );
        // Decorative only: what the push extension renders in the tray.
        message.setMetadata?.({ pushNotification: 'New message' });
        const sent = await (CometChat.sendCustomMessage as any)(message);
        appendMessage(targetId, sent);
        void refreshConversations();
        return;
      }

      // Over the sealed ceiling. Kept visibly in code so the tradeoff is a
      // fact of the source rather than of the runtime.
      const message = new (CometChat as any).TextMessage(targetId, content, type);
      const sent = await (CometChat.sendMessage as any)(message);
      appendMessage(targetId, sent);
      void refreshConversations();
    },
    [appendMessage, refreshConversations, resolveConversationType]
  );

  /**
   * The private pipeline's transport (see lib/secure-media.ts for the crypto
   * and the envelope description).
   *
   * Ownership split: this function only carries what the library seals. It
   * announces the transfer, streams the chunks with a little concurrency and
   * per-chunk retry, and feeds every acknowledged message back through the
   * ingest — on the sending device the SDK resolves sends without echoing them
   * back through the listener, so the ingest call here is what lets the
   * sender's own bubble resolve.
   */
  const sendSecureMedia = useCallback(
    async (
      targetId: string,
      media: OutgoingMedia,
      chatType?: string,
      onProgress?: (done: number, total: number) => void
    ) => {
      if (!targetId || !media?.uri) return;
      const type = chatType || resolveConversationType(targetId);
      const receiverType = type === 'group' ? 'group' : 'user';

      const key = conversationKey(
        targetId,
        participantTagFor(targetId, type, userRef.current?.id ?? null)
      );

      // Read the bytes. `expo-image-picker` and `expo-camera` both hand back
      // file:// URIs the filesystem module can read directly.
      const source = new FsFile(media.uri);
      const bytes = await source.bytes();
      if (!bytes || bytes.length === 0) {
        throw new Error('The file to send could not be read');
      }

      const mime = guessMimeType(media.name || '', media.kind);
      const { start, chunks } = prepareTransfer(
        bytes,
        { kind: media.kind as SecuredKind, name: media.name || 'media', mime },
        key
      );

      // Not a UI detail: every chunk that reaches the conversation triggers
      // decode paths on both ends, so an in-flight set must survive the
      // composer closing mid-send.
      let done = 0;
      const onChunkAck = async (resolvedAll: any) => {
        done += 1;
        // The announce is part of the honest count, so the denominator matches.
        onProgress?.(done, chunks.length + 1);
        ingestSecuredMessage(resolvedAll, targetId);
        appendMessage(targetId, resolvedAll);
      };

      const customMessage = (envelopeType: string, data: object) => {
        const message = new (CometChat as any).CustomMessage(
          targetId,
          receiverType,
          envelopeType,
          data
        );
        return (CometChat.sendCustomMessage as any)(message);
      };

      await customMessage(SECURE_START, start).then(onChunkAck);

      const queue = chunks.map((chunk, index) => ({ chunk, index }));
      let cursor = 0;
      let consecutiveFailures = 0;
      const PER_CHUNK_RETRIES = 2;
      const FAILURE_LIMIT = 12; // stops the stream rather than storming the socket

      const worker = async () => {
        while (cursor < queue.length) {
          const item = queue[cursor++];
          for (let attempt = 0; ; attempt++) {
            try {
              const resolvedAll = await customMessage(SECURE_CHUNK, item.chunk);
              consecutiveFailures = 0;
              await onChunkAck(resolvedAll);
              break;
            } catch {
              attempt += 1;
              consecutiveFailures += 1;
              if (consecutiveFailures >= FAILURE_LIMIT) {
                throw new Error('CometChat stopped accepting messages for this transfer');
              }
              if (attempt > PER_CHUNK_RETRIES) {
                throw new Error(`Chunk ${item.index + 1} of ${start.total} could not be delivered`);
              }
              // A short, growing pause. Retry stays inside one worker so failed
              // chunks do not multiply connections.
              await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
            }
          }
        }
      };

      await Promise.all(Array.from({ length: Math.min(4, queue.length) }, worker));

      // The carry messages are not what a conversation-preview should show.
      void refreshConversations();
    },
    [appendMessage, refreshConversations, resolveConversationType]
  );

  const sendMediaMessage = useCallback(
    async (targetId: string, media: OutgoingMedia, chatType?: string) => {
      if (!targetId || !media?.uri) return;
      const type = chatType || resolveConversationType(targetId);
      const receiverType = type === 'group' ? 'group' : 'user';
      const file = {
        uri: media.uri,
        name: media.name || 'attachment',
        type: guessMimeType(media.name || '', media.kind),
        size: media.size || 0,
      };
      const message = new (CometChat as any).MediaMessage(
        targetId,
        file,
        media.kind,
        receiverType
      );
      const sent = await (CometChat.sendMediaMessage as any)(message);
      appendMessage(targetId, sent);
      void refreshConversations();
    },
    [appendMessage, refreshConversations, resolveConversationType]
  );

  const getOrCreateConversation = useCallback(
    async (targetId: string, chatType?: string) => {
      const type = chatType || 'user';
      conversationTypesRef.current.set(targetId, type);

      try {
        const result = await (CometChat.getConversation as any)(targetId, type);
        const mapped = mapConversation(result);
        void refreshConversations();
        return { ...mapped, id: targetId, type: mapped.type || type };
      } catch {
        let name = targetId;
        let image: string | undefined;
        if (type === 'user') {
          try {
            const remoteUser = await (CometChat.getUser as any)(targetId);
            name = remoteUser?.getName?.() || targetId;
            image = remoteUser?.getAvatar?.() || undefined;
          } catch {
            // Fall back to the raw id when the profile cannot be fetched.
          }
        }
        return { id: targetId, type, name, image, latestMessage: undefined, unreadCount: 0 };
      }
    },
    [refreshConversations]
  );

  const createGroup = useCallback(
    async (name: string, memberIds: string[]) => {
      try {
        const guid = `grp${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
        const group = new (CometChat as any).Group(guid, name, 'public');
        const members = memberIds.map(
          (memberId) => new (CometChat as any).GroupMember(memberId, 'participant')
        );
        await (CometChat as any).createGroupWithMembers(group, members, []);
        conversationTypesRef.current.set(guid, 'group');
        await refreshConversations();
        return guid as string;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Unable to create group');
        throw caught;
      }
    },
    [refreshConversations]
  );

  const refreshGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const builder: any = new (CometChat as any).GroupsRequestBuilder().setLimit(100);
      const result = (await builder.build().fetchNext()) || [];
      setGroups(
        result
          .map((remoteGroup: any) => ({
            id: typeof remoteGroup.getGuid === 'function' ? remoteGroup.getGuid() : remoteGroup.guid || '',
            name: typeof remoteGroup.getName === 'function' ? remoteGroup.getName() : remoteGroup.name || '',
            image: typeof remoteGroup.getAvatar === 'function' ? remoteGroup.getAvatar() : remoteGroup.avatar || undefined,
            memberCount:
              typeof remoteGroup.getMembersCount === 'function' ? remoteGroup.getMembersCount() : 0,
            isStoriesBacking: remoteGroup.guid === STORIES_GUID,
          }))
          .filter((group: CometChatGroup) => group.id && !group.isStoriesBacking)
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load groups');
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  const refreshBlockedUsers = useCallback(async () => {
    try {
      const result = (await (CometChat as any).getBlockedUsers()) || [];
      setBlockedIds(
        result
          .map((user: any) => (typeof user?.getUid === 'function' ? user.getUid() : user?.uid))
          .filter((uid: unknown): uid is string => typeof uid === 'string' && uid.length > 0)
      );
    } catch {
      // Blocking needs the API enabled on the app; the rest still works.
      setBlockedIds([]);
    }
  }, []);

  /** Returns the new blocked state so the caller can report it. */
  const toggleBlockUser = useCallback(
    async (uid: string) => {
      const wasBlocked = blockedIds.includes(uid);
      try {
        await (CometChat as any)[wasBlocked ? 'unblockUsers' : 'blockUsers']([uid]);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not update blocked users');
        throw caught;
      }
      setBlockedIds((current) =>
        wasBlocked ? current.filter((value) => value !== uid) : [...current, uid]
      );
      return !wasBlocked;
    },
    [blockedIds]
  );

  /** Per-conversation mute, persisted server-side by the SDK. */
  const setConversationMuted = useCallback(
    async (conversationId: string, muted: boolean) => {
      try {
        const payload = [
          muted
            ? {
                conversationId,
                conversationType: conversationId.startsWith('group_') ? 2 : 1,
                isMuted: 1,
              }
            : { conversationId },
        ];
        await (CometChat as any)[muted ? 'muteConversations' : 'unmuteConversations'](payload);
        setMutedConversations((current) =>
          muted ? [...new Set([...current, conversationId])] : current.filter((id) => id !== conversationId)
        );
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not update notifications');
        throw caught;
      }
    },
    []
  );

  const refreshPushPreferences = useCallback(async () => {
    try {
      const muted = (await (CometChat as any).getMutedConversations()) || [];
      setMutedConversations(
        muted.map((item: any) => item?.conversationId ?? item).filter(Boolean)
      );
      const prefs = await (CometChat as any).fetchPushPreferences();
      setPushEnabledState(prefs?.enablePush !== false);
    } catch {
      // Push preferences need the notifications extension; defaults are fine.
    }
  }, []);

  const setPushEnabled = useCallback(async (enabled: boolean) => {
    try {
      const prefs = await (CometChat as any).fetchPushPreferences();
      await (CometChat as any).updatePushPreferences({ ...prefs, enablePush: enabled });
      setPushEnabledState(enabled);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update notifications');
      throw caught;
    }
  }, []);

  const searchUsers = useCallback(async (query: string) => {
    try {
      const normalizedQuery = query.trim();
      const builder: any = new (CometChat as any).UsersRequestBuilder().setLimit(50);
      if (normalizedQuery) {
        builder.setSearchKeyword(normalizedQuery);
      }
      const result = (await builder.build().fetchNext()) || [];
      const currentUserId = userRef.current?.id;
      return result
        .map((remoteUser: any) => ({
          id:
            typeof remoteUser.getUid === 'function' ? remoteUser.getUid() : remoteUser.uid || '',
          name:
            typeof remoteUser.getName === 'function' ? remoteUser.getName() : remoteUser.name || '',
          image:
            (typeof remoteUser.getAvatar === 'function'
              ? remoteUser.getAvatar()
              : remoteUser.avatar) || undefined,
          username:
            typeof remoteUser.getUid === 'function' ? remoteUser.getUid() : remoteUser.uid || '',
        }))
        .filter((remoteUser: CometChatUser) => remoteUser.id && remoteUser.id !== currentUserId);
    } catch {
      return [];
    }
  }, []);

  const updateCurrentUserProfile = useCallback(
    async (fields: { nickName?: string; avatarUrl?: string }) => {
      const previous = userRef.current;
      const nextName = fields.nickName || previous?.name;
      const nextImage = fields.avatarUrl || previous?.image;

      // Optimistically reflect the change locally even if CometChat is offline;
      // the Clerk profile is the primary source of truth for this app.
      setCurrentUser((prev) =>
        prev ? { ...prev, name: nextName, image: nextImage } : prev
      );

      try {
        await (CometChat as any).updateCurrentUserDetails({
          uid: previous?.id,
          name: nextName,
          avatar: nextImage,
        });
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : 'Unable to update CometChat profile'
        );
      }
    },
    []
  );

  const markConversationRead = useCallback(
    async (conversationId: string, chatType?: string) => {
      const type = chatType || resolveConversationType(conversationId);
      try {
        await (CometChat.markConversationAsRead as any)(conversationId, type);
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === conversationId
              ? { ...conversation, unreadCount: 0 }
              : conversation
          )
        );
      } catch {
        // Read receipts are best-effort.
      }
    },
    [resolveConversationType]
  );

  const [messageReceipts, setMessageReceipts] = useState<Map<string, any[]>>(new Map());
  const [typingByConversation, setTypingByConversation] = useState<Map<string, string[]>>(
    new Map()
  );
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dropTyping = useCallback((conversationId: string, senderId: string) => {
    setTypingByConversation((prev) => {
      const current = prev.get(conversationId);
      if (!current?.includes(senderId)) return prev;
      const next = new Map(prev);
      next.set(
        conversationId,
        current.filter((uid) => uid !== senderId)
      );
      return next;
    });
  }, []);

  const markTyping = useCallback(
    (conversationId: string, senderId: string) => {
      setTypingByConversation((prev) => {
        const current = prev.get(conversationId) || [];
        if (current.includes(senderId)) return prev;
        const next = new Map(prev);
        next.set(conversationId, [...current, senderId]);
        return next;
      });

      const existing = typingTimersRef.current.get(senderId);
      if (existing) clearTimeout(existing);
      typingTimersRef.current.set(
        senderId,
        setTimeout(() => {
          typingTimersRef.current.delete(senderId);
          dropTyping(conversationId, senderId);
        }, TYPING_EXPIRY_MS)
      );
    },
    [dropTyping]
  );

  const sendTyping = useCallback(
    (conversationId: string, chatType: string | undefined, active: boolean) => {
      if (!conversationId) return;
      try {
        const type = chatType || resolveConversationType(conversationId);
        const indicator = new (CometChat as any).TypingIndicator(conversationId, type, {});
        if (active) (CometChat.startTyping as any)(indicator);
        else (CometChat.endTyping as any)(indicator);
      } catch {
        // Typing indicators are decorative — never surface a failure.
      }
    },
    [resolveConversationType]
  );

  const toggleReaction = useCallback(
    async (conversationId: string, message: any, reaction: string) => {
      const messageId = message?.getId?.();
      if (!messageId || !reaction) return;
      const existing = getMessageReactions(message);
      const mine = existing.some((item) => item.reaction === reaction && item.mine);

      const updated = mine
        ? await (CometChat.removeReaction as any)(messageId, reaction)
        : await (CometChat.addReaction as any)(messageId, reaction);

      // The server response carries the authoritative list; copy it onto the
      // cached message and swap the array identity so the row re-renders.
      const reactions =
        typeof updated?.getReactions === 'function'
          ? updated.getReactions()
          : message.getReactions?.();
      if (reactions && typeof message.setReactions === 'function') {
        message.setReactions(reactions);
      }
      setMessagesByConversation((prev) => {
        const list = prev.get(conversationId);
        if (!list) return prev;
        const next = new Map(prev);
        next.set(conversationId, [...list]);
        return next;
      });
    },
    []
  );

  const deleteMessage = useCallback(
    async (conversationId: string, message: any) => {
      const messageId = message?.getId?.();
      if (!messageId) return;
      await (CometChat.deleteMessage as any)(messageId);
      setMessagesByConversation((prev) => {
        const list = prev.get(conversationId);
        if (!list) return prev;
        const next = new Map(prev);
        next.set(
          conversationId,
          list.filter((item) => item?.getId?.() !== messageId)
        );
        return next;
      });
      void refreshConversationsRef.current();
    },
    []
  );

  const markConversationUnread = useCallback(
    async (conversationId: string, chatType?: string) => {
      const type = chatType || resolveConversationType(conversationId);
      try {
        const builder: any = new (CometChat as any).MessagesRequestBuilder().setLimit(1);
        if (type === 'group') builder.setGUID(conversationId);
        else builder.setUID(conversationId);
        const [latest] = (await builder.build().fetchPrevious()) || [];
        if (!latest) return;
        await (CometChat.markMessageAsUnread as any)(latest);
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === conversationId
              ? { ...conversation, unreadCount: (conversation.unreadCount || 0) + 1 }
              : conversation
          )
        );
      } catch {
        // Marking unread is best-effort.
      }
    },
    [resolveConversationType]
  );

  const getMessageReceipts = useCallback(async (messageId: string) => {
    try {
      const receipts = await (CometChat.getMessageReceipts as any)(messageId);
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

  // Live receipts: CometChat pushes read/delivery receipts through the message
  // listener the moment the peer acts. Landing them in the same store the REST
  // fetch fills means the tick under the last outgoing message flips with no
  // refetch. A receipt carries the id of the message it concerns —
  // `getMessageId` is the v4 accessor; `getId` covers SDK variations. Echoes
  // from our own uid are dropped: they would read-bless our own messages.
  const recordReceiptEvent = useCallback((receipt: any, kind: 'read' | 'delivered') => {
    if (!receipt) return;
    const readerId = receipt?.getSender?.()?.getUid?.();
    if (readerId && readerId === userRef.current?.id) return;
    const messageId = receipt?.getMessageId?.() ?? receipt?.getId?.() ?? '';
    if (!messageId) return;
    // Shape matches what `getMessageReceipts` stores, so the label helpers
    // (and any future consumer) treat both sources the same.
    const wrapped =
      kind === 'read'
        ? {
            getReadAt: () => receipt?.getReadAt?.() ?? Date.now(),
            getDeliveredAt: () => receipt?.getDeliveredAt?.(),
            getSender: () => receipt?.getSender?.(),
          }
        : {
            getReadAt: () => receipt?.getReadAt?.(),
            getDeliveredAt: () => receipt?.getDeliveredAt?.() ?? Date.now(),
            getSender: () => receipt?.getSender?.(),
          };
    setMessageReceipts((prev) => {
      const key = String(messageId);
      const next = new Map(prev);
      next.set(key, [...(prev.get(key) || []), wrapped]);
      return next;
    });
  }, []);

  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      await (CometChat as any).markAsRead?.(messageId);
    } catch {
      // Read receipts are best-effort.
    }
  }, []);

  //
  // ——— Calling ———
  //

  // Keep refs in lock-step with state so async handlers never read stale values.
  const syncIncoming = useCallback((call: IncomingCometChatCall | null) => {
    incomingCallRef.current = call;
    setIncomingCall(call);
  }, []);

  const syncActive = useCallback((call: ActiveCometChatCall | null) => {
    activeCallRef.current = call;
    setActiveCall(call);
  }, []);

  const syncRtc = useCallback((state: CometChatCallState) => {
    rtcStateRef.current = state;
    setRtcState(state);
  }, []);

  const clearRingTimer = useCallback(() => {
    if (ringTimerRef.current) {
      clearTimeout(ringTimerRef.current);
      ringTimerRef.current = null;
    }
  }, []);

  const refreshConversationsRef = useRef(refreshConversations);
  useEffect(() => {
    refreshConversationsRef.current = refreshConversations;
  }, [refreshConversations]);

  /** Tear down local call state once the call is over (either side). */
  const finishCall = useCallback(() => {
    clearRingTimer();
    syncActive(null);
    setCallToken(null);
    setCallSettings(null);
    syncRtc('ended');
    // Call events land in the conversation timeline — refresh the list.
    void refreshConversationsRef.current();
  }, [clearRingTimer, syncActive, syncRtc]);

  /** Hang up or cancel whatever is currently in flight. */
  const endCall = useCallback(async () => {
    const session = activeCallRef.current;
    const state = rtcStateRef.current;
    clearRingTimer();

    if (session && state === 'joined') {
      try {
        await (CometChat.endCall as any)(session.sessionId);
      } catch {
        // The session may already be over — leaving below is enough.
      }
      try {
        (CometChat.clearActiveCall as any)();
      } catch {
        // Best-effort local cleanup.
      }
      try {
        getCallingSdk()?.leaveSession();
      } catch {
        // Best-effort media teardown.
      }
      finishCall();
      return;
    }

    if (session && state === 'connecting') {
      const status = session.direction === 'outgoing' ? 'cancelled' : 'rejected';
      try {
        await (CometChat.rejectCall as any)(session.sessionId, status);
      } catch {
        // Already ended or expired.
      }
      try {
        (CometChat.clearActiveCall as any)();
      } catch {
        // Best-effort local cleanup.
      }
      finishCall();
      return;
    }

    // The incoming screen can be open without a live session yet.
    const pendingIncoming = incomingCallRef.current;
    if (pendingIncoming) {
      try {
        await (CometChat.rejectCall as any)(pendingIncoming.sessionId, 'rejected');
      } catch {
        // Already cancelled by the caller.
      }
      syncIncoming(null);
    }
    finishCall();
  }, [clearRingTimer, finishCall, syncIncoming]);

  /**
   * Generate a join token and hand `callToken`/`callSettings` to the call
   * screen; `<CometChatCalls.Component />` then owns the media session.
   */
  const beginCallSession = useCallback(
    async (sessionId: string, video: boolean) => {
      if (!sessionId) return;
      clearRingTimer();
      try {
        setCallError(null);
        await ensureCallsInitialized();
        const sdk = getCallingSdk();
        if (!sdk) throw new Error(CALLS_SDK_UNAVAILABLE);

        const tokenResult = await sdk.generateToken(sessionId, getCallAuthKey() || undefined);
        const token = tokenResult?.token;
        if (!token) throw new Error('Unable to join the call');

        const listener = new sdk.OngoingCallListener({
          onCallEnded: () => {
            finishCall();
          },
          onCallEndButtonPressed: () => {
            void endCall();
          },
          onSessionTimeout: () => {
            finishCall();
          },
          onError: (event: any) => {
            setCallError(describeError(event, 'Call failed'));
          },
        });

        const settings = new sdk.CallSettingsBuilder()
          .enableDefaultLayout(true)
          .setIsAudioOnlyCall(!video)
          .setCallEventListener(listener)
          .build();

        setCallToken(token);
        setCallSettings(settings);
        syncRtc('joined');
      } catch (caught) {
        setCallError(describeError(caught, 'Unable to join the call'));
        try {
          await (CometChat.endCall as any)(sessionId);
        } catch {
          // Nothing to end if the session never started.
        }
        try {
          (CometChat.clearActiveCall as any)();
        } catch {
          // Best-effort local cleanup.
        }
        finishCall();
      }
    },
    [clearRingTimer, endCall, finishCall, syncRtc]
  );

  /** Place an outgoing 1:1 call. The peer answers via `CallListener`. */
  /**
   * CometChat has no bulk-clear endpoint, so this walks the messages already
   * loaded for the conversation and deletes them one by one.
   */
  const clearConversation = useCallback(
    async (conversationId: string, chatType?: string) => {
      const loaded = messagesByConversation.get(conversationId) || [];
      let removed = 0;
      for (const message of loaded) {
        try {
          await deleteMessage(conversationId, message);
          removed += 1;
        } catch {
          // Skip anything that cannot be deleted (not ours, or already gone).
        }
      }
      await refreshMessages(conversationId, chatType);
      return removed;
    },
    [deleteMessage, messagesByConversation, refreshMessages]
  );

  const startCall = useCallback(
    async (peerUserId: string, video: boolean) => {
      if (!peerUserId) return;
      clearRingTimer();
      setCallError(null);
      setLocalUid(userRef.current?.id || null);
      setAudioEnabled(true);
      setVideoEnabled(video);
      syncRtc('connecting');

      try {
        const call = new (CometChat as any).Call(
          peerUserId,
          video ? 'video' : 'audio',
          'user'
        );
        const initiated = await (CometChat.initiateCall as any)(call);
        const sessionId =
          initiated?.getSessionId?.() ||
          initiated?.sessionId ||
          initiated?.getCallSessionId?.() ||
          '';
        if (!sessionId) throw new Error('Unable to start the call');

        syncActive({ sessionId, peerId: peerUserId, video, direction: 'outgoing' });

        // No answer → cancel instead of ringing forever.
        ringTimerRef.current = setTimeout(() => {
          ringTimerRef.current = null;
          void (async () => {
            const current = activeCallRef.current;
            if (!current || rtcStateRef.current !== 'connecting') return;
            try {
              await (CometChat.rejectCall as any)(current.sessionId, 'cancelled');
            } catch {
              // Already answered or ended in a racing message.
            }
            try {
              (CometChat.clearActiveCall as any)();
            } catch {
              // Best-effort local cleanup.
            }
            setCallError('No answer');
            finishCall();
          })();
        }, NO_ANSWER_TIMEOUT_MS);
      } catch (caught) {
        setCallError(describeError(caught, 'Unable to start the call'));
        finishCall();
      }
    },
    [clearRingTimer, finishCall, syncActive, syncRtc]
  );

  const acceptIncomingCall = useCallback(async () => {
    const pending = incomingCallRef.current;
    if (!pending) return;
    clearRingTimer();
    setCallError(null);
    syncIncoming(null);
    setLocalUid(userRef.current?.id || null);
    setAudioEnabled(true);
    setVideoEnabled(pending.video);
    syncActive({
      sessionId: pending.sessionId,
      peerId: pending.peerUserId || pending.callerId,
      video: pending.video,
      direction: 'incoming',
    });
    syncRtc('connecting');

    try {
      await (CometChat.acceptCall as any)(pending.sessionId);
    } catch (caught) {
      setCallError(describeError(caught, 'Unable to accept the call'));
      finishCall();
      return;
    }
    await beginCallSession(pending.sessionId, pending.video);
  }, [beginCallSession, clearRingTimer, finishCall, syncActive, syncIncoming, syncRtc]);

  const rejectIncomingCall = useCallback(async () => {
    const pending = incomingCallRef.current;
    clearRingTimer();
    // Clear first so an unmount right after does not reject twice.
    syncIncoming(null);
    if (pending) {
      try {
        await (CometChat.rejectCall as any)(pending.sessionId, 'rejected');
      } catch {
        // The caller may have already cancelled.
      }
    }
  }, [clearRingTimer, syncIncoming]);

  /**
   * Restores local call state when the call screen goes away. Anything still
   * ringing is cancelled, an active session is hung up for real.
   */
  const resetCall = useCallback(() => {
    const session = activeCallRef.current;
    const state = rtcStateRef.current;
    const pendingIncoming = incomingCallRef.current;
    clearRingTimer();

    if (session && state === 'joined') {
      void (async () => {
        try {
          await (CometChat.endCall as any)(session.sessionId);
        } catch {
          // Already over.
        }
        try {
          (CometChat.clearActiveCall as any)();
        } catch {
          // Best-effort local cleanup.
        }
        try {
          getCallingSdk()?.leaveSession();
        } catch {
          // Best-effort media teardown.
        }
      })();
    } else if (session && state === 'connecting') {
      const status = session.direction === 'outgoing' ? 'cancelled' : 'rejected';
      void (async () => {
        try {
          await (CometChat.rejectCall as any)(session.sessionId, status);
        } catch {
          // Already answered or expired.
        }
        try {
          (CometChat.clearActiveCall as any)();
        } catch {
          // Best-effort local cleanup.
        }
      })();
    } else if (pendingIncoming) {
      void (async () => {
        try {
          await (CometChat.rejectCall as any)(pendingIncoming.sessionId, 'rejected');
        } catch {
          // The caller may have already cancelled.
        }
      })();
    }

    syncActive(null);
    syncIncoming(null);
    setCallToken(null);
    setCallSettings(null);
    syncRtc('idle');
    setCallError(null);
    setAudioEnabled(true);
    setVideoEnabled(false);
    setLocalUid(null);
  }, [clearRingTimer, syncActive, syncIncoming, syncRtc]);

  const toggleAudio = useCallback(async () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    try {
      // muteAudio(true) mutes the local track.
      getCallingSdk()?.muteAudio(!next);
    } catch {
      // No active session — the state still flips for the next call.
    }
  }, [audioEnabled]);

  const toggleVideo = useCallback(async () => {
    const next = !videoEnabled;
    setVideoEnabled(next);
    try {
      const sdk = getCallingSdk();
      if (!sdk) return;
      if (next) sdk.resumeVideo();
      else sdk.pauseVideo(true);
    } catch {
      // No active session — the state still flips for the next call.
    }
  }, [videoEnabled]);

  const switchCamera = useCallback(() => {
    try {
      getCallingSdk()?.switchCamera();
    } catch {
      // No active session.
    }
  }, []);

  //
  // ——— Call history ———
  //

  const refreshCallHistory = useCallback(async () => {
    setLoadingCallHistory(true);
    try {
      const peers = conversationsRef.current
        .filter((conversation) => conversation.type === 'user')
        .slice(0, 25);
      const myId = userRef.current?.id;

      const settled = await Promise.allSettled(
        peers.map(async (peer) => {
          const builder = new (CometChat as any).MessagesRequestBuilder()
            .setUID(peer.id)
            .setCategories(['call'])
            .setLimit(10);
          const messages = (await builder.build().fetchPrevious()) || [];
          return messages.map(
            (message: any): CallHistoryEntry => ({
              id: String(message?.getId?.() ?? `${peer.id}-${messageSentAt(message)}`),
              peerId: peer.id,
              peerName: peer.name,
              peerImage: peer.image,
              video: messageKind(message) === 'video',
              outgoing: message?.getSender?.()?.getUid?.() === myId,
              action: callMessageAction(message),
              timestamp: messageSentAt(message),
            })
          );
        })
      );

      const seen = new Set<string>();
      const merged = settled
        .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
        .filter((entry) => {
          if (!entry.id || seen.has(entry.id)) return false;
          seen.add(entry.id);
          return true;
        })
        .sort((a, b) => b.timestamp - a.timestamp);
      setCallHistory(merged);
    } catch {
      // Keep whatever history is already on screen.
    } finally {
      setLoadingCallHistory(false);
    }
  }, []);

  //
  // ——— Stories (backed by the public STORIES_GUID group; media always rides
  // the encrypted carrier, so the CDN never sees a story's bytes) ———
  //

  const ensureStoriesGroup = useCallback(async () => {
    if (storiesGroupReadyRef.current) return;
    let known = false;
    try {
      await (CometChat.getGroup as any)(STORIES_GUID);
      known = true;
    } catch {
      try {
        const group = new (CometChat as any).Group(STORIES_GUID, 'Stories', 'public');
        await (CometChat.createGroup as any)(group);
        known = true;
      } catch {
        // Another member may have created it first — joining below covers that
        // once a retry can see the group.
      }
    }
    if (!known) return;
    try {
      await (CometChat.joinGroup as any)(STORIES_GUID, 'public', '');
    } catch {
      // Already a member is the expected failure here.
    }
    storiesGroupReadyRef.current = true;
  }, []);

  const refreshStories = useCallback(async (): Promise<boolean> => {
    setStoriesLoading(true);
    try {
      await ensureStoriesGroup();
      const cutoff = Date.now() - STORY_WINDOW_MS;
      const builder = new (CometChat as any).MessagesRequestBuilder()
        .setGUID(STORIES_GUID)
        .setLimit(50)
        .setCategories(['custom'])
        .setTypes([SECURE_START, SECURE_CHUNK]);
      const messages = (await builder.build().fetchPrevious()) || [];

      // History rehydrates through the same pipeline as a thread: chunks of
      // stories that streamed in while the app was closed still reassemble,
      // and the announces are what the rows below read.
      for (const message of messages) {
        ingestSecuredMessage(message, STORIES_GUID);
      }

      const authors = new Map<string, StoryAuthor>();
      for (const message of messages) {
        // Chunks surface through the reassembly store; only an announce row.
        const carrierType =
          typeof message?.getType === 'function' ? message.getType() : message?.type;
        if (carrierType !== SECURE_START) continue;
        const at = messageSentAt(message);
        if (at < cutoff) continue;
        const data = customPayloadOf(message?.getData?.());
        const mediaId = String(data?.id || '');
        if (!mediaId) continue;
        const sender = message?.getSender?.();
        const senderId = sender?.getUid?.() || '';
        if (!senderId) continue;

        const mine = senderId === userRef.current?.id;
        let author = authors.get(senderId);
        if (!author) {
          author = {
            senderId,
            name: mine
              ? userRef.current?.name || senderId
              : sender?.getName?.() || senderId,
            image: mine
              ? userRef.current?.image || undefined
              : sender?.getAvatar?.() || undefined,
            mine,
            items: [],
          };
          authors.set(senderId, author);
        }
        author.items.push({
          id: mediaId,
          type: String(data?.kind) === 'video' ? 'video' : 'image',
          at,
        });
      }

      const list = [...authors.values()];
      list.forEach((author) => author.items.sort((a, b) => a.at - b.at));
      list.sort(
        (a, b) =>
          (b.items[b.items.length - 1]?.at || 0) - (a.items[a.items.length - 1]?.at || 0)
      );
      setStories(list);
      return true;
    } catch {
      // Keep whatever is already on screen; the caller can show a hint.
      return false;
    } finally {
      setStoriesLoading(false);
    }
  }, [ensureStoriesGroup]);

  const sendStory = useCallback(
    async (media: OutgoingMedia) => {
      if (!media?.uri) return;
      await ensureStoriesGroup();
      // Stories ride the same encrypted carrier as thread media: the bytes are
      // sealed under the group's derived key, so nothing unencrypted reaches
      // CometChat's CDN. The explicit type is what keeps the key group-tagged.
      await sendSecureMedia(STORIES_GUID, media, 'group');
      await refreshStories();
    },
    [ensureStoriesGroup, refreshStories, sendSecureMedia]
  );

  //
  // ——— Session lifecycle ———
  //

  useEffect(() => {
    if (!identity) {
      setLoading(false);
      setLoadingConversations(false);
      setSessionReady(false);
      setChatClient(null);
      setCurrentUser(null);
      userRef.current = null;
      setConversations([]);
      setMessagesByConversation(new Map());
      setCallHistory([]);
      setStories([]);
      storiesGroupReadyRef.current = false;
      resetCall();
      return;
    }

    let cancelled = false;

    const initialize = async () => {
      try {
        const appId = process.env.EXPO_PUBLIC_COMETCHAT_APP_ID;
        const region = process.env.EXPO_PUBLIC_COMETCHAT_REGION || 'us';
        if (!appId) {
          setError('CometChat App ID is not configured');
          setLoading(false);
          return;
        }

        const authKey = getCallAuthKey();
        if (!authKey) {
          setError('CometChat Auth Key is not configured');
          setLoading(false);
          return;
        }

        const normalizedUserId = identity.uid;
        const settings = new (CometChat.AppSettingsBuilder as any)()
          .subscribePresenceForAllUsers()
          .setRegion(region)
          .build();

        if (!initPromise) {
          initPromise = Promise.resolve((CometChat.init as any)(appId, settings));
        }
        await initPromise;

        const existingUser = await (CometChat.getLoggedinUser as any)();
        if (!existingUser) {
          const cometUser = new (CometChat as any).User(normalizedUserId);
          cometUser.setName(identity.name || normalizedUserId);
          if (identity.image) {
            cometUser.setAvatar(identity.image);
          }
          try {
            await (CometChat.createUser as any)(cometUser, authKey);
          } catch {
            // The user already exists (or creation is not permitted) — login still works.
          }
        }

        await (CometChat.login as any)(normalizedUserId, authKey);
        if (cancelled) return;

        const sessionUser = await (CometChat.getLoggedinUser as any)();
        const effectiveUser: CometChatUser = {
          id: normalizedUserId,
          name: sessionUser?.getName?.() || identity.name,
          image: sessionUser?.getAvatar?.() || identity.image,
          username: normalizedUserId,
        };
        userRef.current = effectiveUser;
        setChatClient(sessionUser ?? null);
        setCurrentUser(effectiveUser);
        setSessionReady(true);
        // Hand this device's FCM token to CometChat so the push extension can
        // reach us while backgrounded. No-ops until Firebase is in the build.
        void registerDeviceForPush();
        await refreshConversations();
        if (!cancelled) setLoading(false);
      } catch (caught) {
        if (!cancelled) {
          const message = describeError(caught, 'Unable to sign in to CometChat');
          // CometChat collapses transport, DNS and server faults into the same
          // "check your internet" style message, so keep the raw shape visible
          // in Metro - without it a server-side 4xx is indistinguishable from
          // the device being offline.
          console.warn('[CometChat] session failed', {
            message,
            code: (caught as any)?.code,
            name: (caught as any)?.name,
            stack: (caught as any)?.stack,
          });
          setError(message);
          // A UID that cannot be created or logged into is not a usable
          // identity - drop it so the login screen comes back instead of
          // leaving the app stuck on a spinner.
          setAuthError(message);
          setIdentity(null);
          void clearStoredIdentity();
          setLoading(false);
        }
      }
    };

    void initialize();

    return () => {
      cancelled = true;
      setSessionReady(false);
      clearRingTimer();
      resetCall();
      storiesGroupReadyRef.current = false;
      void unregisterDeviceFromPush();
      // Only meaningful once a session exists; logging out without one
      // rejects with USER_NOT_LOGGED_IN, so the rejection is swallowed.
      if (sessionReady) {
        try {
          void Promise.resolve((CometChat.logout as any)()).catch(() => {});
        } catch {
          // ignore
        }
      }
    };
  }, [identity, refreshConversations, clearRingTimer, resetCall]);

  /**
   * Who a message belongs to, conversation-wise. Shared by the realtime
   * listener and the sealed-text resolver — the latter runs outside any
   * effect's closure, so it lives on the provider proper.
   */
  const resolveMessageConversationId = useCallback((message: any): string => {
    const receiverType = message?.getReceiverType?.() || 'user';
    if (receiverType === 'group') {
      return (
        message?.getReceiver?.()?.getGuid?.() ||
        message?.getConversationId?.() ||
        ''
      );
    }
    const senderId = message?.getSender?.()?.getUid?.();
    const myId = userRef.current?.id;
    if (senderId && senderId !== myId) return senderId;
    return message?.getReceiverId?.() || message?.getConversationId?.() || '';
  }, []);

  useEffect(() => {
    if (!sessionReady) return;

    const resolveConversationId = resolveMessageConversationId;

    const listener = new (CometChat as any).MessageListener({
      onTextMessageReceived: (message: any) => {
        const conversationId = resolveConversationId(message);
        if (!conversationId) return;
        appendMessage(conversationId, message);
        void refreshConversations();
      },
      onMediaMessageReceived: (message: any) => {
        const conversationId = resolveConversationId(message);
        if (!conversationId) return;
        appendMessage(conversationId, message);
        void refreshConversations();
      },
      onCustomMessageReceived: (message: any) => {
        const conversationId = resolveConversationId(message);
        if (!conversationId) return;
        // Acarrier split: if this message carries secured media, its payload
        // surfaces through the reassembly store, and the message itself lands
        // so the secure bubble has something to hang progress on.
        const carried = ingestSecuredMessage(message, conversationId);
        if (carried) {
          appendMessage(conversationId, message);
          return;
        }
        // Other custom messages (CometChat's own interactive types) join the
        // thread like any other category.
        appendMessage(conversationId, message);
        void refreshConversations();
      },
      onTypingStarted: (notification: any) => {
        const conversationId = resolveConversationId(notification);
        const senderId = notification?.getSender?.()?.getUid?.();
        if (!conversationId || !senderId || senderId === userRef.current?.id) return;
        markTyping(conversationId, senderId);
      },
      onTypingEnded: (notification: any) => {
        const conversationId = resolveConversationId(notification);
        const senderId = notification?.getSender?.()?.getUid?.();
        if (!conversationId || !senderId) return;
        dropTyping(conversationId, senderId);
      },
      // Read/delivery receipts stream in on the same realtime channel, and
      // concern *our* outgoing messages only — the sender gets the event when
      // the peer delivers or reads. Record onto the shared receipt store so
      // the tick in the thread updates live.
      onMessageRead: (receipt: any) => recordReceiptEvent(receipt, 'read'),
      onMessageDelivered: (receipt: any) => recordReceiptEvent(receipt, 'delivered'),
    });

    (CometChat as any).addMessageListener?.(MESSAGE_LISTENER_ID, listener);
    return () => {
      (CometChat as any).removeMessageListener?.(MESSAGE_LISTENER_ID);
    };
  }, [sessionReady, appendMessage, refreshConversations, markTyping, dropTyping, recordReceiptEvent]);

  // The privacy layer cannot derive a conversation's key by itself: only the
  // provider knows the local uid and the per-conversation types, and those are
  // exactly the derivation's inputs.
  useEffect(() => {
    if (!sessionReady) {
      registerSecureKeyResolver(null);
      return;
    }
    registerSecureKeyResolver((conversationId: string) =>
      conversationKey(
        conversationId,
        participantTagFor(
          conversationId,
          // The stories group is the one conversation deliberately kept out of
          // the list (it is not meant to open as a chat), so its type cannot
          // resolve from there — and it is always a group. Deriving through the
          // fallback would silently produce a different key on the receiver.
          conversationId === STORIES_GUID ? 'group' : resolveConversationType(conversationId),
          userRef.current?.id ?? null
        )
      )
    );
    return () => {
      registerSecureKeyResolver(null);
    };
  }, [sessionReady, resolveConversationType]);

  // Sealed text resolves through the same conversation keys as media. Per-id
  // decrypted cache lives in lib/secure-media and clears when the session
  // tears down, so plaintext never outlives a login.
  useEffect(() => {
    if (!sessionReady) {
      registerSealedTextResolver(null);
      return;
    }
    registerSealedTextResolver((message: any) => {
      if (!isSecureText(message)) return {};
      const conversationId = resolveMessageConversationId(message);
      if (!conversationId) return {};
      const data = customPayloadOf(
        typeof message?.getData === 'function' ? message.getData() : message?.data
      );
      try {
        const plain = openTextEnvelope(
          data,
          conversationKey(
            conversationId,
            participantTagFor(
              conversationId,
              resolveConversationType(conversationId),
              userRef.current?.id ?? null
            )
          )
        );
        if (plain) return { text: plain };
      } catch {
        // fall through to the failed verdict
      }
      // Diagnostic (shapes only - the payload is ciphertext): why the
      // conversation key did not open this envelope.
      console.warn(
        '[sealed-text] open failed',
        JSON.stringify({
          conversationId,
          sender: message?.getSender?.()?.getUid?.() ?? null,
          receiverId:
            (typeof message?.getReceiverId === 'function'
              ? message.getReceiverId()
              : null) ?? null,
          conversationIdField:
            (typeof message?.getConversationId === 'function'
              ? message.getConversationId()
              : null) ?? null,
          dataKind: Array.isArray(data)
            ? 'array'
            : data && typeof data === 'object'
              ? Object.keys(data).join(',')
              : typeof data,
        })
      );
      return { failed: true };
    });
    return () => {
      registerSealedTextResolver(null);
    };
  }, [sessionReady, resolveMessageConversationId, resolveConversationType]);

  useEffect(() => {
    if (!sessionReady) return;

    const listener = new (CometChat as any).CallListener({
      onIncomingCallReceived: (call: any) => {
        const sessionId = call?.getSessionId?.() || call?.sessionId || '';
        if (!sessionId) return;

        // One call at a time: anything already ringing or live rejects as busy.
        const busy =
          Boolean(incomingCallRef.current) ||
          rtcStateRef.current === 'connecting' ||
          rtcStateRef.current === 'joined';
        if (busy) {
          void (async () => {
            try {
              await (CometChat.rejectCall as any)(sessionId, 'busy');
            } catch {
              // The call may already be gone.
            }
          })();
          return;
        }

        const sender = call?.getSender?.();
        const callerId = sender?.getUid?.() || call?.getReceiverId?.() || '';
        const type =
          (typeof call.getType === 'function' ? call.getType() : call.type) || 'audio';
        syncIncoming({
          sessionId,
          peerUserId: callerId,
          callerId,
          video: type !== 'audio',
          callerName: sender?.getName?.() || undefined,
          callerImage: sender?.getAvatar?.() || undefined,
        });
        syncRtc('idle');
      },
      onOutgoingCallAccepted: (call: any) => {
        const session = activeCallRef.current;
        if (!session) return;
        if (rtcStateRef.current === 'joined') return;
        const sessionId = call?.getSessionId?.() || session.sessionId;
        void beginCallSession(sessionId, session.video);
      },
      onOutgoingCallRejected: () => {
        try {
          (CometChat.clearActiveCall as any)();
        } catch {
          // Best-effort local cleanup.
        }
        setCallError('Call declined');
        finishCall();
      },
      onIncomingCallCancelled: () => {
        // Once a session is live the cancel belongs to that flow, not the ring.
        if (activeCallRef.current) return;
        syncIncoming(null);
      },
      onCallEndedMessageReceived: () => {
        const state = rtcStateRef.current;
        if (state !== 'connecting' && state !== 'joined') return;
        try {
          (CometChat.clearActiveCall as any)();
        } catch {
          // Best-effort local cleanup.
        }
        if (state === 'joined') {
          try {
            getCallingSdk()?.leaveSession();
          } catch {
            // Best-effort media teardown.
          }
        }
        finishCall();
      },
    });

    (CometChat as any).addCallListener?.(CALL_LISTENER_ID, listener);
    return () => {
      (CometChat as any).removeCallListener?.(CALL_LISTENER_ID);
    };
  }, [sessionReady, beginCallSession, finishCall, syncIncoming, syncRtc]);

  const value = useMemo<CometChatContextType>(
    () => ({
      user: currentUser,
      chatClient,
      sessionReady,
      loginAs,
      signOut,
      authError,
      conversations,
      loadingConversations,
      loading,
      error,
      messagesByConversation,
      loadingMessages,
      sendTextMessage,
      sendMediaMessage,
      sendSecureMedia,
      getOrCreateConversation,
      createGroup,
      groups,
      loadingGroups,
      refreshGroups,
      blockedIds,
      refreshBlockedUsers,
      refreshPushPreferences,
      toggleBlockUser,
      isBlocked: (uid: string) => blockedIds.includes(uid),
      mutedConversations,
      setConversationMuted,
      pushEnabled,
      setPushEnabled,
      clearConversation,
      searchUsers,
      updateCurrentUserProfile,
      refreshConversations,
      refreshMessages,
      markConversationRead,
      markConversationUnread,
      typingByConversation,
      sendTyping,
      toggleReaction,
      deleteMessage,
      startCall,
      endCall,
      resetCall,
      toggleAudio,
      toggleVideo,
      switchCamera,
      rtcState,
      audioEnabled,
      videoEnabled,
      localUid,
      activeCall,
      incomingCall,
      acceptIncomingCall,
      rejectIncomingCall,
      callToken,
      callSettings,
      callError,
      callHistory,
      loadingCallHistory,
      refreshCallHistory,
      stories,
      storiesLoading,
      refreshStories,
      sendStory,
      messageReceipts,
      getMessageReceipts,
      markMessageAsRead,
    }),
    [
      currentUser,
      chatClient,
      sessionReady,
      loginAs,
      signOut,
      authError,
      conversations,
      loadingConversations,
      loading,
      error,
      messagesByConversation,
      loadingMessages,
      sendTextMessage,
      sendMediaMessage,
      sendSecureMedia,
      getOrCreateConversation,
      createGroup,
      groups,
      loadingGroups,
      refreshGroups,
      searchUsers,
      updateCurrentUserProfile,
      refreshConversations,
      refreshMessages,
      markConversationRead,
      markConversationUnread,
      typingByConversation,
      sendTyping,
      toggleReaction,
      deleteMessage,
      startCall,
      endCall,
      resetCall,
      toggleAudio,
      toggleVideo,
      switchCamera,
      rtcState,
      audioEnabled,
      videoEnabled,
      localUid,
      activeCall,
      incomingCall,
      acceptIncomingCall,
      rejectIncomingCall,
      callToken,
      callSettings,
      callError,
      callHistory,
      loadingCallHistory,
      refreshCallHistory,
      stories,
      storiesLoading,
      refreshStories,
      sendStory,
      messageReceipts,
      getMessageReceipts,
      markMessageAsRead,
    ]
  );

  return <CometChatContext.Provider value={value}>{children}</CometChatContext.Provider>;
};
