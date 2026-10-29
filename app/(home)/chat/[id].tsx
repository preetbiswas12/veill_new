import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';

import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import CustomMessageInput from '@/components/CustomMessageInput';
import DateDivider, { getDateKey } from '@/components/DateDivider';
import MessageActions from '@/components/MessageActions';
import ChatWallpaper from '@/components/ChatWallpaper';
import MessageBubble, { BubbleEntrance } from '@/components/MessageBubble';
import ToastHost from '@/components/ToastHost';
import MessageListHeader from '@/components/MessageListHeader';
import Screen from '@/components/Screen';
import TypingIndicator from '@/components/TypingIndicator';
import DemoMessageBubble from '@/components/DemoMessageBubble';
import { demoThread, type DemoMsg } from '@/lib/demo-thread';
import {
  getMessageBody,
  getMessageReceiptLabel,
  getMessageReactions,
  getMessageText,
  getMessageTimestamp,
  useCometChat,
} from '@/hooks/useCometChat';
import { useStarredMessages } from '@/hooks/useStarredMessages';
import { useTheme } from '@/hooks/useTheme';
import { showAlertDialog } from '@/components/AlertDialog';

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
    }
  | { kind: 'demo'; key: string; demo: DemoMsg; isOwn: boolean };

const senderOf = (message: any) => message?.getSender?.()?.getUid?.() || '';

const ChatScreen = () => {
  const { colors } = useTheme();
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
    localUid,
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
  // Android 15 enforces edge-to-edge for targetSdk 35, so the window never
  // resizes around the IME. RN core still reports the keyboard through the
  // WindowInsets API — and its height already comes net of the navigation
  // bar, so the composer pads itself by exactly that number.
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  // Demo rows are local-only; long-pressing one parks it here so the shared
  // action bar can handle it without touching CometChat.
  const [demoSelected, setDemoSelected] = useState<DemoMsg | null>(null);
  const { isStarred, toggle: toggleStarred } = useStarredMessages();
  const [starToast, setStarToast] = useState<string | null>(null);
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

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', (event) => {
      // Android 14 and below: windowSoftInputMode=adjustResize still resizes
      // the window around the IME, so the system lifts the composer flush on
      // its own. Padding here as well doubled the lift - the composer ended
      // up one keyboard height above the keyboard (measured on the user's
      // Android 13 device). Only Android 15+ enforces edge-to-edge, where the
      // window never resizes and the JS pad is the only lifter. (iOS uses the
      // behavior="padding" path and never reaches this.)
      if (Platform.OS !== 'android' || Number(Platform.Version) < 35) return;

      // Android 15+: pad by the keyboard's visible top edge (screenY), the
      // stable fact across the IME's two didShow events (whose reported
      // height grows by the gesture-bar inset once the window settles), net
      // of the bottom inset the Screen already reserves under this view.
      // screenY is missing or zero on a few OEM keyboards, so fall back to
      // the reported height.
      const screenH = Dimensions.get('screen').height;
      const screenY = event.endCoordinates.screenY;
      let pad = Math.round(event.endCoordinates.height) || 0;
      if (screenY > 0 && screenY < screenH) {
        const fromTop = Math.round(screenH - screenY) - insets.bottom;
        if (fromTop > 0) pad = fromTop;
      }
      setKeyboardHeight(pad);
    });
    const hideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [insets.bottom]);

  const isDemoThread =
    conversationId.toLowerCase() === 'alice' || title.toLowerCase() === 'alice';

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

    // Demo content: Alice's thread appends the local placeholder rows below
    // the real history, so the media bubbles can be reviewed without a
    // second signed-in device.
    if (isDemoThread) {
      for (const [index, demo] of demoThread().entries()) {
        const dateKey = getDateKey(demo.at);
        if (dateKey !== currentDateKey) {
          result.push({ kind: 'divider', key: `divider-${dateKey}`, timestamp: demo.at });
          currentDateKey = dateKey;
        }
        result.push({
          kind: 'demo',
          key: `demo-${demo.kind}-${index}-${demo.id}`,
          demo,
          isOwn: demo.side === 'own',
        });
      }
    }

    return result;
  }, [messages, user?.id, isDemoThread]);

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
    if (demoSelected?.kind === 'text' && demoSelected.text) {
      await Clipboard.setStringAsync(demoSelected.text);
      setDemoSelected(null);
      return;
    }
    if (!selected) return;
    const text = getMessageBody(selected.message);
    if (!text) return;
    await Clipboard.setStringAsync(text);
  }, [selected, demoSelected]);

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

  // CometChat 4.1.0 has no star action on the client SDK, so starring is a
  // local store (hooks/useStarredMessages.ts) the same way Favourites is.
  const onStarSelected = useCallback(() => {
    if (demoSelected) {
      setStarToast('Demo content is local — starring needs a real message');
      setDemoSelected(null);
      return;
    }
    if (!selected) return;
    const id = String(selected.message?.getId?.() ?? selected.message?.id ?? '');
    if (!id) return;
    void toggleStarred({
      id,
      conversationId,
      body: getMessageBody(selected.message) || getMessageText(selected.message) || '',
      senderName:
        (typeof selected.message?.getSender === 'function'
          ? selected.message.getSender()
          : undefined)?.getName?.() ||
        senderOf(selected.message) === localUid ? 'You' : title,
      timestamp: getMessageTimestamp(selected.message),
    }).then((nowStarred) => {
      setStarToast(nowStarred ? 'Message starred' : 'Star removed');
    });
  }, [demoSelected, selected, conversationId, localUid, title, toggleStarred]);

  const onForwardSelected = useCallback(() => {
    if (!selected) return;
    const body = getMessageBody(selected.message);
    if (!body) return;
    // Forwarding to a different conversation is the forward screen's job; pass
    // the text so it can be pre-filled on arrival.
    router.push({
      pathname: '/new-message',
      params: { forward: body },
    });
  }, [selected, router]);

  const onReactSelected = useCallback(
    (reaction: string) => {
      // Demo rows are local; reacting would imply a CometChat mutation.
      if (demoSelected) {
        setStarToast('Demo content is local — reactions need a real message');
        setDemoSelected(null);
        return;
      }
      if (!selected) return;
      void toggleReaction(conversationId, selected.message, reaction).catch(() => {
        showAlertDialog('Could not react', 'The reaction could not be saved.');
      });
    },
    [demoSelected, selected, conversationId, toggleReaction]
  );

  const onDeleteSelected = useCallback(() => {
    if (demoSelected) {
      setStarToast('Demo content is local — there is nothing to delete');
      setDemoSelected(null);
      return;
    }
    if (!selected) return;
    showAlertDialog('Delete message', 'This removes the message for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteMessage(conversationId, selected.message).catch(() => {
            showAlertDialog('Could not delete', 'The message could not be deleted.');
          });
        },
      },
    ]);
  }, [demoSelected, selected, conversationId, deleteMessage]);

  // First-render rows mount without any entrance; only messages that arrive
  // after the thread is already on screen play the fade-and-rise. The priming
  // scan runs during render rather than an effect so that the initial history
  // batch — which lands in the very first non-empty payload — is marked seen
  // before its rows can render.
  const seenRowsRef = useRef<Set<string>>(new Set());
  const rowsPrimedRef = useRef(false);
  if (items.length > 0 && !rowsPrimedRef.current) {
    rowsPrimedRef.current = true;
    for (const row of items) seenRowsRef.current.add(row.key);
  }

  const renderItem = ({ item }: { item: ThreadItem }) => {
    const rowIsNew = !seenRowsRef.current.has(item.key);
    if (rowIsNew) seenRowsRef.current.add(item.key);

    if (item.kind === 'divider') {
      return (
        <BubbleEntrance appear={rowIsNew}>
          <DateDivider timestamp={item.timestamp} />
        </BubbleEntrance>
      );
    }

    if (item.kind === 'demo') {
      return (
        <BubbleEntrance appear={rowIsNew}>
          <DemoMessageBubble
            demo={item.demo}
            isOwn={item.isOwn}
            onLongPress={() => {
              void Haptics.selectionAsync();
              setDemoSelected(item.demo);
            }}
          />
        </BubbleEntrance>
      );
    }

    const messageId = item.message?.getId?.();
    const receiptLabel =
      item.isOwn && item.isGroupEnd && messageId
        ? getMessageReceiptLabel(messageReceipts.get(String(messageId)))
        : undefined;

    return (
      <BubbleEntrance appear={rowIsNew}>
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
      </BubbleEntrance>
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
              style={{ color: isTyping ? colors['product'] : colors['text-muted'] }}
              numberOfLines={1}
            >
              {isTyping ? 'typing\u2026' : 'tap here for contact info'}
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
        <View className="bg-surface-muted px-4 py-2 border-b-hair border-separator">
          <Text className="text-caption text-text-error">{error}</Text>
        </View>
      ) : null}

      <KeyboardAvoidingView
        className="flex-1"
        style={
          // Android 15+ edge-to-edge never resizes the window: pad by the
          // keyboard's visible top edge (see the listener above), net of the
          // inset the Screen reserves under this view. Android 14 and below
          // resize natively - keyboardHeight stays 0 there.
          Platform.OS === 'android' && keyboardHeight > 0
            ? { paddingBottom: keyboardHeight }
            : undefined
        }
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        // The offset is the distance from this view's top to the window's top:
        // this view starts BELOW the contact header, which is itself the
        // status-bar inset plus the 48pt header row. A fixed 88 was wrong on
        // every notched device, where the composer visibly hopped when the
        // keyboard opened.
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 48 : 0}
      >
        <View className="flex-1 bg-chat-bg">
          {/* The design's wallpaper is #EFEAE2 with a doodle pattern at ~6%. */}
          <ChatWallpaper />
          {isLoadingMessages && messages.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={colors['product']} />
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
                // Clearance below the last bubble so it never sits flush against
                // the composer, which is a sibling of this list.
                paddingBottom: 12,
              }}
              onContentSizeChange={() => scrollToBottom(false)}
            />
          )}

          {showScrollDown ? (
            <View className="absolute bottom-3 right-3">
              <Button
                variant="plain"
                onPress={jumpToLatest}
                className="w-11 h-11 rounded-full items-center justify-center bg-surface shadow-lg border-hair border-separator"
                accessibilityLabel="Jump to latest message"
              >
                <Feather name="chevron-down" size={22} color={colors['text-muted']} />
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
        visible={Boolean(selected) || Boolean(demoSelected)}
        canCopy={selected?.canCopy || demoSelected?.kind === 'text'}
        canDelete={Boolean(selected) || Boolean(demoSelected)}
        canReply={Boolean(selected)}
        activeReactions={getMessageReactions(selected?.message)
          .filter((reaction) => reaction.mine)
          .map((reaction) => reaction.reaction)}
        onClose={() => {
          setSelected(null);
          setDemoSelected(null);
        }}
        onCopy={() => void onCopySelected()}
        onReact={onReactSelected}
        onReply={onReplySelected}
        onDelete={onDeleteSelected}
        starred={
          Boolean(selected) &&
          isStarred(String(selected?.message?.getId?.() ?? selected?.message?.id ?? ''))
        }
        onStar={onStarSelected}
        // Forwarding rides on the message having text to carry; secured-media
        // carriers have none, so the row stays hidden rather than dead.
        onForward={
          selected && getMessageBody(selected.message) ? onForwardSelected : undefined
        }
      />
      {/* A quiet confirmation, so actions with no other visible outcome - starring
          in particular - do not read as broken. */}
      {starToast ? <ToastHost message={starToast} onDone={() => setStarToast(null)} /> : null}
    </Screen>
  );
};

export default ChatScreen;
