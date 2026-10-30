import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, PanResponder, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

/**
 * WhatsApp-style swipe-to-reply.
 *
 * Wrap a message bubble row: a mostly-horizontal drag slides the bubble,
 * reveals the reply arrow on the trailing side, and past the threshold fires
 * `onReply` once with a success haptic; release before the threshold springs
 * the bubble back. Vertical FlatList scrolling is untouched — the pan only
 * claims the gesture when the horizontal component clearly dominates.
 *
 * Pure React Native (Animated + PanResponder), so this needs no native build.
 */
const THRESHOLD = 64;
const MAX_DRAG = 88;

const SwipeToReply = ({ onReply, children }: { onReply: () => void; children: ReactNode }) => {
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const firedRef = useRef(false);

  useEffect(() => () => translateX.stopAnimation(), [translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, g) =>
        !firedRef.current &&
        Math.abs(g.dx) > 8 &&
        Math.abs(g.dx) > Math.abs(g.dy) * 1.35,
      onPanResponderMove: (_evt, g) => {
        if (firedRef.current) return;
        // The row tracks the finger within the cap; the spring is what makes
        // the fire-and-settle feel like WhatsApp's instead of a snap.
        translateX.setValue(Math.max(-MAX_DRAG, Math.min(MAX_DRAG, g.dx)));
        if (Math.abs(g.dx) >= THRESHOLD) {
          firedRef.current = true;
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onReply();
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
        }
      },
      onPanResponderRelease: () => {
        if (!firedRef.current) {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
        }
      },
      onPanResponderTerminate: () => {
        if (!firedRef.current) {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
        }
      },
      onPanResponderEnd: () => {
        firedRef.current = false;
      },
    })
  ).current;

  // The arrow fades in as the drag grows, on the side the bubble moved away
  // from: a left-anchored arrow for a rightward swipe, right-anchored leftward.
  const revealRight = translateX.interpolate({
    inputRange: [0, THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const revealLeft = translateX.interpolate({
    inputRange: [-THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View>
      <View
        pointerEvents="none"
        className="absolute inset-y-0 left-0 w-12 items-center justify-center"
      >
        <Animated.View style={{ opacity: revealRight }}>
          <Ionicons name="arrow-undo" size={22} color={colors['product-deep']} />
        </Animated.View>
      </View>
      <View
        pointerEvents="none"
        className="absolute inset-y-0 right-0 w-12 items-center justify-center"
      >
        <Animated.View style={{ opacity: revealLeft }}>
          <Ionicons name="arrow-undo" size={22} color={colors['product-deep']} />
        </Animated.View>
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
};

export default SwipeToReply;
