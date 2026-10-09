import { Feather } from '@expo/vector-icons';
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
        <Feather name={kind === 'video' ? 'video' : 'phone'} size={13} color="#9ca3af" />
        <Text className="text-xs text-gray-500">
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

  const renderAttachment = () => {
    if (!attachment?.url) return null;
    if (kind === 'image') {
      return (
        <View className="rounded-xl overflow-hidden">
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
        <View className="rounded-xl overflow-hidden">
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
        <Feather name="file-text" size={22} color="#2c6bed" />
        <View className="flex-1 min-w-0">
          <Text
            className={clsx('text-sm font-medium', isOwn ? 'text-white' : 'text-black')}
            numberOfLines={2}
          >
            {attachment.name || 'Attachment'}
          </Text>
          <Text className={clsx('text-[11px]', isOwn ? 'text-white/70' : 'text-gray-400')}>
            Open file
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View
      className={clsx(
        'flex-row items-end gap-2 px-4',
        isGroupEnd ? 'mb-2' : 'mb-0.5',
        isOwn && 'justify-end'
      )}
    >
      {!isOwn ? (
        <View style={{ width: 28, height: isGroupEnd ? 28 : 0 }}>
          {showAvatar && isGroupEnd ? <MessageAvatar message={{ from: senderName }} /> : null}
        </View>
      ) : null}

      <View className={clsx('items-start', isOwn && 'items-end')}>
        {!isOwn && showAvatar && senderName && isGroupStart ? (
          <Text className="text-[11px] font-semibold text-primary mb-0.5 ml-3">
            {senderName}
          </Text>
        ) : null}

        <Pressable
          onLongPress={onLongPress}
          delayLongPress={300}
          className={clsx(
            'max-w-[80%] rounded-2xl',
            isGroupStart && 'rounded-t-md',
            isGroupEnd && 'rounded-b-md',
            hasInlineMedia ? 'p-1' : 'px-3 py-2',
            isOwn ? 'bg-primary' : 'bg-white border border-gray-100'
          )}
        >
          {attachment?.url ? renderAttachment() : null}
          {body ? (
            <Text
              className={clsx(
                'text-[15px] leading-5',
                hasInlineMedia && 'px-2 py-1',
                isOwn ? 'text-white' : 'text-black'
              )}
            >
              {body}
            </Text>
          ) : null}

          {isGroupEnd ? (
            <View
              className={clsx(
                'flex-row items-center gap-1 self-end mt-0.5',
                hasInlineMedia && 'px-1'
              )}
            >
              <Text className={clsx('text-[10px]', isOwn ? 'text-white/70' : 'text-gray-400')}>
                {formatTime(timestamp)}
              </Text>
              {isOwn && status === 'sending' ? (
                <Feather name="clock" size={10} color="rgba(255,255,255,0.7)" />
              ) : null}
            </View>
          ) : null}
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
                  'flex-row items-center gap-1 px-2 py-0.5 rounded-full border bg-white',
                  item.mine ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                )}
                accessibilityLabel={`${item.reaction} ${item.count}`}
              >
                <Text className="text-xs">{item.reaction}</Text>
                <Text
                  className={clsx('text-[11px]', item.mine ? 'text-blue-600' : 'text-gray-500')}
                >
                  {item.count}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {isOwn && isGroupEnd && receiptLabel ? (
          <Text className="text-[10px] text-gray-400 mt-0.5 mr-1">{receiptLabel}</Text>
        ) : null}
      </View>
    </View>
  );
};

export default MessageBubble;
