import { AlertButton, Animated, BackHandler, Modal, Pressable, Text, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';

import { useTheme } from '@/hooks/useTheme';

/**
 * The app's own alert.
 *
 * `Alert.alert` is the one surface that always renders light on Android, so in
 * dark mode every confirmation appeared as a white Material dialog over a dark
 * app. This keeps `Alert.alert`'s exact call shape — title, optional message,
 * and the same `{ text, style, onPress }` buttons — but renders an iOS-styled
 * card that follows the palette like every other surface.
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

const AlertDialogHost = () => {
  const { colors } = useTheme();
  const [queue, setQueue] = useState<AlertDialogRequest[]>([]);
  const current = queue[0];
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dispatchAlert = (request) => setQueue((prev) => [...prev, request]);
    return () => {
      dispatchAlert = null;
    };
  }, []);

  useEffect(() => {
    if (!current) return;
    opacity.setValue(0);
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: 140,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [current, opacity]);

  const close = () => setQueue((prev) => prev.slice(1));

  // The dimmed backdrop does not dismiss on tap (that is iOS behaviour);
  // Android's back gesture acts as the first cancel-style button, or dismisses.
  const handleBack = () => {
    if (!current) return;
    const cancel = current.buttons.find((button) => button.style === 'cancel');
    if (cancel?.onPress) cancel.onPress();
    close();
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
  }, [current]);

  const horizontal = (current?.buttons.length ?? 0) <= 2;

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
          below is therefore explicit through the palette - including this
          placement container, whose flex-1/items-center classes would
          otherwise be dropped and leave the card anchored to the top-left. */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
          backgroundColor: 'rgba(0,0,0,0.4)',
        }}
      >
        {current ? (
          <Animated.View
            style={{
              opacity,
              width: 270,
              borderRadius: 14, // rounded-card
              overflow: 'hidden',
              backgroundColor: colors['cta-options'],
              borderColor: colors['panel-border'],
              borderWidth: 0.5,
            }}
          >
            <Text
              style={{
                paddingHorizontal: 20,
                paddingTop: 20,
                fontSize: 16,
                lineHeight: 20,
                fontWeight: '600',
                color: colors['text-strong'],
                textAlign: 'center',
              }}
            >
              {current.title}
            </Text>
            {current.message ? (
              <Text
                style={{
                  paddingHorizontal: 20,
                  paddingTop: 6,
                  // A short step to the action row: the hairline lands just
                  // under the last line of text, so the actions read as part
                  // of the sentence rather than pinned to the card's edge.
                  paddingBottom: 12,
                  fontSize: 13,
                  lineHeight: 17,
                  color: colors['text-muted'],
                  textAlign: 'center',
                }}
              >
                {current.message}
              </Text>
            ) : (
              <View style={{ height: 14 }} />
            )}
            <View
              style={{
                borderTopWidth: 0.5,
                borderTopColor: colors['separator'],
                flexDirection: horizontal ? 'row' : 'column',
                // Horizontal actions with a pair (Cancel + OK) close on the
                // card's trailing edge, WhatsApp-style. A lone action takes
                // the midpoint: half the travel from centre to the edge.
                justifyContent:
                  horizontal
                    ? (current.buttons.length === 1 ? 'center' : 'flex-end')
                    : 'flex-start',
                paddingHorizontal: horizontal ? 12 : 0,
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
                  style={({ pressed }) => [
                    horizontal
                      ? {
                          height: 44,
                          paddingHorizontal: 14,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderLeftWidth: index > 0 ? 0.5 : 0,
                          borderLeftColor: colors['separator'],
                        }
                      : {
                          minHeight: 44,
                          paddingHorizontal: 20,
                          alignItems: 'flex-start',
                          justifyContent: 'center',
                          borderTopWidth: index > 0 ? 0.5 : 0,
                          borderTopColor: colors['separator'],
                        },
                    pressed ? { backgroundColor: colors['surface-muted'] } : null,
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      textAlign: horizontal ? undefined : 'left',
                      color:
                        button.style === 'destructive'
                          ? colors['text-error']
                          : colors['link'],
                      fontWeight: button.style === 'cancel' ? '600' : '400',
                    }}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
};

export default AlertDialogHost;
