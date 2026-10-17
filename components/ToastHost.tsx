import { useEffect } from 'react';
import { Text, View } from 'react-native';

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
  useEffect(() => {
    const timer = setTimeout(onDone, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDone]);

  return (
    <View
      pointerEvents="none"
      className="absolute bottom-24 left-0 right-0 items-center px-4"
    >
      <View className="px-4 py-2.5 rounded-card bg-text-strong shadow-lg">
        <Text className="text-body-2 text-text-invert">{message}</Text>
      </View>
    </View>
  );
};

export default ToastHost;
