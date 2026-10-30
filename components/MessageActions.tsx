import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BackHandler, Modal, Pressable, Text, View } from 'react-native';
import { Fragment, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EmojiPickerSheet from '@/components/EmojiPickerSheet';
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
 * floating rounded panel a step above the bottom edge — reactions strip
 * (quick six + any-emoji keyboard via "+") on top, icon rows beneath, every
 * row inked with a platform ripple.
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
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [showPicker, setShowPicker] = useState(false);

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
            borderRadius: 20,
            overflow: 'hidden',
            borderWidth: 0.5,
            borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(17,27,33,0.07)',
            shadowColor: '#000',
            shadowOpacity: 0.4,
            shadowRadius: 22,
            shadowOffset: { width: 0, height: 10 },
            elevation: 18,
          }}
        >
          {/* Reactions strip: the quick six plus the "+" cell that opens the
              full emoji keyboard sheet, evenly spread across the card. */}
          <View
            style={{
              flexDirection: 'row',
              paddingHorizontal: 10,
              paddingTop: 10,
              paddingBottom: 10,
              borderBottomWidth: 0.5,
              borderBottomColor: colors['separator'],
            }}
          >
            {QUICK_REACTIONS.map((emoji, index) => {
              const active = activeReactions.includes(emoji);
              return (
                <Fragment key={emoji}>
                  <Pressable
                    onPress={() => {
                      onReact(emoji);
                      onClose();
                    }}
                    accessibilityLabel={`React with ${emoji}`}
                    android_ripple={{ color: RIPPLE_INK, borderless: true, radius: 25 }}
                    style={({ pressed }) => ({
                      flex: 1,
                      height: 50,
                      borderRadius: 25,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: active ? colors['surface-active'] : 'transparent',
                      borderWidth: active ? 2 : 0,
                      borderColor: active ? colors['product'] : 'transparent',
                      opacity: pressed || active ? 1 : 0.95,
                    })}
                  >
                    <Text style={{ fontSize: 27 }}>{emoji}</Text>
                  </Pressable>
                  {index < QUICK_REACTIONS.length - 1 ? <View style={{ width: 4 }} /> : null}
                </Fragment>
              );
            })}
            <View style={{ width: 4 }} />
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                onClose();
                setShowPicker(true);
              }}
              accessibilityLabel="Choose any emoji to react"
              android_ripple={{ color: RIPPLE_INK, borderless: true, radius: 25 }}
              style={({ pressed }) => ({
                flex: 1,
                height: 50,
                borderRadius: 25,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors['surface-muted'],
                borderWidth: 0.5,
                borderColor: colors['separator'],
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Ionicons name="add" size={24} color={colors['text-strong']} />
            </Pressable>
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
            android_ripple={{ color: RIPPLE_INK, borderless: true, radius: 120 }}
            style={({ pressed }) => ({
              alignSelf: 'center',
              minWidth: 140,
              minHeight: 44,
              paddingHorizontal: 32,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 2,
              marginBottom: 10,
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

      {/* The full emoji keyboard: WhatsApp closes the quick menu when the
          picker opens, and the chosen glyph becomes the reaction itself. */}
      <EmojiPickerSheet
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={(emoji) => {
          setShowPicker(false);
          onReact(emoji);
        }}
      />
    </Modal>
  );
};

export default MessageActions;
