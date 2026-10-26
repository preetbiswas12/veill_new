import { AlertButton, Animated, Modal, Pressable, Text, View } from 'react-native';
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

  const horizontal = (current?.buttons.length ?? 0) <= 2;

  return (
    <Modal
      visible={Boolean(current)}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleBack}
    >
      <View className="flex-1 items-center justify-center bg-black/40 px-8">
        {current ? (
          <Animated.View
            style={{ opacity }}
            className="w-[270px] rounded-card overflow-hidden bg-cta-options border-hair border-panel-border"
          >
            <Text className="px-5 pt-5 text-[16px] leading-[20px] font-semibold text-text-strong text-center">
              {current.title}
            </Text>
            {current.message ? (
              <Text className="px-5 pt-1.5 pb-5 text-[13px] leading-[17px] text-text-muted text-center">
                {current.message}
              </Text>
            ) : (
              <View className="h-4" />
            )}
            {/* iOS spacing rule: exactly two buttons sit on one hairline row;
                three or more stack so the labels stay readable. */}
            <View className={horizontal ? 'flex-row border-t-hair border-separator' : undefined}>
              {current.buttons.map((button, index) => (
                <Pressable
                  key={`${button.text}-${index}`}
                  onPress={() => {
                    button.onPress?.();
                    close();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={button.text}
                  className={
                    horizontal
                      ? `flex-1 h-11 items-center justify-center active:bg-surface-muted ${
                          index > 0 ? 'border-l-hair border-separator' : ''
                        }`
                      : `h-11 items-center justify-center border-t-hair border-separator active:bg-surface-muted`
                  }
                >
                  <Text
                    className={
                      button.style === 'destructive'
                        ? 'text-[16px] text-text-error'
                        : button.style === 'cancel'
                          ? 'text-[16px] font-semibold text-link'
                          : 'text-[16px] text-link'
                    }
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
