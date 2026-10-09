import { Feather } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import Button from './Button';

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

interface MessageActionsProps {
  visible: boolean;
  /** Text messages can be copied; call/empty rows cannot. */
  canCopy?: boolean;
  canDelete?: boolean;
  /** Reactions already applied by the current user. */
  activeReactions?: string[];
  onClose: () => void;
  onCopy?: () => void;
  onReact: (reaction: string) => void;
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
    className="flex-row items-center gap-4 px-5 py-4 active:bg-gray-50"
  >
    <Feather name={icon} size={20} color={destructive ? '#ef4444' : '#374151'} />
    <Text className={`text-base ${destructive ? 'text-red-500' : 'text-gray-800'}`}>{label}</Text>
  </Pressable>
);

/** Signal-style bottom sheet for per-message actions. */
const MessageActions = ({
  visible,
  canCopy = false,
  canDelete = false,
  activeReactions = [],
  onClose,
  onCopy,
  onReact,
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
        <View className="w-10 h-1 rounded-full bg-gray-300" />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingBottom: 12 }}
        className="border-b border-gray-100"
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
                active ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-100'
              }`}
              accessibilityLabel={`React with ${emoji}`}
            >
              {emoji}
            </Pressable>
          );
        })}
      </ScrollView>

      {canCopy ? <Row icon="copy" label="Copy text" onPress={() => { onCopy?.(); onClose(); }} /> : null}
      {canDelete ? (
        <Row
          icon="trash-2"
          label="Delete message"
          destructive
          onPress={() => { onDelete?.(); onClose(); }}
        />
      ) : null}
      <Button variant="plain" className="self-center mt-2 px-6 py-2" onPress={onClose}>
        <Text className="text-blue-600 font-semibold">Cancel</Text>
      </Button>
    </View>
  </Modal>
);

export default MessageActions;
