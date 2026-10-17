import { Feather } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

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
  onClose: () => void;
  onCopy?: () => void;
  onReact: (reaction: string) => void;
  onReply?: () => void;
  onDelete?: () => void;
}

const Row = ({
  icon,
  label,
  destructive = false,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    className="flex-row items-center gap-4 px-5 py-4 active:bg-surface-muted"
  >
    <Feather name={icon} size={20} color={destructive ? '#ea0038' : '#0a0a0a'} />
    <Text className={`text-body-1 ${destructive ? 'text-text-error' : 'text-text-strong'}`}>{label}</Text>
  </Pressable>
);

/** Bottom sheet for per-message actions, on the design's white surface. */
const MessageActions = ({
  visible,
  canCopy = false,
  canDelete = false,
  canReply = false,
  activeReactions = [],
  onClose,
  onCopy,
  onReact,
  onReply,
  onDelete,
}: MessageActionsProps) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
    statusBarTranslucent
  >
    <Pressable className="flex-1" onPress={onClose} />

    <View className="bg-white rounded-t-3xl pb-8 pt-3 shadow-2xl">
      <View className="items-center pb-3">
        <View className="w-10 h-1 rounded-full bg-surface-muted" />
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

      {canCopy ? <Row icon="copy" label="Copy text" onPress={() => { onCopy?.(); onClose(); }} /> : null}
      {canReply ? (
        <Row icon="corner-up-left" label="Reply" onPress={() => { onReply?.(); onClose(); }} />
      ) : null}
      {canDelete ? (
        <Row
          icon="trash-2"
          label="Delete message"
          destructive
          onPress={() => { onDelete?.(); onClose(); }}
        />
      ) : null}
      <Button variant="plain" className="self-center mt-2 px-6 py-2" onPress={onClose}>
        <Text className="text-body-1 font-semibold text-text-product">Cancel</Text>
      </Button>
    </View>
  </Modal>
);

export default MessageActions;
