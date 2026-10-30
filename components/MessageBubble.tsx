import { Ionicons } from '@expo/vector-icons';
import clsx from 'clsx';
import { Image } from 'expo-image';
import { Animated, Linking, Pressable, Text, View, type GestureResponderEvent } from 'react-native';
import { useEffect, useRef } from 'react';

import {
  getMessageAttachment,
  getMessageBody,
  getMessageReactions,
  getMessageText,
  getMessageTimestamp,
} from '@/hooks/useCometChat';

import MessageAvatar from './MessageAvatar';
import SecureMediaBubble from './SecureMediaBubble';
import VideoAttachment from './VideoAttachment';
import { useTheme } from '@/hooks/useTheme';
import {
  isSecuredCarrier,
  isSecureText,
  secureTextOf,
  SECURE_CHUNK,
} from '@/lib/secure-media';

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  /** First message of a run from the same sender. */
  isGroupStart?: boolean;
  /** Last message of a run — carries the timestamp + tail corner. */
  isGroupEnd?: boolean;
  showAvatar?: boolean;
  senderName?: string;
  /** `Read` / `Delivered`, shown under the last outgoing message. */
  receiptLabel?: string;
  /** Quote block atop the bubble when the message replies to another. */
  reply?: { sender: string; text: string } | null;
  onLongPress?: (event?: GestureResponderEvent) => void;
  onReact?: (reaction: string) => void;
}

const MEDIA_SIZE = { width: 216, height: 236 };

/**
 * The quote block inside a bubble. The 4pt bar and the named sender follow
 * the composer's reply preview exactly, so a sent reply and its landed echo
 * read as one design.
 */
const ReplyQuote = ({ sender, text }: { sender: string; text: string }) => {
  const { colors } = useTheme();
  return (
    <View className="flex-row items-stretch mb-1.5">
      <View
        style={{
          width: 3,
          borderRadius: 1.5,
          backgroundColor: colors['quote'],
          marginTop: 1,
          marginBottom: 1,
        }}
      />
      <View className="flex-1 min-w-0 pl-2 justify-center">
        <Text
          className="text-body-3 font-semibold"
          style={{ color: colors['product-deep'] }}
          numberOfLines={1}
        >
          {sender || 'Reply'}
        </Text>
        <Text className="text-body-3 text-text-muted" numberOfLines={2}>
          {text || 'Earlier message'}
        </Text>
      </View>
    </View>
  );
};

const formatTime = (timestamp: number) => {
  const { colors } = useTheme();
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Gentle entrance for messages that arrive after the thread has loaded.
 *
 * The wrapper exists outside MessageBubble so the caller decides which rows are
 * genuinely new (see the thread screen's seen-set) — bubbles re-mounted by
 * FlatList recycling during scroll-back do NOT re-animate; only a delivery the
 * user just watched arrive gets the 190ms fade-and-rise.
 */
export const BubbleEntrance = ({
  appear,
  children,
}: {
  appear: boolean;
  children: React.ReactNode;
}) => {
  const value = useRef(new Animated.Value(appear ? 0 : 1)).current;
  const playedRef = useRef(false);

  useEffect(() => {
    if (!appear || playedRef.current) return;
    playedRef.current = true;
    Animated.timing(value, { toValue: 1, duration: 190, useNativeDriver: true }).start();
  }, [appear, value]);

  if (!appear) return <>{children}</>;

  return (
    <Animated.View
      style={{
        opacity: value,
        transform: [
          { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
};

/**
 * Bubble from the Figma thread: 12pt radius, a 0.66pt rgba(0,0,0,0.06) hairline,
 * outgoing #D9FDD3 against the warm #EFEAE2 wallpaper and incoming white, with
 * the time and read ticks sitting inside the bubble on the trailing edge.
 */
const MessageBubble = ({
  message,
  isOwn,
  isGroupStart = true,
  isGroupEnd = true,
  showAvatar = false,
  senderName,
  receiptLabel,
  reply = null,
  onLongPress,
  onReact,
}: MessageBubbleProps) => {
  const { colors } = useTheme();
  const category =
    typeof message?.getCategory === 'function' ? message.getCategory() : message?.category;
  const kind = typeof message?.getType === 'function' ? message.getType() : message?.type;
  const timestamp = getMessageTimestamp(message);

  // Call events render as centred system rows rather than bubbles.
  if (category === 'call') {
    const label = getMessageText(message);
    if (!label) return null;
    return (
      <View className="flex-row items-center justify-center gap-1.5 my-1 px-6">
        <Ionicons name={kind === 'video' ? 'videocam-outline' : 'call-outline'} size={13} color={colors['text-muted']} />
        <Text className="text-body-3 text-text-muted">
          {label}
          {timestamp ? ` · ${formatTime(timestamp)}` : ''}
        </Text>
      </View>
    );
  }

  // Secured-media carriers. The chunks render nothing of their own — each one
  // is ciphertext on the wire — and the announce is the single bubble that
  // carries the transfer's frame: padding, timestamp, reactions, and the
  // payload or its streaming progress.
  if (isSecuredCarrier(message)) {
    if (kind === SECURE_CHUNK) return null;

    // Receipt handling mirrors the text bubble below: a clock while the send
    // is still in flight, then single or double ticks. The reads happen here
    // rather than further down because the transfer branch returns first.
    const carrierStatus =
      typeof message?.getStatus === 'function' ? message.getStatus() : undefined;
    const carrierRead = carrierStatus === 'read';

    return (
      <View
        className={clsx(
          'flex-row items-end gap-2 px-4',
          isGroupEnd ? 'mb-3' : 'mb-1',
          isOwn && 'justify-end'
        )}
      >
        {!isOwn ? (
          <View style={{ width: 28, height: isGroupEnd ? 28 : 0 }}>
            {showAvatar && isGroupEnd ? <MessageAvatar message={{ from: senderName }} /> : null}
          </View>
        ) : null}

        <View className="items-start max-w-[73%]" style={isOwn ? { alignItems: 'flex-end' } : undefined}>
          {!isOwn && showAvatar && senderName && isGroupStart ? (
            <Text className="text-body-3 font-semibold text-product-deep mb-0.5 ml-3">
              {senderName}
            </Text>
          ) : null}

          <Pressable
            onLongPress={onLongPress}
            delayLongPress={300}
            className={clsx(
              'rounded-bubble border-bubble p-1',
              isOwn ? 'bg-bubble-out border-bubble-shadow' : 'bg-bubble-in border-bubble-shadow'
            )}
          >
            {reply ? <ReplyQuote sender={reply.sender} text={reply.text} /> : null}
            <SecureMediaBubble message={message} isOwn={isOwn} />

            {/* Time and ticks ride the trailing edge inside the bubble, as
                everywhere else in the thread. */}
            <View className="flex-row items-center justify-end gap-1 mt-0.5 -mb-0.5">
              <Text className="text-caption text-text-faint">{formatTime(timestamp)}</Text>
              {isOwn ? (
                carrierStatus === 'sending' ? (
                  <Ionicons name="time-outline" size={12} color={colors['text-muted']} />
                ) : (
                  <Ionicons
                    name={carrierRead ? 'checkmark-done' : 'checkmark'}
                    size={15}
                    color={carrierRead ? colors['tick-read'] : colors['text-muted']}
                  />
                )
              ) : null}
            </View>
          </Pressable>

          {receiptLabel && isOwn && isGroupEnd ? (
            <Text className="text-caption text-text-faint mt-0.5 mr-1">{receiptLabel}</Text>
          ) : null}
        </View>
      </View>
    );
  }

  const attachment = getMessageAttachment(message);
  // Sealed text decrypts through getMessageBody; while the key is still pending
  // (or the envelope failed verification) the bubble shows an honest
  // placeholder instead of an empty row that vanishes.
  const sealedText = isSecureText(message) ? secureTextOf(message) : null;
  const body =
    getMessageBody(message) ||
    (sealedText
      ? sealedText.failed
        ? 'This message could not be verified'
        : '🔒 Encrypted message'
      : '');
  const reactions = getMessageReactions(message);
  if (!attachment && !body) return null;

  const status =
    typeof message?.getStatus === 'function' ? message.getStatus() : undefined;
  const hasInlineMedia = Boolean(attachment?.url) && kind !== 'file';
  const isRead = status === 'read';

  const renderAttachment = () => {
    if (!attachment?.url) return null;
    if (kind === 'image') {
      return (
        <View className="rounded-bubble overflow-hidden">
          <Image
            source={{ uri: attachment.url }}
            style={MEDIA_SIZE}
            contentFit="cover"
            transition={150}
          />
        </View>
      );
    }
    if (kind === 'video') {
      return (
        <View className="rounded-bubble overflow-hidden">
          <VideoAttachment uri={attachment.url} style={MEDIA_SIZE} />
        </View>
      );
    }
    return (
      <Pressable
        onPress={() => void Linking.openURL(attachment.url)}
        // Definite width, same reasoning as the secured file bubble: flex-1
        // inside an auto-width bubble collapses. 209pt content inside this
        // bubble's 15pt of padding lands on the same 224pt frame as media.
        className="w-[209px] flex-row items-center gap-2 py-1"
        accessibilityLabel="Open attachment"
      >
        <Ionicons name="document-text-outline" size={22} color={colors['text-strong']} />
        <View className="flex-1 min-w-0">
          <Text className="text-body-2 font-medium text-text-strong" numberOfLines={2}>
            {attachment.name || 'Attachment'}
          </Text>
          <Text className="text-caption text-text-muted">Open file</Text>
        </View>
      </Pressable>
    );
  };

  return (
    // Vertical rhythm from the design: 4pt between messages in a run, 12pt
    // between runs, so grouped bubbles read as one block.
    <View
      className={clsx(
        'flex-row items-end gap-2 px-4',
        isGroupEnd ? 'mb-3' : 'mb-1',
        isOwn && 'justify-end'
      )}
    >
      {!isOwn ? (
        <View style={{ width: 28, height: isGroupEnd ? 28 : 0 }}>
          {showAvatar && isGroupEnd ? <MessageAvatar message={{ from: senderName }} /> : null}
        </View>
      ) : null}

      <View className="items-start max-w-[73%] min-w-[88px]" style={isOwn ? { alignItems: 'flex-end' } : undefined}>
        {!isOwn && showAvatar && senderName && isGroupStart ? (
          <Text className="text-body-3 font-semibold text-product-deep mb-0.5 ml-3">
            {senderName}
          </Text>
        ) : null}

        <Pressable
          onLongPress={onLongPress}
          delayLongPress={300}
          className={clsx(
            'rounded-bubble border-bubble',
            isOwn ? 'bg-bubble-out border-bubble-shadow' : 'bg-bubble-in border-bubble-shadow',
            hasInlineMedia ? 'p-1' : 'pt-[13px] pl-[7px] pr-[8px] pb-[3px]'
          )}
        >
          {reply ? <ReplyQuote sender={reply.sender} text={reply.text} /> : null}
          {attachment?.url ? renderAttachment() : null}
          {body ? (
            <Text className="text-body-2 text-text-strong">
              {body}
            </Text>
          ) : null}

          {/* Time and read ticks ride on the trailing edge inside the bubble. */}
          <View className="flex-row items-center justify-end gap-1 mt-0.5 -mb-0.5">
            <Text className="text-caption text-text-faint">{formatTime(timestamp)}</Text>
            {isOwn ? (
              status === 'sending' ? (
                <Ionicons name="time-outline" size={12} color={colors['text-muted']} />
              ) : (
                <Ionicons
                  name={isRead ? 'checkmark-done' : 'checkmark'}
                  size={15}
                  color={isRead ? colors['tick-read'] : colors['text-muted']}
                />
              )
            ) : null}
          </View>
        </Pressable>

        {reactions.length ? (
          <View
            className={clsx(
              'flex-row flex-wrap gap-1 mt-1',
              isOwn ? 'justify-end' : 'justify-start'
            )}
          >
            {reactions.map((item) => (
              <Pressable
                key={item.reaction}
                onPress={() => onReact?.(item.reaction)}
                className={clsx(
                  'flex-row items-center gap-1 px-2 py-0.5 rounded-full border-bubble bg-bubble-in',
                  item.mine ? 'border-product' : 'border-bubble-shadow'
                )}
                accessibilityLabel={`${item.reaction} ${item.count}`}
              >
                <Text className="text-body-3">{item.reaction}</Text>
                <Text className="text-caption text-text-muted">{item.count}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {isOwn && isGroupEnd && receiptLabel ? (
          <Text className="text-caption text-text-faint mt-0.5 mr-1">{receiptLabel}</Text>
        ) : null}
      </View>
    </View>
  );
};

export default MessageBubble;