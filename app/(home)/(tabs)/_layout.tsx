import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import clsx from 'clsx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { useCometChat } from '@/hooks/useCometChat';
import { useTheme } from '@/hooks/useTheme';

/**
 * Tab bar measured off WhatsApp-android's 2024+ build:
 *
 *   bar 60dp, flat panel colour, no top hairline
 *   icon 26dp over a 12sp gray label
 *   active slot: 44x32dp rounded capsule in the chip green with a strong icon
 *   inactive slot: plain gray icon and label
 *   unread badge: 18dp green pill with the mode-inverted count on the chats icon
 *
 * Our five destinations keep the same shapes: chats first, then updates,
 * communities, calls — WhatsApp's four — with settings as an extra slot on the
 * end so profile and sign-out keep a fixed home (WhatsApp reaches settings from
 * its overflow menu instead; the menu here mirrors that entry).
 */

/** The bar height, excluding the gesture-area inset. */
const TAB_BAR_HEIGHT = 60;

type TabIconName = ComponentProps<typeof Ionicons>['name'];

/**
 * One tab slot: a 44x32dp capsule behind a 26dp icon, a 12sp label under it,
 * plus the optional unread pill on the chats icon.
 */
const WhatsAppTabIcon = ({
  focused,
  name,
  focusedName,
  label,
  badge,
}: {
  focused: boolean;
  name: TabIconName;
  focusedName: TabIconName;
  label: string;
  badge?: number;
}) => {
  const { colors } = useTheme();
  return (
    <View className="items-center">
      <View className="relative">
        <View
          className={clsx(
            'h-8 px-3.5 rounded-full items-center justify-center',
            focused ? 'bg-surface-active' : 'bg-transparent'
          )}
        >
          <Ionicons
            name={focused ? focusedName : name}
            size={26}
            color={focused ? colors['text-strong'] : colors['text-muted']}
          />
        </View>
        {badge && badge > 0 ? (
          <View className="absolute -top-1 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary items-center justify-center border-[1.5px] border-panel-blur">
            <Text className="text-body-3 font-semibold text-text-invert">
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        className="text-tabbar mt-[3px]"
        numberOfLines={1}
        style={{ color: colors['text-muted'] }}
      >
        {label}
      </Text>
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
        tabBarShowLabel: false,
        tabBarButton: HapticTab,
        // WhatsApp-android's bar is a flat, hairline-less panel; the token is
        // solid-backed instead of a BlurView so the bottom edge never breaks.
        tabBarStyle: {
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingTop: 4,
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
          tabBarIcon: ({ focused }) => (
            <WhatsAppTabIcon
              focused={focused}
              name="chatbubbles-outline"
              focusedName="chatbubbles"
              label="Chats"
              badge={unreadTotal}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="updates"
        options={{
          title: 'Updates',
          tabBarIcon: ({ focused }) => (
            <WhatsAppTabIcon focused={focused} name="radio-outline" focusedName="radio" label="Updates" />
          ),
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: 'Communities',
          tabBarIcon: ({ focused }) => (
            <WhatsAppTabIcon focused={focused} name="people-outline" focusedName="people" label="Communities" />
          ),
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Calls',
          tabBarIcon: ({ focused }) => (
            <WhatsAppTabIcon focused={focused} name="call-outline" focusedName="call" label="Calls" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <WhatsAppTabIcon focused={focused} name="settings-outline" focusedName="settings" label="Settings" />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
