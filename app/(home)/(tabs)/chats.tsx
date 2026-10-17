import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  AlertButton,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppMenu from '@/components/AppMenu';
import ConversationRow from '@/components/ConversationRow';
import Screen from '@/components/Screen';
import { HeaderButton, ScreenHeader } from '@/components/ScreenHeader';
import { useFavourites } from '@/hooks/useFavourites';
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

type FilterKey = 'all' | 'unread' | 'favourites' | 'groups';

/** The design's 34pt filter pill: 19pt radius, 14pt horizontal padding. */
const FilterChip = ({
  label,
  active,
  icon,
  onPress,
}: {
  label?: string;
  active?: boolean;
  icon?: boolean;
  onPress?: () => void;
}) => (
  <Pressable
    onPress={onPress}
    disabled={icon}
    accessibilityRole="button"
    accessibilityState={{ selected: !!active }}
    className={[
      'flex-row items-center justify-center shrink-0 rounded-chip',
      icon ? 'size-[34px]' : 'h-[34px] px-[14px]',
      active ? 'bg-surface-active' : 'bg-surface-muted',
    ].join(' ')}
  >
    {icon ? (
      <Ionicons name="add" size={24} color="#0a0a0a" />
    ) : (
      <Text
        className="text-body-2 font-semibold"
        style={{ color: active ? '#15603e' : '#767779' }}
      >
        {label}
      </Text>
    )}
  </Pressable>
);

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
  const { ids: favouriteIds } = useFavourites();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');

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

  // Chip filter and the search field compose: Unread + "mum" shows unread Mum chats.
  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return conversationItems.filter((item) => {
      if (filter === 'unread' && item.unreadCount === 0) return false;
      if (filter === 'favourites' && !favouriteIds.includes(item.id)) return false;
      if (filter === 'groups' && item.type !== 'group') return false;
      if (!needle) return true;
      return (
        (item.name ?? '').toLowerCase().includes(needle) ||
        (item.preview ?? '').toLowerCase().includes(needle)
      );
    });
  }, [conversationItems, filter, query, favouriteIds]);

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
        {
          text: 'Contact info',
          onPress: () =>
            router.push({
              pathname: '/contact-info',
              params: {
                id: item.id,
                name: item.name || '',
                image: item.image || '',
                type: item.type,
              },
            }),
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

  const startSomethingNew = useCallback(() => {
    const actions: AlertButton[] = [
      { text: 'New chat', onPress: () => router.push('/new-message') },
      { text: 'New group', onPress: () => router.push('/new-group') },
      { text: 'Cancel', style: 'cancel' },
    ];
    Alert.alert('New', undefined, actions, { cancelable: true });
  }, [router]);

  const titleBlock = (
    <>
      {/* Header from the Figma `Header` component: 28pt circular controls, the
          trailing one solid brand green. */}
      <ScreenHeader
        left={<AppMenu />}
        right={
          <View className="flex-row items-center gap-4">
            <HeaderButton
              icon="camera-outline"
              label="New chat"
              onPress={() => router.push('/new-message')}
            />
            <HeaderButton icon="add" solid label="New" onPress={startSomethingNew} />
          </View>
        }
      />

      <View className="gap-2 px-4 pt-[5px] pb-2">
        <Text className="text-display font-bold text-text-strong">Chats</Text>

        <View className="pt-px">
          <View className="flex-row items-center gap-2.5 pb-2">
            <View className="flex-1 flex-row items-center gap-2.5 p-[5px] rounded-search bg-surface-muted">
              <Ionicons name="search" size={24} color="#767779" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Ask Meta AI or Search"
                placeholderTextColor="#767779"
                accessibilityLabel="Search chats"
                className="flex-1 text-[16.4px] text-text-strong"
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              {query.length > 0 ? (
                <Pressable
                  onPress={() => setQuery('')}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={20} color="#767779" />
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        <View className="flex-row gap-2">
          <FilterChip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterChip
            label="Unread"
            active={filter === 'unread'}
            onPress={() => setFilter('unread')}
          />
          <FilterChip
            label="Favourites"
            active={filter === 'favourites'}
            onPress={() => setFilter('favourites')}
          />
          <FilterChip
            label="Groups"
            active={filter === 'groups'}
            onPress={() => setFilter('groups')}
          />
          <FilterChip icon />
        </View>
      </View>

      {/* Archived row from the design's chat list. */}
      <Pressable
        onPress={() =>
          Alert.alert(
            'Archived',
            'CometChat does not archive conversations from the client SDK, so this list is not available yet.'
          )
        }
        accessibilityRole="button"
        accessibilityLabel="Archived"
        className="flex-row items-start pl-8 pr-4 pt-2.5 pb-3 border-b-hair border-separator active:bg-surface-muted"
      >
        <Ionicons name="archive-outline" size={24} color="#0a0a0a" />
        <Text className="flex-1 text-body-1 font-semibold text-text-strong">Archived</Text>
      </Pressable>
    </>
  );

  if (loadingConversations && conversationItems.length === 0) {
    return (
      <Screen className="bg-white" edges={['left', 'right', 'bottom']}>
        {titleBlock}
        <View className="flex-1 items-center justify-center">
          <Text className="text-body-2 text-text-muted">Loading chats…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen className="bg-white" edges={['left', 'right', 'bottom']}>
      {titleBlock}
      <FlatList
        data={visibleItems}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-16 px-10">
            <Ionicons name="chatbubbles-outline" size={36} color="#767779" />
            <Text className="text-body-1 font-semibold text-text-strong mt-3">
              {query ? 'No matches' : 'No conversations yet'}
            </Text>
            <Text className="text-body-2 text-text-muted text-center mt-1">
              {query
                ? 'Try a different search.'
                : 'Tap the green button to start a chat.'}
            </Text>
          </View>
        }
        // The design pins the encryption note under the list.
        ListFooterComponent={
          <View className="flex-row items-start justify-center gap-1 py-px px-4">
            <Ionicons name="lock-closed" size={12} color="#767779" />
            <Text className="text-caption text-text-muted">
              Your personal messages are{' '}
              <Text className="text-text-product">end-to-end encrypted</Text>
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 8 }}
      />
    </Screen>
  );
};

export default ChatsScreen;