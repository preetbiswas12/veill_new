import { Ionicons } from '@expo/vector-icons';
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

/** The design draws a single tick for sent and a blue double tick for read. */
const DeliveryTicks = ({ status }: { status?: string }) => {
  const read = status === 'read' || status === 'delivered';
  return (
    <Ionicons
      name={read ? 'checkmark-done' : 'checkmark'}
      size={15}
      color={status === 'read' ? '#53bdeb' : '#767779'}
    />
  );
};

/**
 * Conversation row from the Figma chat list: 56pt avatar at a 28pt radius, a
 * 77.33pt row, 16pt semibold name over a 14/19pt preview, and the time stacked
 * above the unread badge on the right.
 */
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
      className="flex-row items-start pl-4 pr-4 h-row active:bg-surface-muted"
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${title}`}
    >
      <View className="pt-[2px]">
        <Avatar
          name={title}
          imageUrl={image}
          size={56}
          fontSize={22}
          placeholderType={isGroup ? 'icon' : 'text'}
        />
      </View>

      <View className="flex-1 min-w-0 h-[67.33px] pt-2.5 pr-[15px] justify-center border-b-hair border-separator flex-row items-start gap-2">
        <View className="flex-1 min-w-0 gap-[1.5px]">
          <Text className="text-body-1 font-semibold text-text-strong" numberOfLines={1}>
            {title}
          </Text>

          <View className="flex-row items-start gap-1">
            {isOwnLatest ? <DeliveryTicks status={latestStatus} /> : null}
            <Text
              className={clsx(
                'text-body-2 flex-1',
                typing ? 'italic text-text-muted' : 'text-text-muted'
              )}
              numberOfLines={1}
            >
              {typing ? 'typing…' : preview || 'No messages yet'}
            </Text>
          </View>
        </View>

        <View className="w-8 items-end gap-[3px]">
          <Text className="text-body-2 text-text-muted">{formatTimestamp(timestamp)}</Text>
          {unread ? (
            <View className="min-w-[18px] h-[18px] px-1.5 rounded-[9px] bg-primary items-center justify-center">
              <Text className="text-body-3 text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

export default ConversationRow;