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

/** A single tick for sent, a blue double tick once the peer has read it. */
const DeliveryTicks = ({ status }: { status?: string }) => {
  const { colors } = useTheme();
  return (
    <Ionicons
      name={status === 'read' ? 'checkmark-done' : 'checkmark'}
      size={16}
      color={status === 'read' ? colors['tick-read'] : colors['text-muted']}
    />
  );
};

/**
 * Conversation row, matching the design at 393pt:
 *
 *   flex items-center gap-3 px-4 h-[76px]      <- the row
 *     size-14 rounded-full                     <- 56pt avatar
 *     flex-1 min-w-0
 *       flex justify-between items-baseline    <- name + timestamp on ONE line
 *         text-[17px] font-semibold truncate
 *         text-[15px] font-medium
 *       flex justify-between items-center mt-0.5  <- preview + badge on ONE line
 *         text-[15px] truncate
 *         size-5 rounded-full text-[12px] font-semibold
 *   h-px bg-border mx-4                        <- separator, inset 16pt both sides
 *
 * The separator is a sibling rather than a border on the text column, so it runs
 * the full width beneath the avatar instead of stopping at the avatar's edge.
 * Both text lines carry `min-w-0` plus a truncating Text, which is what stops a
 * long sender name from pushing the timestamp off the row.
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
          size={56}
          fontSize={22}
          placeholderType={isGroup ? 'icon' : 'text'}
        />

        <View className="flex-1 min-w-0">
          {/* Name and timestamp share the first baseline. */}
          <View className="flex-row items-baseline justify-between gap-2">
            <Text className="flex-1 min-w-0 text-body-1 font-semibold text-text-strong" numberOfLines={1}>
              {title}
            </Text>
            <Text
              className={clsx(
                'text-body-2 font-medium',
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
              // A 20pt circle at the design's size, allowed to widen for "99+" so
              // a three-digit count is never clipped.
              <View className="min-w-[20px] h-5 px-1 rounded-full bg-primary items-center justify-center">
                <Text className="text-body-3 font-semibold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>

      <View className="h-px bg-separator mx-4" />
    </View>
  );
};

export default ConversationRow;
