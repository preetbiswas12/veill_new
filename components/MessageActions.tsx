import { Ionicons } from '@expo/vector-icons';
import { BackHandler, Modal, Pressable, Text, View } from 'react-native';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

/** Shared ink for the menu ripples, readable on both surfaces. */
const RIPPLE_INK = 'rgba(134,150,160,0.20)';

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
  /** Present for image/video rows whose bytes already resolved on this device. */
  onSaveMedia?: () => void;
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
      // The card masks the ripple, WhatsApp-style: ink spreads from the touch
      // point and clips at the row bounds.
      android_ripple={{ color: RIPPLE_INK, borderless: false }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 16,
        minHeight: 48,
        paddingHorizontal: 20,
        paddingVertical: 13,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Ionicons
        name={icon}
        size={20}
        color={destructive ? colors['text-error'] : colors['text-muted']}
      />
      <Text
        style={{
          fontSize: 16,
          lineHeight: 21,
          color: destructive ? colors['text-error'] : colors['text-strong'],
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

/**
 * Per-message action menu, styled on WhatsApp-android's long-press card: a
 * floating rounded panel a step above the bottom edge — reactions strip on
 * top, icon rows beneath, every row inked with a platform ripple.
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
  onSaveMedia,
}: MessageActionsProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Back dismisses the sheet explicitly - not every Android build delivers
  // the gesture to Modal's onRequestClose.
  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={{ flex: 1 }} onPress={onClose} />

      {/* WhatsApp-android's long-press menu is not an edge-to-edge slab; it is
          a floating rounded card a step above the bottom edge, reactions strip
          on top, menu rows below, all clipped by the card's radius. Styles are
          explicit rather than NativeWind classes because a Modal renders into
          its own native window, where the CSS-variable classes do not reliably
          resolve on Android. */}
      <View style={{ paddingHorizontal: 10, paddingBottom: insets.bottom + 16 }}>
        <View
          style={{
            backgroundColor: colors['surface'],
            borderRadius: 18,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOpacity: 0.45,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 8 },
            elevation: 18,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              paddingHorizontal: 6,
              paddingTop: 8,
              paddingBottom: 8,
              borderBottomWidth: 0.5,
              borderBottomColor: colors['separator'],
            }}
          >
            {QUICK_REACTIONS.map((emoji, index) => {
              const active = activeReactions.includes(emoji);
              return (
                <Pressable
                  key={emoji}
                  onPress={() => {
                    onReact(emoji);
                    onClose();
                  }}
                  accessibilityLabel={`React with ${emoji}`}
                  android_ripple={{ color: RIPPLE_INK, borderless: true, radius: 26 }}
                  style={({ pressed }) => ({
                    flex: 1,
                    height: 48,
                    marginRight: index < QUICK_REACTIONS.length - 1 ? 4 : 0,
                    borderRadius: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: active ? colors['surface-active'] : 'transparent',
                    borderWidth: active ? 2 : 0,
                    borderColor: active ? colors['product'] : 'transparent',
                    opacity: pressed || active ? 1 : 0.92,
                  })}
                >
                  <Text style={{ fontSize: 26 }}>{emoji}</Text>
                </Pressable>
              );
            })}
          </View>

          {canReply ? (
            <Row icon="return-down-forward" label="Reply" onPress={() => { onReply?.(); onClose(); }} />
          ) : null}
          {onForward ? (
            <Row icon="arrow-redo-outline" label="Forward" onPress={() => { onForward(); onClose(); }} />
          ) : null}
          {canCopy ? <Row icon="copy" label="Copy text" onPress={() => { onCopy?.(); onClose(); }} /> : null}
          {onSaveMedia ? (
            <Row icon="save-outline" label="Save to device" onPress={() => { onSaveMedia(); onClose(); }} />
          ) : null}
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

          {/* Dismissal affordance, kept but demoted: back and tap-outside both
              close, so the row is a muted action, not the deck's centrepiece. */}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            android_ripple={{ color: RIPPLE_INK, borderless: false }}
            style={({ pressed }) => ({
              minHeight: 44,
              maxWidth: 220,
              alignSelf: 'stretch',
              alignItems: 'center',
              justifyContent: 'center',
              marginHorizontal: 96,
              marginTop: 2,
              marginBottom: 8,
              borderRadius: 22,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors['text-muted'] }}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default MessageActions;
