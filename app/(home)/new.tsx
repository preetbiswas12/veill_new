import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * The design's "New" action sheet, opened from the chats header's + button:
 * New chat, New group, and the channels entry point.
 *
 * A real screen rather than a react-native Modal: hardware back pops it
 * through the native stack, the one dismissal path guaranteed on every
 * Android build - the Modal-based sheets could not rely on their dialog
 * window receiving the back gesture.
 */
const NewMenuScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const options: { icon: IconName; label: string; href: Href }[] = [
    { icon: 'chatbubbles-outline', label: 'New chat', href: '/new-message' },
    { icon: 'people-outline', label: 'New group', href: '/new-group' },
    { icon: 'megaphone-outline', label: 'Find channels to follow', href: '/communities' },
  ];

  return (
    <View className="flex-1">
      {/* The chats list stays visible behind the dim; tapping it closes, as
          does hardware back. */}
      <Pressable
        accessibilityLabel="Close menu"
        accessibilityRole="button"
        className="flex-1 bg-black/40"
        onPress={() => router.back()}
      />
      <View
        className="rounded-t-3xl bg-surface px-2 pt-3"
        style={{
          paddingBottom: insets.bottom + 24,
          shadowColor: '#000',
          shadowOpacity: 0.5,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -6 },
          elevation: 24,
        }}
      >
        <View className="items-center pb-3">
          <View className="h-1 w-10 rounded-full bg-separator" />
        </View>
        {options.map((option) => (
          <Pressable
            key={option.label}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            onPress={() => router.dismissTo(option.href)}
            className="flex-row items-center gap-4 px-6 py-4 active:bg-surface-muted"
          >
            <Ionicons name={option.icon} size={22} color={colors.teal} />
            <Text className="text-body-1 text-text-strong">{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export default NewMenuScreen;
