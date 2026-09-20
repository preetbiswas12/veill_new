import { Ionicons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useUser } from '@clerk/clerk-expo';
import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { HapticTab } from '@/components/HapticTab';
import { useCometChat } from '@/hooks/useCometChat';

const TabsLayout = () => {
  const router = useRouter();
  const { user } = useUser();
  const { incomingCall, acceptIncomingCall } = useCometChat();

  useEffect(() => {
    if (incomingCall) {
      router.navigate({
        pathname: `/call/[id]`,
        params: {
          id: incomingCall.peerUserId,
        },
      });
    }
  }, [incomingCall, router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'black',
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: 'white',
        },
        headerTransparent: true,
        headerTitleAlign: 'center',
      }}
    >
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubble-sharp" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Calls',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="phone" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stories"
        options={{
          title: 'Stories',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="web-stories" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
