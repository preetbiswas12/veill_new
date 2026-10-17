import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import Avatar from '@/components/Avatar';
import Screen from '@/components/Screen';
import { useCometChat } from '@/hooks/useCometChat';

/**
 * Communities lists the groups this account belongs to. The "new group" flow
 * already lives in the modal stack, so the header button routes straight to it.
 */
const CommunitiesScreen = () => {
  const router = useRouter();
  const { groups, loadingGroups, refreshGroups } = useCometChat();

  useEffect(() => {
    void refreshGroups();
  }, [refreshGroups]);

  return (
    <Screen viewClassName="bg-white">
      {/* Large-title header, matching the chat list's 33pt bold title. */}
      <View className="px-4 pt-2 pb-3 flex-row items-center justify-between">
        <Text className="text-display font-bold text-text-strong">Communities</Text>
        <Pressable
          onPress={() => router.push('/new-group')}
          accessibilityRole="button"
          accessibilityLabel="New community"
          className="h-7 w-7 rounded-full bg-surface-cta items-center justify-center active:opacity-60"
        >
          <Ionicons name="add" size={20} color="#0a0a0a" />
        </Pressable>
      </View>

      <View className="h-hair bg-separator" />

      {loadingGroups && groups.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1dab61" />
        </View>
      ) : null}

      {!loadingGroups && groups.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2 px-10">
          <Ionicons name="people-outline" size={40} color="#767779" />
          <Text className="text-body-2 text-text-muted text-center">
            No communities yet. Tap + to start one.
          </Text>
        </View>
      ) : null}

      {groups.map((group) => (
        <Pressable
          key={group.id}
          onPress={() => router.push(`/chat/${group.id}?type=group`)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${group.name}`}
          className="flex-row items-center gap-3 pl-4 pr-4 h-row active:bg-surface-muted"
        >
          <Avatar
            name={group.name}
            imageUrl={group.image}
            size={56}
            fontSize={22}
            placeholderType="icon"
          />
          <View className="flex-1 min-w-0 justify-center">
            <Text className="text-body-1 font-semibold text-text-strong" numberOfLines={1}>
              {group.name}
            </Text>
            <Text className="text-body-2 text-text-muted" numberOfLines={1}>
              {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#767779" />
        </Pressable>
      ))}
    </Screen>
  );
};

export default CommunitiesScreen;