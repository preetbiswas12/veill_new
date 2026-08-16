import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { TouchableOpacity, View, Text, Image } from 'react-native';
import { alert } from '@/utils/customAlert';
import { useState, useEffect } from 'react';
import SocketService from '@/utils/socket';

const Layout = () => {
  const [callState, setCallState] = useState<any>(null);

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Chats',
          headerLargeTitle: true,
          headerTransparent: true,
          headerBlurEffect: 'regular',
          headerLeft: () => (
            <TouchableOpacity onPress={() => alert('Menu', 'Settings menu coming soon.')}>
              <Ionicons
                name="ellipsis-horizontal-circle-outline"
                color={Colors.text}
                size={30}
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 30 }}>
              <TouchableOpacity onPress={() => alert('Camera', 'Quick camera access coming soon.')}>
                <Ionicons name="camera-outline" color={Colors.text} size={30} />
              </TouchableOpacity>
              <Link href="/(modals)/new-chat" asChild>
                <TouchableOpacity>
                  <Ionicons name="add-circle" color={Colors.text} size={30} />
                </TouchableOpacity>
              </Link>
            </View>
          ),
          headerStyle: {
            backgroundColor: Colors.card,
          },
          headerSearchBarOptions: {
            placeholder: 'Search',
          },
        }}
      />

      <Stack.Screen
        name="[id]"
        options={({ route }) => ({
          title: '',
          headerBackTitleVisible: false,
          headerTitle: () => (
            <View
              style={{
                flexDirection: 'row',
                width: 220,
                alignItems: 'center',
                gap: 10,
                paddingBottom: 4,
              }}>
              <Image
                source={{
                  uri: 'https://i.pravatar.cc/150?u=chat-user',
                }}
                style={{ width: 40, height: 40, borderRadius: 50 }}
              />
              <View>
                <Text style={{ fontSize: 16, fontWeight: '500' }}>Contact</Text>
                <Text style={{ fontSize: 12, color: Colors.text }}>online</Text>
              </View>
            </View>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 30 }}>
              <TouchableOpacity onPress={() => {
                const chatId = (route.params as any)?.id;
                if (chatId) {
                  SocketService.initiateCall(parseInt(chatId.replace(/\D/g, '').slice(0, 8)), 'video');
                  alert('Video Call', 'Starting encrypted video call...');
                }
              }}>
                <Ionicons name="videocam-outline" color={Colors.text} size={30} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                const chatId = (route.params as any)?.id;
                if (chatId) {
                  SocketService.initiateCall(parseInt(chatId.replace(/\D/g, '').slice(0, 8)), 'audio');
                  alert('Voice Call', 'Starting encrypted voice call...');
                }
              }}>
                  <Ionicons name="call-outline" color={Colors.text} size={30} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => alert('Chat Info', 'Chat settings coming soon.')}>
                  <Ionicons name="information-circle-outline" color={Colors.text} size={26} />
              </TouchableOpacity>
            </View>
          ),
          headerStyle: {
            backgroundColor: Colors.background,
          },
        })}
      />
    </Stack>
  );
};
export default Layout;
