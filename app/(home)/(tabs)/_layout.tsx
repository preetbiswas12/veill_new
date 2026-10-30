import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { View } from 'react-native';
import clsx from 'clsx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { useCometChat } from '@/hooks/useCometChat';
import { useTheme } from '@/hooks/useTheme';

/**
 * Tab bar measured off WhatsApp-android's 2024+ build: 60dp flat bar,
 * labeled slots, a round chip behind the active icon, gray labels in both
 * states, and an unread pill on the chats icon.
 *
 * react-navigation v7 contract this layout respects (read from the installed
 * @react-navigation/bottom-tabs source):
 *  - `tabBarIcon` content is rendered inside a fixed 31x28 box (TabBarIcon
 *    wrapperUikit), stacked twice for the active/inactive fade. Anything
 *    larger — capsules, labels, badges built inside the icon — gets clamped
 *    into that box, which is exactly the "icons not showing" regression.
 *  - So the icon stays a plain glyph in a 28x28 slot (the active chip IS the
 *    slot fill and fits the box budget), the label is react-navigation's own
 *    (`tabBarLabelStyle` + tints), and the badge is the native `tabBarBadge`.
 *
 * Order: chats, updates, communities, calls — WhatsApp's four — with settings
 * as an extra slot on the end so profile and sign-out keep a fixed home.
 */

/** The bar height, excluding the gesture-area inset. */
const TAB_BAR_HEIGHT = 60;

type TabIconName = ComponentProps<typeof Ionicons>['name'];

/** 28x28 slot fill: a round chip when focused, a plain centered glyph. */
const TabIcon = ({
  focused,
  name,
  focusedName,
}: {
  focused: boolean;
  name: TabIconName;
  focusedName: TabIconName;
}) => {
  const { colors } = useTheme();
  return (
    <View
      className={clsx(
        'h-7 w-7 items-center justify-center rounded-full',
        focused ? 'bg-surface-active' : 'bg-transparent'
      )}
    >
      <Ionicons
        name={focused ? focusedName : name}
        size={22}
        color={focused ? colors['text-strong'] : colors['text-muted']}
      />
    </View>
  );
};

const TabsLayout = () => {
  const router = useRouter();
  const { incomingCall, conversations } = useCometChat();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const unreadTotal = conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0);

  useEffect(() => {
    if (incomingCall) {
      router.navigate({
        pathname: `/call/[id]`,
        params: {
          id: incomingCall.peerUserId,
          video: incomingCall.video ? '1' : '0',
          direction: 'incoming',
          name: incomingCall.callerName || '',
          image: incomingCall.callerImage || '',
        },
      });
    }
  }, [incomingCall, router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Labels are react-navigation's own: 12sp, gray in both states —
        // WhatsApp-android keeps labels uniform and lets the chip carry the
        // active signal.
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors['text-muted'],
        tabBarInactiveTintColor: colors['text-muted'],
        tabBarLabelStyle: { fontSize: 12, lineHeight: 14 },
        tabBarButton: HapticTab,
        // WhatsApp-android's bar is a flat, hairline-less panel.
        tabBarStyle: {
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom,
          backgroundColor: colors['surface-muted'],
        },
        sceneStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarBadge: unreadTotal > 0 ? unreadTotal : undefined,
          tabBarBadgeStyle: { backgroundColor: colors['product'] },
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="chatbubbles-outline" focusedName="chatbubbles" />
          ),
        }}
      />
      <Tabs.Screen
        name="updates"
        options={{
          title: 'Updates',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="radio-outline" focusedName="radio" />
          ),
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: 'Communities',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="people-outline" focusedName="people" />
          ),
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Calls',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="call-outline" focusedName="call" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="settings-outline" focusedName="settings" />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
