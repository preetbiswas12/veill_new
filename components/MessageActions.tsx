import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  Animated,
  BackHandler,
  GestureResponderEvent,
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EmojiPickerSheet from '@/components/EmojiPickerSheet';
import { useTheme } from '@/hooks/useTheme';

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

/** Shared ink for the menu ripples, readable on both surfaces. */
const RIPPLE_INK = 'rgba(134,150,160,0.20)';

const STRIP_HEIGHT = 56;
const ROW_HEIGHT = 48;

interface RowSpec {
  key: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  destructive?: boolean;
  onPress: () => void;
}

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
  /**
   * The long-press point in window coordinates. The card anchors above the
   * pressed message — WhatsApp's popover — and flips below when there is no
   * headroom. Omitted for demo-thread rows: the card docks bottom-centre.
   */
  anchor?: { x: number; y: number } | null;
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

/**
 * Per-message actions on WhatsApp-android's popover idiom: a floating
 * reactions pill sits directly above a rounded menu card, both anchored to
 * the pressed message rather than sliding up as an edge-to-edge slab. No
 * Cancel — dismissal is back or a tap on the dimmed thread, like the real
 * thing.
 *
 * Styles are explicit rather than NativeWind classes because a React Native
 * Modal renders into its own native window, where the CSS-variable classes do
 * not reliably resolve on Android.
 */
const MessageActions = ({
  visible,
  canCopy = false,
  canDelete = false,
  canReply = false,
  activeReactions = [],
  starred = false,
  anchor = null,
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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [showPicker, setShowPicker] = useState(false);
  const [cardHeight, setCardHeight] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(0)).current;

  const rows = useMemo<RowSpec[]>(() => {
    const list: RowSpec[] = [];
    if (canReply && onReply) {
      list.push({
        key: 'reply',
        icon: 'return-down-forward',
        label: 'Reply',
        onPress: () => {
          onReply();
          onClose();
        },
      });
    }
    if (onForward) {
      list.push({
        key: 'forward',
        icon: 'arrow-redo-outline',
        label: 'Forward',
        onPress: () => {
          onForward();
          onClose();
        },
      });
    }
    if (canCopy && onCopy) {
      list.push({
        key: 'copy',
        icon: 'copy',
        label: 'Copy text',
        onPress: () => {
          onCopy();
          onClose();
        },
      });
    }
    if (onSaveMedia) {
      list.push({
        key: 'save',
        icon: 'save-outline',
        label: 'Save to device',
        onPress: () => {
          onSaveMedia();
          onClose();
        },
      });
    }
    if (onStar) {
      list.push({
        key: 'star',
        icon: starred ? 'star' : 'star-outline',
        label: starred ? 'Remove star' : 'Star message',
        onPress: () => {
          onStar();
          onClose();
        },
      });
    }
    if (canDelete && onDelete) {
      list.push({
        key: 'delete',
        icon: 'trash-outline',
        label: 'Delete message',
        destructive: true,
        onPress: () => {
          onDelete();
          onClose();
        },
      });
    }
    return list;
  }, [canReply, onReply, onForward, canCopy, onCopy, onSaveMedia, onStar, starred, canDelete, onDelete, onClose]);

  // Estimated deck height for the first placement frame; refined by the
  // measured onLayout call the moment the card lays out.
  const estimatedHeight = STRIP_HEIGHT + 8 + rows.length * ROW_HEIGHT + 12;
  const measured = cardHeight > 0 ? cardHeight : estimatedHeight;

  const cardWidth = Math.min(280, windowWidth - 28);
  // Headroom check against a notched status bar plus the 48pt chat header.
  const fitsAbove = Boolean(anchor) && anchor!.y - measured - 8 > insets.top + 56;
  const top = anchor
    ? fitsAbove
      ? anchor.y - measured - 8
      : Math.min(anchor.y + 16, windowHeight - measured - insets.bottom - 12)
    : undefined;
  const bottom = anchor ? undefined : insets.bottom + 24;
  const left = Math.max(10, (windowWidth - cardWidth) / 2);

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

  // Entrance: fade plus a 10pt rise with a small spring — popover motion,
  // not slab motion.
  useEffect(() => {
    if (!visible) return;
    opacity.setValue(0);
    rise.setValue(10);
    const animation = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.spring(rise, { toValue: 0, useNativeDriver: true, bounciness: 6 }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [visible, opacity, rise]);

  const scrimPress = (_event: GestureResponderEvent) => {
    // Kept as a named handler to make the scrim's only job explicit.
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={{ flex: 1 }} onPress={scrimPress} />

      {/* Reactions pill: WhatsApp floats it separate from the menu deck. */}
      <Animated.View
        style={{
          position: 'absolute',
          left,
          top,
          bottom,
          opacity,
          transform: [{ translateY: rise }],
        }}
      >
        <View
          accessible
          style={{
            width: cardWidth,
            flexDirection: 'row',
            alignItems: 'center',
            height: STRIP_HEIGHT,
            paddingHorizontal: 6,
            borderRadius: STRIP_HEIGHT / 2,
            backgroundColor: colors['cta-options'],
            borderWidth: 0.5,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,27,33,0.08)',
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.5 : 0.25,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 10 },
            elevation: 16,
          }}
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
                android_ripple={{ color: RIPPLE_INK, borderless: true, radius: 25 }}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? colors['surface-active'] : 'transparent',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ fontSize: 25 }}>{emoji}</Text>
              </Pressable>
            );
          })}
          <View style={{ width: 1, height: 24, backgroundColor: colors['separator'] }} />
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              onClose();
              setShowPicker(true);
            }}
            accessibilityLabel="Choose any emoji to react"
            android_ripple={{ color: RIPPLE_INK, borderless: true, radius: 22 }}
            style={({ pressed }) => ({
              height: 44,
              minWidth: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="add" size={22} color={colors['text-muted']} />
          </Pressable>
        </View>

        {/* Menu deck below the pill, anchored to the same message. */}
        <View
          onLayout={(event) => setCardHeight(event.nativeEvent.layout.height)}
          style={{
            marginTop: 8,
            width: cardWidth,
            borderRadius: 20,
            overflow: 'hidden',
            backgroundColor: colors['cta-options'],
            borderWidth: 0.5,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,27,33,0.08)',
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.5 : 0.25,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 10 },
            elevation: 16,
          }}
        >
          {rows.map((row, index) => (
            <Fragment key={row.key}>
              {index > 0 ? (
                <View style={{ height: 0.5, backgroundColor: colors['separator'] }} />
              ) : null}
              <Pressable
                onPress={row.onPress}
                accessibilityRole="button"
                accessibilityLabel={row.label}
                android_ripple={{ color: RIPPLE_INK, borderless: false }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  columnGap: 14,
                  minHeight: ROW_HEIGHT,
                  paddingHorizontal: 16,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Ionicons
                  name={row.icon}
                  size={20}
                  color={row.destructive ? colors['text-error'] : colors['text-muted']}
                />
                <Text
                  style={{
                    fontSize: 15.5,
                    lineHeight: 20,
                    color: row.destructive ? colors['text-error'] : colors['text-strong'],
                  }}
                >
                  {row.label}
                </Text>
              </Pressable>
            </Fragment>
          ))}
        </View>
      </Animated.View>

      {/* The full emoji keyboard: WhatsApp closes the quick deck when the
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
