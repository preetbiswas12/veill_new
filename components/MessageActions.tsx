import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

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
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: pressed ? colors['surface-muted'] : 'transparent',
      })}
    >
      <Ionicons
        name={icon}
        size={20}
        color={destructive ? colors['text-error'] : colors['text-strong']}
      />
      <Text
        style={{
          fontSize: 17,
          lineHeight: 22,
          color: destructive ? colors['text-error'] : colors['text-strong'],
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

/**
 * Bottom sheet for per-message actions, on the design's surface colour.
 *
 * Styles are explicit rather than NativeWind classes because a React Native
 * Modal renders into its own native window, where the CSS-variable classes
 * do not reliably resolve on Android — which left the sheet unstyled (white,
 * sharp corners in dark mode).
 */
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
}: MessageActionsProps) => {
  const { colors } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={{ flex: 1 }} onPress={onClose} />

      <View
        style={{
          backgroundColor: colors['surface'],
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 12,
          paddingBottom: 32,
          shadowColor: '#000',
          shadowOpacity: 0.5,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -6 },
          elevation: 24,
        }}
      >
        {/* Grabber, per the iOS sheet convention. */}
        <View style={{ alignItems: 'center', paddingBottom: 12 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors['separator'] }} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingBottom: 12 }}
          style={{ borderBottomWidth: 0.5, borderBottomColor: colors['separator'] }}
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
                accessibilityLabel={`React with ${emoji}`}
                style={({ pressed }) => ({
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? colors['surface-active'] : colors['surface-muted'],
                  borderWidth: active ? 2 : 0,
                  borderColor: active ? colors['product'] : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: 24 }}>{emoji}</Text>
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
        <Pressable
          onPress={onClose}
          style={({ pressed }) => ({
            alignSelf: 'center',
            marginTop: 8,
            paddingHorizontal: 24,
            paddingVertical: 8,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ fontSize: 17, fontWeight: '600', color: colors['link'] }}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
};

export default MessageActions;
