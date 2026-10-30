import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

/**
 * Brief confirmation toast, dressed like WhatsApp-android's (e.g. "Message
 * starred"): a dark rounded bar centred above the tab area — near-black in
 * light mode, the panel grey in dark — with small 13sp text.
 *
 * Several actions in this app have no other visible outcome - starring a message
 * in particular, since the star only shows the next time the message's action
 * sheet opens. Without a toast those controls read as broken, which is the same
 * failure as a dead button.
 *
 * It clears itself, and reports back so the caller can drop its own copy of the
 * message; that keeps the timer in one place rather than per call site.
 *
 * Motion stays small: a 12pt rise plus a fade in, hold, return. Nothing bounces;
 * the confirmation should be noticed once, not announced.
 */
const ToastHost = ({
  message,
  onDone,
  duration = 1800,
}: {
  message: string;
  onDone: () => void;
  duration?: number;
}) => {
  const { isDark, colors } = useTheme();
  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    appear.setValue(0);
    const entrance = Animated.timing(appear, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    });
    const exit = Animated.timing(appear, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    });
    entrance.start();
    const fadeTimer = setTimeout(() => exit.start(), Math.max(200, duration - 220));
    const doneTimer = setTimeout(onDone, duration);
    return () => {
      fadeTimer && clearTimeout(fadeTimer);
      doneTimer && clearTimeout(doneTimer);
      entrance.stop();
      exit.stop();
    };
  }, [message, duration, onDone, appear]);

  return (
    <View
      pointerEvents="none"
      className="absolute bottom-24 left-0 right-0 items-center px-4"
    >
      <Animated.View
        style={{
          opacity: appear,
          transform: [
            {
              translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
            },
          ],
          // WhatsApp's toast palette: fixed darks that do not invert with the
          // theme (the near-black bar reads on the light wallpaper; the panel
          // grey reads on the dark one).
          backgroundColor: isDark ? '#2a3942' : '#323232',
          borderRadius: 10,
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            lineHeight: 17,
            color: isDark ? colors['text-strong'] : '#ffffff',
          }}
        >
          {message}
        </Text>
      </Animated.View>
    </View>
  );
};

export default ToastHost;
