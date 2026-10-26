import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

/**
 * Brief confirmation toast.
 *
 * Several actions in this app have no other visible outcome - starring a message
 * in particular, since the star only shows the next time the message's action
 * sheet opens. Without a toast those controls read as broken, which is the same
 * failure as a dead button.
 *
 * It clears itself, and reports back so the caller can drop its own copy of the
 * message; that keeps the timer in one place rather than per call site.
 *
 * Motion is deliberately small: a 12pt rise and a fade in, hold, then a fade
 * out just before the caller unmounts it. Nothing bounces; the point is that
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
        }}
        className="px-4 py-2.5 rounded-card bg-text-strong shadow-lg"
      >
        <Text className="text-body-2 text-text-invert">{message}</Text>
      </Animated.View>
    </View>
  );
};

export default ToastHost;
