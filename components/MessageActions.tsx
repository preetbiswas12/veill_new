import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import Button from './Button';

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

interface MessageActionsProps {
  visible: boolean;
  /** Text messages can be copied; call/empty rows cannot. */
  canCopy?: boolean;
  canDelete?: boolean;
  /** Reply is offered on real messages; call/system rows have nothing to quote. */
  canReply?: boolean;
  /** Reactions already applied by the current user. */
  activeReactions?: string[];
  /** True when this message is already in the local starred store. */
  starred?: boolean;
  onClose: () => void;
  onCopy?: () => void;
  onReact: (reaction: string) => void;
  onReply?: () => void;
  onDelete?: () => void;
  /** Absent when starring does not apply, which hides the row entirely. */
  onStar?: () => void;
  /** Absent when there is nothing to forward. */
  onForward?: () => void;
}

const Row = ({
  icon,
  label,
  destructive = false,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) => {
  const { colors } = useTheme();
  return (
  <Pressable
    onPress={onPress}
    className="flex-row items-center gap-4 px-5 py-4 active:bg-surface-muted"
  >
    <Ionicons
      name={icon}
      size={20}
      color={destructive ? colors['text-error'] : colors['text-strong']}
    />
    <Text className={`text-body-1 ${destructive ? 'text-text-error' : 'text-text-strong'}`}>{label}</Text>
  </Pressable>
  );
};

/** Bottom sheet for per-message actions, on the design's white surface. */
const MessageActions = ({
  visible,
  canCopy = false,
  canDelete = false,
  canReply = false,
  activeReactions = [],
  starred = false,
  onClose,
  onCopy,
  onReact,
  onReply,
  onDelete,
  onStar,
  onForward,
}: MessageActionsProps) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
    statusBarTranslucent
  >
    <Pressable className="flex-1" onPress={onClose} />

    <View className="bg-surface rounded-t-3xl pb-8 pt-3 shadow-2xl">
      {/* Grabber, per the iOS sheet convention. */}
      <View className="items-center pb-3">
        <View className="w-10 h-1 rounded-full bg-separator" />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingBottom: 12 }}
        className="border-b-hair border-separator"
      >
        {QUICK_REACTIONS.map((emoji) => {
          const active = activeReactions.includes(emoji);
          return (
            <Pressable
              key={emoji}
              onPress={() => {
                onReact(emoji);
                onClose();
              }}
              className={`w-12 h-12 rounded-full items-center justify-center text-2xl ${
                active ? 'bg-surface-active border-2 border-primary' : 'bg-surface-muted'
              }`}
              accessibilityLabel={`React with ${emoji}`}
            >
              {emoji}
            </Pressable>
          );
        })}
      </ScrollView>

      {canReply ? (
        <Row icon="return-down-forward" label="Reply" onPress={() => { onReply?.(); onClose(); }} />
      ) : null}
      {onForward ? (
        <Row icon="arrow-redo-outline" label="Forward" onPress={() => { onForward(); onClose(); }} />
      ) : null}
      {canCopy ? <Row icon="copy" label="Copy text" onPress={() => { onCopy?.(); onClose(); }} /> : null}
      {onStar ? (
        <Row
          icon={starred ? 'star' : 'star-outline'}
          label={starred ? 'Remove star' : 'Star message'}
          onPress={() => { onStar(); onClose(); }}
        />
      ) : null}
      {canDelete ? (
        <Row
          icon="trash-outline"
          label="Delete message"
          destructive
          onPress={() => { onDelete?.(); onClose(); }}
        />
      ) : null}
      <Button variant="plain" className="self-center mt-2 px-6 py-2" onPress={onClose}>
        <Text className="text-body-1 font-semibold text-link">Cancel</Text>
      </Button>
    </View>
  </Modal>
);

export default MessageActions;
