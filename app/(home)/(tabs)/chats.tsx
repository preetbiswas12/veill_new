import Feather from '@expo/vector-icons/Feather';
import { Link, useRouter } from 'expo-router';
import { View, Text } from 'react-native';
import { useMemo } from 'react';

import AppMenu from '@/components/AppMenu';
import Button from '@/components/Button';
import PreviewAvatar from '@/components/PreviewAvatar';
import Screen from '@/components/Screen';
import ScreenLoading from '@/components/ScreenLoading';
import { useCometChat, getMessageText } from '@/hooks/useCometChat';

interface ConversationItem {
  id: string;
  name?: string;
  image?: string;
  latestMessage?: string;
  timestamp?: number;
  unreadCount: number;
}

const ChatsScreen = () => {
  const { conversations, loadingConversations, markConversationRead } = useCometChat();
  const router = useRouter();
  const conversationItems = useMemo<ConversationItem[]>(() => {
    return conversations.map((conv) => ({
      id: conv.id,
      name: conv.name,
      image: conv.image,
      latestMessage: conv.latestMessage ? getMessageText(conv.latestMessage) : undefined,
      timestamp: conv.latestMessage?.serverTime,
      unreadCount: conv.unreadCount,
    }));
  }, [conversations]);

  const goToChat = async (conversationId: string) => {
    await markConversationRead(conversationId);
    router.navigate({
      pathname: '/chat/[id]',
      params: { id: conversationId },
    });
  };

  const renderConversation = (item: ConversationItem) => (
    <Button
      variant="plain"
      onPress={() => goToChat(item.id)}
      className="bg-white flex-row items-center gap-2 py-3 px-4 rounded-xl border-b border-gray-100"
    >
      <PreviewAvatar
        channel={{ id: item.id } as any}
        size={44}
        fontSize={20}
      />
      <View className="flex-1 min-w-0">
        <Text className="text-base font-medium">{item.name || item.id}</Text>
        {item.latestMessage && (
          <Text className="text-sm text-gray-500 truncate">{item.latestMessage}</Text>
        )}
      </View>
      {item.unreadCount > 0 && (
        <View className="bg-primary rounded-full px-2 py-0.5">
          <Text className="text-xs text-white">{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
        </View>
      )}
    </Button>
  );

  if (loadingConversations) {
    return (
      <Screen className="bg-white" viewClassName="px-4">
        <View className="flex flex-row items-center justify-between w-full h-10">
          <AppMenu />
          <View className="flex flex-row items-center gap-4">
            <Button variant="plain">
              <Feather name="camera" size={20} />
            </Button>
            <Link href="/new-message" asChild>
              <Button variant="plain" className="pl-4 py-1">
                <Feather name="edit" size={18} />
              </Button>
            </Link>
          </View>
        </View>
        <ScreenLoading />
      </Screen>
    );
  }

  return (
    <Screen className="bg-white" viewClassName="px-4">
      <View className="flex flex-row items-center justify-between w-full h-10">
        <AppMenu />
        <View className="flex flex-row items-center gap-4">
          <Button variant="plain">
            <Feather name="camera" size={20} />
          </Button>
          <Link href="/new-message" asChild>
            <Button variant="plain" className="pl-4 py-1">
              <Feather name="edit" size={18} />
            </Button>
          </Link>
        </View>
      </View>
      <View className="flex-1">
        {conversationItems.length === 0 ? (
          <View className="flex items-center justify-center py-12">
            <Text className="text-gray-500">No conversations yet</Text>
          </View>
        ) : (
          <View className="flex flex-col gap-1">
            {conversationItems.map((item) => renderConversation(item))}
          </View>
        )}
      </View>
    </Screen>
  );
};

export default ChatsScreen;
