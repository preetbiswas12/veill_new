import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

/** Bouncing "…" bubble shown while a peer is composing a message. */
const TypingIndicator = () => {
  const [dots] = useState(() => [
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  useEffect(() => {
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 180),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(360 - index * 180),
        ])
      )
    );

    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [dots]);

  return (
    <View className="flex-row px-4 mb-1">
      <View className="flex-row items-center gap-1.5 px-4 py-3.5 rounded-2xl rounded-bl-md bg-white border border-gray-100">
        {dots.map((dot, index) => (
          <Animated.View
            key={index}
            style={{
              opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
              transform: [
                { translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) },
              ],
            }}
            className="w-1.5 h-1.5 rounded-full bg-gray-400"
          />
        ))}
      </View>
    </View>
  );
};

export default TypingIndicator;
