import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';

import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import CustomMessageInput from '@/components/CustomMessageInput';
import DateDivider, { getDateKey } from '@/components/DateDivider';
import MessageActions from '@/components/MessageActions';
import MessageBubble from '@/components/MessageBubble';
import MessageListHeader from '@/components/MessageListHeader';
import Screen from '@/components/Screen';
import TypingIndicator from '@/components/TypingIndicator';
import {
  getMessageBody,
  getMessageReceiptLabel,
  getMessageReactions,
  getMessageText,
  getMessageTimestamp,
  useCometChat,
} from '@/hooks/useCometChat';

/** Messages closer together than this collapse into one visual group. */
const GROUP_WINDOW_MS = 5 * 60 * 1000;

type ThreadItem =
  | { kind: 'divider'; key: string; timestamp: number }
  | {
      kind: 'message';
      key: string;
      message: any;
      isOwn: boolean;
      isGroupStart: boolean;
      isGroupEnd: boolean;
      showAvatar: boolean;
      senderName: string;
      receiptLabel?: string;
    };

const senderOf = (message: any) => message?.getSender?.()?.getUid?.() || '';

const ChatScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    image?: string;
    type?: string;
  }>();
  const conversationId = typeof params.id === 'string' ? params.id : '';

  const {
    conversations,
    messagesByConversation,
    loadingMessages,
    refreshMessages,
    markConversationRead,
    toggleReaction,
    deleteMessage,
    typingByConversation,
    messageReceipts,
    getMessageReceipts,
    user,
    error,
  } = useCometChat();

  const conversation = useMemo(
    () => conversations.find((item) => item.id === conversationId),
    [conversations, conversationId]
  );

  const conversationType =
    (typeof params.type === 'string' && params.type) || conversation?.type || 'user';
  const title =
    (typeof params.name === 'string' && params.name) ||
    conversation?.name ||
    conversationId;
  const imageUrl =
    (typeof params.image === 'string' && params.image) ||
    conversation?.image ||
    undefined;

  const messages = useMemo(() => {
    const list = messagesByConversation.get(conversationId) || [];
    return [...list].sort((a, b) => getMessageTimestamp(a) - getMessageTimestamp(b));
  }, [messagesByConversation, conversationId]);

  const isLoadingMessages = Boolean(loadingMessages.get(conversationId));
  const listRef = useRef<FlatList<ThreadItem>>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [selected, setSelected] = useState<{ message: any; canCopy: boolean } | null>(null);
  // Drives the design's quote bar above the composer.
  const [replyTo, setReplyTo] = useState<{
    messageId: string;
    sender: string;
    text: string;
  } | null>(null);
  const fetchedReceiptsRef = useRef<Set<string>>(new Set());
  // Captured once so the "jump to latest" badge reflects what was unread on
  // entry — the thread marks the conversation read immediately after mount.
  const [unreadOnEntry] = useState(
    () => conversations.find((item) => item.id === conversationId)?.unreadCount || 0
  );

  useEffect(() => {
    if (!conversationId) return;
    void refreshMessages(conversationId, conversationType);
    void markConversationRead(conversationId, conversationType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, conversationType]);

  const items = useMemo<ThreadItem[]>(() => {
    const result: ThreadItem[] = [];
    let currentDateKey: string | null = null;

    messages.forEach((message, index) => {
      const timestamp = getMessageTimestamp(message);
      const dateKey = getDateKey(timestamp);
      if (dateKey !== currentDateKey) {
        result.push({ kind: 'divider', key: `divider-${dateKey}`, timestamp });
        currentDateKey = dateKey;
      }

      const previous = index > 0 ? messages[index - 1] : null;
      const next = index < messages.length - 1 ? messages[index + 1] : null;
      const adjacent = (other: any) => {
        if (!other) return false;
        if (senderOf(other) !== senderOf(message)) return false;
        const delta = Math.abs(timestamp - getMessageTimestamp(other));
        return delta < GROUP_WINDOW_MS && getDateKey(getMessageTimestamp(other)) === dateKey;
      };

      const senderId = senderOf(message);
      result.push({
        kind: 'message',
        key: String(message?.getId?.() ?? `msg-${index}`),
        message,
        isOwn: senderId === user?.id,
        isGroupStart: !adjacent(previous),
        isGroupEnd: !adjacent(next),
        showAvatar: true,
        senderName: message?.getSender?.()?.getName?.() || 'Unknown',
      });
    });

    return result;
  }, [messages, user?.id]);

  // Receipts only matter for the most recent outgoing message.
  useEffect(() => {
    const lastOwn = [...messages].reverse().find((message) => senderOf(message) === user?.id);
    const messageId = lastOwn?.getId?.();
    if (!messageId || fetchedReceiptsRef.current.has(messageId)) return;
    fetchedReceiptsRef.current.add(messageId);
    void getMessageReceipts(String(messageId));
  }, [messages, user?.id, getMessageReceipts]);

  const typingUids = typingByConversation.get(conversationId) || [];
  const isTyping = typingUids.length > 0;

  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() =>
      listRef.current?.scrollToEnd({ animated: animated && messages.length > 1 })
    );
  }, [messages.length]);

  useEffect(() => {
    scrollToBottom(false);
  }, [scrollToBottom]);

  const jumpToLatest = useCallback(() => {
    scrollToBottom();
    setShowScrollDown(false);
    void markConversationRead(conversationId, conversationType);
  }, [scrollToBottom, conversationId, conversationType, markConversationRead]);

  // The chat header only routes to the call screen — it never starts a call.
  const openCallScreen = useCallback(
    (video: boolean) => {
      if (conversationType !== 'user') return;
      router.push({
        pathname: '/call/[id]',
        params: {
          id: conversationId,
          name: title,
          image: imageUrl || '',
          video: video ? '1' : '0',
          direction: 'outgoing',
        },
      });
    },
    [conversationType, conversationId, router, title, imageUrl]
  );

  const onCopySelected = useCallback(async () => {
    if (!selected) return;
    const text = getMessageBody(selected.message);
    if (!text) return;
    await Clipboard.setStringAsync(text);
  }, [selected]);

  // The design's reply flow: quote the selected message in the bar above the
  // composer, then send the next message as its reply.
  const onReplySelected = useCallback(() => {
    if (!selected) return;
    const sender =
      (typeof selected.message?.getSender === 'function'
        ? selected.message.getSender()
        : undefined)?.getName?.() ||
      getMessageText(selected.message) ||
      'Message';
    setReplyTo({
      messageId: String(selected.message?.getId?.() ?? selected.message?.id ?? ''),
      sender,
      text: getMessageBody(selected.message) || getMessageText(selected.message) || '',
    });
  }, [selected]);

  const onReactSelected = useCallback(
    (reaction: string) => {
      if (!selected) return;
      void toggleReaction(conversationId, selected.message, reaction).catch(() => {
        Alert.alert('Could not react', 'The reaction could not be saved.');
      });
    },
    [selected, conversationId, toggleReaction]
  );

  const onDeleteSelected = useCallback(() => {
    if (!selected) return;
    Alert.alert('Delete message', 'This removes the message for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteMessage(conversationId, selected.message).catch(() => {
            Alert.alert('Could not delete', 'The message could not be deleted.');
          });
        },
      },
    ]);
  }, [selected, conversationId, deleteMessage]);

  const renderItem = ({ item }: { item: ThreadItem }) => {
    if (item.kind === 'divider') return <DateDivider timestamp={item.timestamp} />;

    const messageId = item.message?.getId?.();
    const receiptLabel =
      item.isOwn && item.isGroupEnd && messageId
        ? getMessageReceiptLabel(messageReceipts.get(String(messageId)))
        : undefined;

    return (
      <MessageBubble
        message={item.message}
        isOwn={item.isOwn}
        isGroupStart={item.isGroupStart}
        isGroupEnd={item.isGroupEnd}
        showAvatar={item.showAvatar}
        senderName={item.senderName}
        receiptLabel={receiptLabel}
        onLongPress={() => {
          void Haptics.selectionAsync();
          setSelected({
            message: item.message,
            canCopy: Boolean(getMessageBody(item.message)),
          });
        }}
        onReact={(reaction) => void toggleReaction(conversationId, item.message, reaction)}
      />
    );
  };

  return (
    <Screen className="bg-chat-bg" viewClassName="bg-chat-bg" edges={['left', 'right', 'bottom']}>
      {/* Top contact from the Figma thread: blurred warm panel, 36pt avatar,
          16pt semibold name over a 12pt secondary subtitle, call actions right.
          The Screen excludes the top edge so this row owns the status-bar inset;
          44pt is the design's 98pt header minus its 54pt status bar. */}
      <View
        className="flex-row items-center gap-2.5 pr-[22px] pb-1 bg-panel-blur-warm border-b-hair border-panel-border"
        style={{ paddingTop: insets.top + 4, height: insets.top + 48 }}
      >
        <Button variant="plain" onPress={() => router.back()} className="p-1" hitSlop={8}>
          <Feather name="chevron-left" size={32} color="black" />
        </Button>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/contact-info',
              params: { id: conversationId, name: title, image: imageUrl, type: conversationType },
            })
          }
          accessibilityRole="button"
          accessibilityLabel={`Contact info for ${title}`}
          className="flex-1 min-w-0 flex-row items-center gap-2.5 active:opacity-70"
        >
          <Avatar
            name={title}
            imageUrl={imageUrl}
            size={36}
            fontSize={15}
            placeholderType={conversationType === 'group' ? 'icon' : 'text'}
          />
          <View className="flex-1 min-w-0">
            <Text className="text-body-1 font-semibold text-text-strong" numberOfLines={1}>
              {title}
            </Text>
            <Text
              className="text-body-3"
              style={{ color: isTyping ? '#1dab61' : 'rgba(0,0,0,0.5)' }}
              numberOfLines={1}
            >
              {isTyping ? 'typing…' : 'tap here for contact info'}
            </Text>
          </View>
        </Pressable>
        {conversationType === 'user' ? (
          <View className="flex-row items-center gap-5">
            <Button
              variant="plain"
              onPress={() => openCallScreen(true)}
              accessibilityLabel="Start video call"
            >
              <Feather name="video" size={22} color="black" />
            </Button>
            <Button
              variant="plain"
              onPress={() => openCallScreen(false)}
              accessibilityLabel="Start voice call"
            >
              <Feather name="phone" size={22} color="black" />
            </Button>
          </View>
        ) : null}
      </View>

      {error ? (
        <View className="bg-red-50 px-4 py-2">
          <Text className="text-xs text-red-600">{error}</Text>
        </View>
      ) : null}

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <View className="flex-1">
          {isLoadingMessages && messages.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#1dab61" />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={items}
              keyExtractor={(item) => item.key}
              renderItem={renderItem}
              onScroll={(event) =>
                setShowScrollDown(event.nativeEvent.contentOffset.y < 160)
              }
              scrollEventThrottle={100}
              ListHeaderComponent={
                <MessageListHeader
                  channel={{ id: conversationId, name: title, image: imageUrl }}
                  isDMChannel={conversationType === 'user'}
                />
              }
              ListFooterComponent={isTyping ? <TypingIndicator /> : null}
              ListEmptyComponent={
                <View className="items-center py-8">
                  <Text className="text-sm text-text-muted">
                    No messages yet — say hi 👋
                  </Text>
                </View>
              }
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'flex-end',
                paddingTop: 12,
              }}
              onContentSizeChange={() => scrollToBottom(false)}
            />
          )}

          {showScrollDown ? (
            <View className="absolute bottom-3 right-3">
              <Button
                variant="plain"
                onPress={jumpToLatest}
                className="w-11 h-11 rounded-full items-center justify-center bg-white shadow-lg border border-gray-100"
                accessibilityLabel="Jump to latest message"
              >
                <Feather name="chevron-down" size={22} color="#767779" />
                {unreadOnEntry > 0 ? (
                  <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary items-center justify-center">
                    <Text className="text-[10px] font-semibold text-white">
                      {unreadOnEntry > 99 ? '99+' : unreadOnEntry}
                    </Text>
                  </View>
                ) : null}
              </Button>
            </View>
          ) : null}
        </View>

        <CustomMessageInput
          conversationId={conversationId}
          chatType={conversationType}
          replyTo={replyTo}
          onClearReply={() => setReplyTo(null)}
        />
      </KeyboardAvoidingView>

      <MessageActions
        visible={Boolean(selected)}
        canCopy={selected?.canCopy}
        canDelete={Boolean(selected)}
        canReply={Boolean(selected)}
        activeReactions={getMessageReactions(selected?.message)
          .filter((reaction) => reaction.mine)
          .map((reaction) => reaction.reaction)}
        onClose={() => setSelected(null)}
        onCopy={() => void onCopySelected()}
        onReact={onReactSelected}
        onReply={onReplySelected}
        onDelete={onDeleteSelected}
      />
    </Screen>
  );
};

export default ChatScreen;
