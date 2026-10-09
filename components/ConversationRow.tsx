import { Feather, Ionicons } from '@expo/vector-icons';
import clsx from 'clsx';
import { Pressable, Text, View } from 'react-native';

import Avatar from './Avatar';

interface ConversationRowProps {
  name?: string;
  image?: string;
  timestamp?: number;
  preview?: string;
  unreadCount: number;
  /** A peer is composing a message in this conversation. */
  typing?: boolean;
  /** True when the latest message was sent by the current user. */
  isOwnLatest?: boolean;
  /** CometChat status of the latest message: sent / delivered / read. */
  latestStatus?: string;
  isGroup?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

const formatTimestamp = (timestamp?: number): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (timestamp >= startOfToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (timestamp >= startOfToday - 6 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const DeliveryTicks = ({ status }: { status?: string }) => {
  const read = status === 'read' || status === 'delivered';
  return (
    <Ionicons
      name={read ? 'checkmark-done' : 'checkmark'}
      size={15}
      color={status === 'read' ? '#2c6bed' : '#9ca3af'}
    />
  );
};

const ConversationRow = ({
  name,
  image,
  timestamp,
  preview,
  unreadCount,
  typing = false,
  isOwnLatest = false,
  latestStatus,
  isGroup = false,
  onPress,
  onLongPress,
}: ConversationRowProps) => {
  const unread = unreadCount > 0;
  const title = name || 'Unknown';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={280}
      className="flex-row items-center gap-3 px-4 py-3 bg-white active:bg-gray-100"
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${title}`}
    >
      <Avatar
        name={title}
        imageUrl={image}
        size={50}
        fontSize={22}
        placeholderType={isGroup ? 'icon' : 'text'}
      />

      <View className="flex-1 min-w-0 gap-0.5">
        <Text
          className={clsx('text-[17px] truncate', unread ? 'font-semibold' : 'font-medium')}
          numberOfLines={1}
        >
          {title}
        </Text>

        <View className="flex-row items-center gap-1.5">
          {isOwnLatest ? <DeliveryTicks status={latestStatus} /> : null}
          <Text
            className={clsx(
              'text-[14px] flex-1',
              typing ? 'text-primary italic' : unread ? 'text-gray-800 font-medium' : 'text-gray-500'
            )}
            numberOfLines={1}
          >
            {typing ? 'typing…' : preview || 'No messages yet'}
          </Text>
        </View>
      </View>

      <View className="items-end gap-1 self-stretch justify-center">
        <Text className={clsx('text-xs', unread ? 'text-primary font-medium' : 'text-gray-400')}>
          {formatTimestamp(timestamp)}
        </Text>
        {unread ? (
          <View className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary items-center justify-center">
            <Text className="text-[11px] font-semibold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};

export default ConversationRow;
