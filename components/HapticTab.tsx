import * as Haptics from 'expo-haptics';
import { Pressable, type PressableProps } from 'react-native';

/**
 * React Navigation hands the tab's icon, label and badge to `tabBarButton` as
 * `children`, so the wrapper has to render them. Swallowing them leaves every
 * tab button blank, which shows up as an empty strip where the bar should be.
 */
export function HapticTab({ children, onPressIn, ...props }: PressableProps) {
  return (
    <Pressable
      {...props}
      onPressIn={(event) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPressIn?.(event);
      }}
    >
      {children}
    </Pressable>
  );
}