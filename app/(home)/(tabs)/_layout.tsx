import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { useCometChat } from '@/hooks/useCometChat';

/**
 * Tab bar built from the Figma file "WhatsApp Screens 2025 with Meta AI - UI for
 * iOS": 83pt tall, 32pt icons, 10pt medium labels, five evenly spread items,
 * blurred panel background with a 0.33px top hairline, and the unread badge
 * sitting on the Chats item.
 *
 * Our four destinations map onto WhatsApp's five so nothing is lost:
 *   Updates    <- status updates (the shared group that backs our stories)
 *   Calls      <- call history
 *   Communities<- groups the user belongs to
 *   Chats      <- conversations
 *   Settings   <- profile + sign out
 */

const TAB_ICON = 32;
const TAB_LABEL = 10;
/** The design's bar height, excluding the home-indicator inset. */
const TAB_BAR_HEIGHT = 83;
/** The design's 23pt side padding and 5 items across 393pt. */
const TAB_BAR_PADDING = 23;
const TAB_COUNT = 5;

type TabIconName = ComponentProps<typeof Ionicons>['name'];

/** A tab renders a 32pt icon over a 10pt label, both driven by `focused`. */
const WhatsAppTabIcon = ({
  focused,
  name,
  focusedName,
  label,
  width,
}: {
  focused: boolean;
  name: TabIconName;
  focusedName: TabIconName;
  label: string;
  width: number;
}) => (
  <View className="items-center" style={{ width }}>
    <Ionicons name={focused ? focusedName : name} size={TAB_ICON} color={focused ? '#0a0a0a' : '#767779'} />
    <Text
      className="text-tabbar"
      numberOfLines={1}
      style={{ color: focused ? '#0a0a0a' : '#767779', fontWeight: '500' }}
    >
      {label}
    </Text>
  </View>
);

const TabsLayout = () => {
  const router = useRouter();
  const { incomingCall, conversations } = useCometChat();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // The design pins each item to a 32pt column and lets the row distribute the
  // slack with justify-between. Hard-coding 32 makes the wider labels collide
  // on a 320pt screen, so grow the column to whatever the width allows, bounded
  // by the design's 32pt so the spacing never gets tighter than the file shows.
  const tabItemWidth = Math.max(
    32,
    Math.min(64, (width - TAB_BAR_PADDING * 2) / TAB_COUNT)
  );

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
        // The design floats the bar over the content on a 0.8-alpha panel. A
        // fully transparent bar plus a BlurView is invisible wherever the blur
        // fails to render, so the panel colour is the base and the bar keeps a
        // normal (non-absolute) position.
        tabBarStyle: {
            // The design's 83pt excludes the home-indicator inset, so add that
            // back here rather than letting it clip the gesture bar.
            height: TAB_BAR_HEIGHT + insets.bottom,
            paddingTop: 3,
            // The design's button row ends 2pt above the home indicator.
            paddingBottom: insets.bottom + 2,
            paddingHorizontal: TAB_BAR_PADDING,
            backgroundColor: 'rgba(244,244,244,0.95)',
            borderTopWidth: 0.33,
            borderTopColor: 'rgba(0,0,0,0.3)',
            elevation: 0,
          },
        sceneStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Tabs.Screen
        name="updates"
        options={{
          title: 'Updates',
          tabBarIcon: ({ focused }) => (
            <WhatsAppTabIcon width={tabItemWidth} focused={focused} name="radio-outline" focusedName="radio" label="Updates" />
          ),
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Calls',
          tabBarIcon: ({ focused }) => (
            <WhatsAppTabIcon width={tabItemWidth} focused={focused} name="call-outline" focusedName="call" label="Calls" />
          ),
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: 'Communities',
          tabBarIcon: ({ focused }) => (
            <WhatsAppTabIcon
              width={tabItemWidth}
              focused={focused}
              name="people-outline"
              focusedName="people"
              label="Communities"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ focused }) => (
            <View>
              <WhatsAppTabIcon width={tabItemWidth} focused={focused} name="chatbubbles-outline" focusedName="chatbubbles" label="Chats" />
              {unreadTotal > 0 ? (
                <View className="absolute -top-1 -right-3 min-w-[18px] h-[18px] px-1.5 rounded-full bg-primary items-center justify-center">
                  <Text className="text-body-3 text-white">{unreadTotal > 99 ? '99+' : unreadTotal}</Text>
                </View>
              ) : null}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <WhatsAppTabIcon width={tabItemWidth} focused={focused} name="settings-outline" focusedName="settings" label="Settings" />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;