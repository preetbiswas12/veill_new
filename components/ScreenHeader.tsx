import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * The design's `Header` component (Figma 6:1510) is 98pt tall, but that height
 * *includes* a 54pt status bar - the visible content row is only 44pt.
 *
 * Drawing that 98pt below a SafeAreaView that already pads for the status bar
 * makes every header roughly 54pt too tall on a notched device. This component
 * therefore owns the top inset itself and renders a 44pt row beneath it, so the
 * total lands on 98pt as designed on any device.
 */
interface ScreenHeaderProps {
  left?: ReactNode;
  title?: string;
  right?: ReactNode;
  /** Transparent for headers drawn over the chat wallpaper. */
  translucent?: boolean;
}

export function ScreenHeader({
  left,
  title,
  right,
  translucent = false,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: translucent ? 'transparent' : 'rgba(244,244,244,0.95)',
        borderBottomWidth: translucent ? 0 : 0.33,
        borderBottomColor: 'rgba(0,0,0,0.3)',
      }}
    >
      <View className="h-11 px-4 flex-row items-center justify-between">
        <View className="flex-1 min-w-0 flex-row items-center">{left}</View>
        {title ? (
          <View className="flex-1 px-2">
            <Text className="text-body-1 font-semibold text-text-strong" numberOfLines={1}>
              {title}
            </Text>
          </View>
        ) : null}
        <View className="flex-row items-center">{right}</View>
      </View>
    </View>
  );
}

/**
 * The design's 28pt circular control. `solid` is the brand-green variant used for
 * the trailing action; the others sit on `surface-cta`.
 */
export function HeaderButton({
  onPress,
  label,
  solid,
  icon,
  children,
  size = 28,
}: {
  onPress: () => void;
  label: string;
  solid?: boolean;
  icon?: ComponentProps<typeof Ionicons>['name'];
  children?: ReactNode;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={{ height: size, width: size }}
      className={`rounded-full items-center justify-center active:opacity-60 ${
        solid ? 'bg-primary' : 'bg-surface-cta'
      }`}
    >
      {children ?? <Ionicons name={icon ?? 'add'} size={24} color={solid ? '#ffffff' : '#0a0a0a'} />}
    </Pressable>
  );
}