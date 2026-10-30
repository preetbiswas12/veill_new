import { Ionicons } from '@expo/vector-icons';
import clsx from 'clsx';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

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

/**
 * WhatsApp-android preview ticks: one gray check while the message is merely
 * sent, a gray double check once delivered, and the blue double check once read.
 */
const DeliveryTicks = ({ status }: { status?: string }) => {
  const { colors } = useTheme();
  const delivered = status === 'delivered' || status === 'read';
  return (
    <Ionicons
      name={delivered ? 'checkmark-done' : 'checkmark'}
      size={16}
      color={status === 'read' ? colors['tick-read'] : colors['text-muted']}
    />
  );
};

/**
 * Conversation row, measured off WhatsApp-android (2024+ build):
 *
 *   flex items-center gap-3 px-4 h-row          <- 72dp row
 *     48dp avatar                                <- WA's list avatar
 *     flex-1 min-w-0
 *       flex justify-between items-baseline      <- name + time on one line
 *         text-[17px] font-medium (500)
 *         text-body-3 (12sp)                     <- time, green when unread
 *       flex justify-between items-center mt-0.5 <- preview + badge
 *         text-body-2 (15sp) truncate
 *         size-5 rounded-full bg-primary
 *   (no separator — the current WhatsApp rows sit on flat color)
 *
 * The preview line keeps `min-w-0` plus a truncating Text, which is what stops
 * a long sender name from pushing the timestamp off the row.
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
    <View>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={280}
        className="flex-row items-center gap-3 px-4 h-row active:bg-surface-muted"
        accessibilityRole="button"
        accessibilityLabel={`Chat with ${title}`}
      >
        <Avatar
          name={title}
          imageUrl={image}
          size={48}
          fontSize={20}
          placeholderType={isGroup ? 'icon' : 'text'}
        />

        <View className="flex-1 min-w-0">
          {/* Name and timestamp share the first baseline. WhatsApp draws the
              name at 17sp/500 and the time at 12sp, green while unread. */}
          <View className="flex-row items-baseline justify-between gap-2">
            <Text className="flex-1 min-w-0 text-body-1 font-medium text-text-strong" numberOfLines={1}>
              {title}
            </Text>
            <Text
              className={clsx(
                'text-body-3',
                unread ? 'text-primary' : 'text-text-muted'
              )}
              numberOfLines={1}
            >
              {formatTimestamp(timestamp)}
            </Text>
          </View>

          {/* Preview and unread badge share the second line. */}
          <View className="flex-row items-center justify-between gap-2 mt-0.5">
            <View className="flex-1 min-w-0 flex-row items-center gap-[3px]">
              {isOwnLatest ? <DeliveryTicks status={latestStatus} /> : null}
              <Text
                className={clsx(
                  'flex-1 min-w-0 text-body-2',
                  typing ? 'text-primary' : 'text-text-muted'
                )}
                numberOfLines={1}
              >
                {typing ? 'typing\u2026' : preview || 'No messages yet'}
              </Text>
            </View>

            {unread ? (
              // A 20pt circle at WhatsApp's size, allowed to widen for "99+" so
              // a three-digit count is never clipped. The current build paints
              // the count in the mode-inverted colour, so it flips with theme.
              <View className="min-w-[20px] h-5 px-1 rounded-full bg-primary items-center justify-center">
                <Text className="text-body-3 font-semibold text-text-invert">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
};

export default ConversationRow;
