import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { AlertButton, FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';

import AppMenu from '@/components/AppMenu';
import ConversationRow from '@/components/ConversationRow';
import Screen from '@/components/Screen';
import { HeaderButton } from '@/components/ScreenHeader';
import { useFavourites } from '@/hooks/useFavourites';
import { getMessageText, useCometChat } from '@/hooks/useCometChat';
import { useTheme } from '@/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showAlertDialog } from '@/components/AlertDialog';

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
/**
 * Filter chip from the design: `px-3 h-8 rounded-full`, 15/20 medium, selected
 * on the green tint.
 *
 * An earlier version had an icon-only variant driven by an `icon` prop, which
 * rendered disabled and did nothing anywhere it was used. There is no chip list
 * feature behind it, so the variant is gone rather than left as a dead control.
 */
const FilterChip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress?: () => void;
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
    className={[
      'shrink-0 h-8 px-3 rounded-full items-center justify-center',
      active ? 'bg-surface-active' : 'bg-surface-muted',
    ].join(' ')}
  >
    <Text
      className={[
        'text-body-2 font-medium',
        active ? 'text-text-strong' : 'text-text-muted',
      ].join(' ')}
    >
      {label}
    </Text>
  </Pressable>
);

const ChatsScreen = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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
      showAlertDialog(item.name || item.id, undefined, actions, { cancelable: true });
    },
    [markConversationRead, markConversationUnread, router]
  );

  const titleBlock = (
    <>
      {/* The design's large title carries the action controls on its own row:
          "Edit" on the leading edge, camera and compose on the trailing one.
          The Screen excludes the top edge, so this block owns the status-bar
          inset; without it the 34pt title collides with the notch. */}
      <View
        style={{
          borderBottomWidth: 0,
          backgroundColor: colors['panel-blur'],
          paddingTop: insets.top + 4,
        }}
        className="px-4 pb-1"
      >
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 min-w-0 text-display font-bold text-text-strong">Chats</Text>
          <View className="flex-row items-center gap-3">
            <HeaderButton
              icon="camera-outline"
              label="Camera"
              onPress={() => router.push('/camera?handoff=pick')}
            />
            <HeaderButton icon="add" solid label="New" onPress={() => router.push('/new')} />
          </View>
        </View>
      </View>

      <View className="gap-2 px-4 pt-1 pb-2">
        <View className="pt-px">
          <View className="flex-row items-center gap-2.5 pb-2">
            <View className="flex-1 flex-row items-center gap-2.5 p-[5px] rounded-search bg-surface-muted">
              <Ionicons name="search" size={24} color={colors['text-muted']} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Ask Meta AI or Search"
                placeholderTextColor={colors['text-muted']}
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
                  <Ionicons name="close-circle" size={20} color={colors['text-muted']} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        {/* The five chips are ~326pt wide, which overflows a 320pt screen once the
            16pt gutters are taken, so the row scrolls the way the design's does. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}
          keyboardShouldPersistTaps="handled"
        >
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
        </ScrollView>
      </View>

      {/* Archived row: 24pt glyph in a 32pt box, 16/19 semibold label, the
          design's pl-8 / pb-3 / pt-2.5 insets and its bottom hairline. */}
      <Pressable
        onPress={() =>
          showAlertDialog(
            'Archived',
            'CometChat has no archive API, so archived chats cannot be listed here yet.'
          )
        }
        accessibilityRole="button"
        accessibilityLabel="Archived"
        className="flex-row items-center gap-3 pl-8 pr-4 py-2.5 border-b-hair border-separator active:bg-surface-muted"
      >
        <View className="w-8 h-6 items-center justify-center">
          <Ionicons name="archive-outline" size={24} color={colors['text-strong']} />
        </View>
        <Text className="text-body-1 font-semibold text-text-strong" numberOfLines={1}>
          Archived
        </Text>
      </Pressable>
    </>
  );

  if (loadingConversations && conversationItems.length === 0) {
    return (
      <Screen className="bg-surface" edges={['left', 'right', 'bottom']}>
        {titleBlock}
        <View className="flex-1 items-center justify-center">
          <Text className="text-body-2 text-text-muted">Loading chats…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen className="bg-surface" edges={['left', 'right', 'bottom']}>
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
            <Ionicons name="chatbubbles-outline" size={36} color={colors['text-muted']} />
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
            <Ionicons name="lock-closed" size={12} color={colors['text-muted']} />
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