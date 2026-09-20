import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';

export function HapticTab() {
  return (
    <Pressable
      onPressIn={() => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }}
    />
  );
}
