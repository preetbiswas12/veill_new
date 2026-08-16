import { useEffect, useState } from 'react';
import { View, ScrollView, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Text } from 'react-native';
import ChatRow from '@/components/ChatRow';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import Fonts from '@/constants/Fonts';
import ChatService, { Conversation } from '@/utils/chat';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const Page = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadConversations = async () => {
    const convs = await ChatService.loadConversations();
    setConversations(convs);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadConversations();

    const unsubscribe = ChatService.onConversationUpdate((updatedConvs) => {
      setConversations(updatedConvs);
    });

    return unsubscribe;
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const openNewChat = () => {
    router.push('/(modals)/new-chat');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.card }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.card }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        contentContainerStyle={{ paddingBottom: 40 }}>
        {conversations.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
            <Ionicons name="chatbubbles-outline" size={64} color={Colors.lightGray} />
            <Text style={{ fontSize: 16, color: Colors.text, marginTop: 16 }}>No chats yet</Text>
            <TouchableOpacity
              style={{ marginTop: 20, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 }}
              onPress={openNewChat}>
              <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '600' }}>Start a Chat</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={conversations}
            renderItem={({ item }) => (
              <ChatRow
                id={item.id}
                from={item.peerName}
                date={item.lastMessageAt?.toISOString() || new Date().toISOString()}
                img={item.peerAvatar}
                msg={item.lastMessage || ''}
                read={true}
                unreadCount={item.unreadCount}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            ItemSeparatorComponent={() => (
              <View style={[defaultStyles.separator, { marginLeft: 90 }]} />
            )}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </View>
  );
};

export default Page;
