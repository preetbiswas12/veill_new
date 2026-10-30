import { AlertButton, Animated, BackHandler, Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useEffect, useRef, useState } from 'react';

import { useTheme } from '@/hooks/useTheme';

/**
 * The app's own alert, restyled onto WhatsApp-android's Material 3 dialog:
 * a 28dp-radius card, left-aligned title/message, and right-aligned text
 * actions tinted brand-green — destructive red — with ink ripple on press.
 *
 * `Alert.alert` is the one surface that always renders light on Android, so in
 * dark mode every confirmation appeared as a white Material dialog over a dark
 * app. This keeps `Alert.alert`'s exact call shape — title, optional message,
 * and the same `{ text, style, onPress }` buttons — but the card and motion
 * follow the active palette like every other surface.
 *
 * A module-level emitter plus one host mounted in the root layout, so screens
 * can call it before any local component tree exists, and the requests queue
 * rather than shadow each other.
 */

export type AlertDialogButton = AlertButton;

interface AlertDialogRequest {
  title: string;
  message?: string;
  buttons: AlertDialogButton[];
}

let dispatchAlert: ((request: AlertDialogRequest) => void) | null = null;

export const showAlertDialog = (
  title: string,
  message?: string,
  buttons?: AlertDialogButton[],
  // Accepted so call sites can keep Alert.alert's exact shape; the system
  // dialog's Android-only `cancelable` hint has no equivalent here — the back
  // gesture always acts as cancel.
  _options?: { cancelable?: boolean }
) => {
  const request: AlertDialogRequest = {
    title,
    message,
    buttons: buttons && buttons.length ? buttons : [{ text: 'OK', style: 'cancel' }],
  };
  if (dispatchAlert) {
    dispatchAlert(request);
    return;
  }
  // No host mounted yet (should not happen — the root layout mounts one) —
  // fall back to the system alert rather than swallowing the action.
  const { Alert } = require('react-native');
  Alert.alert(request.title, request.message, request.buttons);
};

/** Ink colour for 12-style ripples, tuned to read in both modes. */
const RIPPLE_INK = 'rgba(134,150,160,0.20)';

const AlertDialogHost = () => {
  const { colors, isDark } = useTheme();
  const [queue, setQueue] = useState<AlertDialogRequest[]>([]);
  const current = queue[0];
  const [closing, setClosing] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  const { width: windowWidth } = useWindowDimensions();

  useEffect(() => {
    dispatchAlert = (request) => setQueue((prev) => [...prev, request]);
    return () => {
      dispatchAlert = null;
    };
  }, []);

  // Entrance: the scrim fades while the card rises from 94% like Material's
  // emphasized easing; exit reverses quickly and only then swaps the queue.
  useEffect(() => {
    if (!current) return;
    setClosing(false);
    opacity.setValue(0);
    scale.setValue(0.94);
    const animation = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 4 }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [current, opacity, scale]);

  const finish = () => {
    if (!current) return;
    setClosing(true);
    const animation = Animated.timing(opacity, { toValue: 0, duration: 110, useNativeDriver: true });
    animation.start(() => setQueue((prev) => prev.slice(1)));
  };

  const close = finish;

  // The dimmed backdrop does not dismiss on tap (that is iOS behaviour);
  // Android's back gesture acts as the first cancel-style button, or dismisses.
  const handleBack = () => {
    if (!current || closing) return;
    const cancel = current.buttons.find((button) => button.style === 'cancel');
    if (cancel?.onPress) cancel.onPress();
    finish();
  };

  // Belt and braces over Modal's onRequestClose: not every Android build
  // delivers the back gesture to the dialog's own window, so an explicit
  // subscription guarantees back always dismisses the dialog - and never
  // falls through to the navigator or the system.
  useEffect(() => {
    if (!current) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const cardWidth = Math.min(300, windowWidth - 40);
  // WhatsApp/M3 action tint: brand green, destructive red, cancel muted.
  const actionTint = isDark ? colors['product'] : colors['teal'];
  // Menu-style stacking once a picker carries more than a pair of rows,
  // matching the wallpaper/theme pickers' option lists.
  const stacked = (current?.buttons.length ?? 0) > 2;

  return (
    <Modal
      visible={Boolean(current)}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleBack}
    >
      {/* A Modal renders into its own native window, and NativeWind's
          CSS-variable classes do not reliably resolve inside it on Android -
          the card came out white with no radius in dark mode. Every style
          below is therefore explicit through the palette. */}
      <Animated.View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity,
        }}
      >
        {current ? (
          <Animated.View
            style={{
              opacity,
              transform: [{ scale }],
              width: cardWidth,
              borderRadius: 28, // M3 emphasized card
              overflow: 'hidden',
              backgroundColor: colors['cta-options'],
              // M3 dialogs carry elevation through a soft key shadow, not an
              // outline; Android needs the borderless-flat fallback in token.
              shadowColor: colors['bubble-shadow'],
              shadowOpacity: 0.18,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 12,
            }}
          >
            <Text
              style={{
                paddingHorizontal: 24,
                paddingTop: 22,
                fontSize: 18,
                lineHeight: 24,
                fontWeight: '600',
                color: colors['text-strong'],
                textAlign: 'left',
              }}
            >
              {current.title}
            </Text>
            {current.message ? (
              <Text
                style={{
                  paddingHorizontal: 24,
                  paddingTop: 7,
                  paddingBottom: 10,
                  fontSize: 14,
                  lineHeight: 19,
                  color: colors['text-muted'],
                  textAlign: 'left',
                }}
              >
                {current.message}
              </Text>
            ) : (
              <View style={{ height: 10 }} />
            )}
            <View
              style={{
                flexDirection: stacked ? 'column' : 'row',
                // Material 3 puts every action on the trailing edge — WhatsApp
                // dialogs included. (Replaces the old iOS carry of centring a
                // lone action or trailing Cancel/OK.) Four-option pickers
                // (wallpaper, transports) instead stack as full-width list
                // rows, the M3 menu idiom, so nothing overflows the card.
                justifyContent: 'flex-end',
                paddingHorizontal: 12,
                paddingTop: stacked ? 4 : 0,
                paddingBottom: 14,
              }}
            >
              {current.buttons.map((button, index) => (
                <Pressable
                  key={`${button.text}-${index}`}
                  onPress={() => {
                    button.onPress?.();
                    close();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={button.text}
                  android_ripple={{ color: RIPPLE_INK, radius: 72 }}
                  style={({ pressed }) => ({
                    minHeight: stacked ? 48 : 44,
                    paddingHorizontal: 14,
                    marginTop: stacked && index > 0 ? 2 : 0,
                    marginLeft: !stacked && index > 0 ? 6 : 0,
                    alignSelf: stacked ? 'stretch' : undefined,
                    width: stacked ? '100%' : undefined,
                    alignItems: stacked ? 'flex-start' : 'center',
                    justifyContent: 'center',
                    borderRadius: 22,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontSize: stacked ? 15 : 14,
                      lineHeight: stacked ? 20 : 20,
                      letterSpacing: 0.1,
                      textAlign: stacked ? 'left' : undefined,
                      // Tint tiers, WhatsApp/M3: destructive red; a lone
                      // confirm is always read as the primary action (the
                      // fallback `{ text: 'OK', style: 'cancel' }` would
                      // otherwise render a dead grey corner button); a Cancel
                      // in a pair is muted; multi-option menus render neutral
                      // rows with green reserved for the checkmark the caller
                      // embeds in its own label.
                      color:
                        button.style === 'destructive'
                          ? colors['text-error']
                          : stacked
                            ? button.style === 'cancel'
                              ? colors['text-muted']
                              : colors['text-strong']
                            : current.buttons.length === 1 || button.style !== 'cancel'
                              ? actionTint
                              : colors['text-muted'],
                      fontWeight: '600',
                    }}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        ) : null}
      </Animated.View>
    </Modal>
  );
};

export default AlertDialogHost;
