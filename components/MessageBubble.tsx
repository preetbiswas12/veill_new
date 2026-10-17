import { Ionicons } from '@expo/vector-icons';
import clsx from 'clsx';
import { Image } from 'expo-image';
import { Linking, Pressable, Text, View } from 'react-native';

import {
  getMessageAttachment,
  getMessageBody,
  getMessageReactions,
  getMessageText,
  getMessageTimestamp,
} from '@/hooks/useCometChat';

import MessageAvatar from './MessageAvatar';
import VideoAttachment from './VideoAttachment';

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
  onLongPress?: () => void;
  onReact?: (reaction: string) => void;
}

const MEDIA_SIZE = { width: 216, height: 236 };

const formatTime = (timestamp: number) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Bubble from the Figma thread: 12pt radius, a 0.66pt rgba(0,0,0,0.06) hairline,
 * outgoing #d0fecf against the warm #f5f2eb wallpaper and incoming white, with
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
  onLongPress,
  onReact,
}: MessageBubbleProps) => {
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
        <Ionicons name={kind === 'video' ? 'videocam-outline' : 'call-outline'} size={13} color="#767779" />
        <Text className="text-body-3 text-text-muted">
          {label}
          {timestamp ? ` · ${formatTime(timestamp)}` : ''}
        </Text>
      </View>
    );
  }

  const attachment = getMessageAttachment(message);
  const body = getMessageBody(message);
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
        <View className="rounded-[12px] overflow-hidden">
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
        <View className="rounded-[12px] overflow-hidden">
          <VideoAttachment uri={attachment.url} style={MEDIA_SIZE} />
        </View>
      );
    }
    return (
      <Pressable
        onPress={() => void Linking.openURL(attachment.url)}
        className="flex-row items-center gap-2 py-1"
        accessibilityLabel="Open attachment"
      >
        <Ionicons name="document-text-outline" size={22} color="#0a0a0a" />
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
            'rounded-[12px] border-bubble',
            isOwn ? 'bg-bubble-out border-bubble-shadow' : 'bg-bubble-in border-bubble-shadow',
            hasInlineMedia ? 'p-1' : 'pt-[13px] pl-[7px] pr-[8px] pb-[3px]'
          )}
        >
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
                <Ionicons name="time-outline" size={12} color="rgba(0,0,0,0.5)" />
              ) : (
                <Ionicons
                  name={isRead ? 'checkmark-done' : 'checkmark'}
                  size={15}
                  color={isRead ? '#53bdeb' : 'rgba(0,0,0,0.5)'}
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