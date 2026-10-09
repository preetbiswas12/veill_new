import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { Link, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, AlertButton, FlatList, RefreshControl, Text, View } from 'react-native';

import AppMenu from '@/components/AppMenu';
import Button from '@/components/Button';
import ConversationRow from '@/components/ConversationRow';
import Screen from '@/components/Screen';
import { getMessageText, useCometChat } from '@/hooks/useCometChat';

interface ConversationItem {
  id: string;
  type: string;
  name?: string;
  image?: string;
  preview?: string;
  timestamp?: number;
  unreadCount: number;
  isOwnLatest: boolean;
  latestStatus?: string;
}

const ChatsScreen = () => {
  const {
    conversations,
    loadingConversations,
    refreshConversations,
    markConversationRead,
    markConversationUnread,
    typingByConversation,
    user,
  } = useCometChat();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const conversationItems = useMemo<ConversationItem[]>(
    () =>
      conversations.map((conversation) => {
        const latest = conversation.latestMessage;
        const senderId = latest?.getSender?.()?.getUid?.() || '';
        return {
          id: conversation.id,
          type: conversation.type,
          name: conversation.name,
          image: conversation.image,
          preview: latest ? getMessageText(latest) : undefined,
          timestamp: conversation.timestamp,
          unreadCount: conversation.unreadCount,
          isOwnLatest: Boolean(senderId) && senderId === user?.id,
          latestStatus:
            typeof latest?.getStatus === 'function' ? latest.getStatus() : undefined,
        };
      }),
    [conversations, user?.id]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshConversations();
    } finally {
      setRefreshing(false);
    }
  }, [refreshConversations]);

  const goToChat = useCallback(
    (item: ConversationItem) => {
      void markConversationRead(item.id, item.type);
      router.navigate({
        pathname: '/chat/[id]',
        params: {
          id: item.id,
          name: item.name || '',
          image: item.image || '',
          type: item.type,
        },
      });
    },
    [markConversationRead, router]
  );

  const openActions = useCallback(
    (item: ConversationItem) => {
      void Haptics.selectionAsync();
      const unread = item.unreadCount > 0;

      const actions: AlertButton[] = [
        {
          text: unread ? 'Mark as read' : 'Mark as unread',
          onPress: () => {
            if (unread) void markConversationRead(item.id, item.type);
            else void markConversationUnread(item.id, item.type);
          },
        },
      ];

      // Calling is 1:1 only — a group has no single peer to ring.
      if (item.type === 'user') {
        actions.push({
          text: 'Call',
          onPress: () =>
            router.push({
              pathname: '/call/[id]',
              params: {
                id: item.id,
                name: item.name || '',
                image: item.image || '',
                video: '0',
                direction: 'outgoing',
              },
            }),
        });
      }

      actions.push({ text: 'Cancel', style: 'cancel' });
      Alert.alert(item.name || item.id, undefined, actions, { cancelable: true });
    },
    [markConversationRead, markConversationUnread, router]
  );

  const header = (
    <View className="flex flex-row items-center justify-between w-full h-10">
      <AppMenu />
      <View className="flex flex-row items-center gap-4">
        <Link href="/new-message" asChild>
          <Button variant="plain" className="pl-4 py-1" accessibilityLabel="New message">
            <Feather name="edit" size={20} color="black" />
          </Button>
        </Link>
      </View>
    </View>
  );

  if (loadingConversations && conversationItems.length === 0) {
    return (
      <Screen className="bg-white" viewClassName="px-4">
        {header}
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400">Loading chats…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen className="bg-white" viewClassName="px-0">
      <View className="px-4">{header}</View>
      <FlatList
        data={conversationItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationRow
            name={item.name}
            image={item.image}
            timestamp={item.timestamp}
            preview={item.preview}
            unreadCount={item.unreadCount}
            typing={(typingByConversation.get(item.id) || []).length > 0}
            isOwnLatest={item.isOwnLatest}
            latestStatus={item.latestStatus}
            isGroup={item.type === 'group'}
            onPress={() => goToChat(item)}
            onLongPress={() => openActions(item)}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-px bg-gray-100 ml-[78px]" />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-16 px-8">
            <Feather name="message-square" size={32} color="#d1d5db" />
            <Text className="font-semibold mt-3">No conversations yet</Text>
            <Text className="text-sm text-gray-500 text-center mt-1">
              Start a chat and your messages will show up here.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </Screen>
  );
};

export default ChatsScreen;
