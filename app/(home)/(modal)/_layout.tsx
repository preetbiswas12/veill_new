import { Feather } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';

/**
 * The modal group uses the native stack header, with each screen holding its
 * Cancel/back chrome in `headerLeft`.
 *
 * Everything here takes literal values: the modal screens never painted a
 * background of their own, so the stack's default white showed through (glaring
 * in dark mode, with the dark cards reading as boxes on it), and NativeWind's
 * CSS-variable classes do not reach a native header bar anyway - its tint and
 * title colour go through screenOptions instead. One place themes all four
 * screens: profile, new-message, new-group, find-by-username.
 */
const ModalLayout = () => {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors['chat-bg'] },
        headerBackground: () => null,
        headerTintColor: colors['text-strong'],
        headerTitleStyle: {
          color: colors['text-strong'],
          fontSize: 17,
          fontWeight: '600',
        },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={({ pressed }) => ({ paddingHorizontal: 12, opacity: pressed ? 0.6 : 1 })}
            >
              <Feather name="chevron-left" size={32} color={colors['text-strong']} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="new-message"
        options={{
          title: 'New Message',
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={({ pressed }) => ({ paddingHorizontal: 12, opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={{ fontSize: 17, color: colors['link'] }}>Cancel</Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="new-group"
        options={{
          title: 'Select Members',
        }}
      />
      <Stack.Screen
        name="find-by-username"
        options={{
          title: 'Find by Username',
        }}
      />
    </Stack>
  );
};

export default ModalLayout;
