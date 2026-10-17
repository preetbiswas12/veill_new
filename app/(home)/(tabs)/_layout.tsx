import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { Platform, Text, View } from 'react-native';

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

type TabIconName = ComponentProps<typeof Ionicons>['name'];

/** A tab renders a 32pt icon over a 10pt label, both driven by `focused`. */
const WhatsAppTabIcon = ({
  focused,
  name,
  focusedName,
  label,
}: {
  focused: boolean;
  name: TabIconName;
  focusedName: TabIconName;
  label: string;
}) => (
  <View className="items-center" style={{ width: 60 }}>
    <Ionicons name={focused ? focusedName : name} size={TAB_ICON} color={focused ? '#0a0a0a' : '#767779'} />
    <Text
      className="text-tabbar"
      style={{ color: focused ? '#0a0a0a' : '#767779', fontWeight: '500' }}
    >
      {label}
    </Text>
  </View>
);

const TabsLayout = () => {
  const router = useRouter();
  const { incomingCall, conversations } = useCometChat();

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
        // The design's tab bar floats over the content on a 0.8-alpha blurred
        // panel rather than sitting on an opaque bar.
        tabBarBackground: () => (
          <BlurView
            intensity={60}
            tint="light"
            style={{ position: 'absolute', inset: 0 }}
          />
        ),
        tabBarStyle: {
          height: 83,
          paddingTop: 3,
          paddingBottom: Platform.OS === 'ios' ? 21 : 8,
          backgroundColor: 'transparent',
          borderTopWidth: 0.33,
          borderTopColor: 'rgba(0,0,0,0.3)',
          position: 'absolute',
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
            <WhatsAppTabIcon focused={focused} name="radio-outline" focusedName="radio" label="Updates" />
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
        name="communities"
        options={{
          title: 'Communities',
          tabBarIcon: ({ focused }) => (
            <WhatsAppTabIcon
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
              <WhatsAppTabIcon focused={focused} name="chatbubbles-outline" focusedName="chatbubbles" label="Chats" />
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
            <WhatsAppTabIcon focused={focused} name="settings-outline" focusedName="settings" label="Settings" />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;