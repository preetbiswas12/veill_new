import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import Avatar from '@/components/Avatar';
import Screen from '@/components/Screen';
import { useCometChat } from '@/hooks/useCometChat';
import { useTheme } from '@/hooks/useTheme';

/**
 * Communities, rebuilt from the Figma frame "Communities" (188:3102): a 33.33pt
 * bold title, then either the empty state the design specifies - heading at 20pt,
 * body at 16pt, a product-coloured "See example communities" link with a 12pt
 * chevron, and the solid green "New Community" button at a 14pt radius - or the
 * groups the account actually belongs to once there are any.
 */
const CommunitiesScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const { groups, loadingGroups, refreshGroups } = useCometChat();

  useEffect(() => {
    void refreshGroups();
  }, [refreshGroups]);

  return (
    <Screen viewClassName="bg-white" edges={['left', 'right', 'bottom']}>
      <View className="px-4 pt-2 pb-3 flex-row items-center justify-between">
        <Text className="text-display font-bold text-text-strong">Communities</Text>
        <Pressable
          onPress={() => router.push('/new-group')}
          accessibilityRole="button"
          accessibilityLabel="New community"
          className="h-7 w-7 rounded-full bg-surface-cta items-center justify-center active:opacity-60"
        >
          <Ionicons name="add" size={20} color={colors['text-strong']} />
        </Pressable>
      </View>

      {loadingGroups && groups.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors['product']} />
        </View>
      ) : null}

      {!loadingGroups && groups.length === 0 ? (
        <>
          {/* The design's illustration sits above the copy; approximated with a
              brand-coloured glyph so the layout keeps its 162x151 footprint. */}
          <View className="items-center pt-[22px]">
            <View className="h-[151px] w-[162px] items-center justify-center">
              <Ionicons name="people" size={120} color={colors['surface-active']} />
            </View>
          </View>

          <View className="gap-2.5 px-4 mt-4 items-center justify-center">
            <Text className="text-[20px] text-text-strong text-center">
              Stay connected with a community
            </Text>
            <Text className="text-[16px] leading-[21px] text-text-muted text-center">
              Communities bring members together in topic-based groups. Any community you’re
              added to will appear here.
            </Text>

            <Pressable
              onPress={() => router.push('/new-group')}
              accessibilityRole="button"
              accessibilityLabel="See example communities"
              className="flex-row items-center gap-0.5 active:opacity-70"
            >
              <Text className="text-body-2 text-text-product">See example communities</Text>
              <Ionicons name="chevron-forward" size={12} color={colors['product']} />
            </Pressable>

            <View className="w-full pt-[30px] px-2">
              <Pressable
                onPress={() => router.push('/new-group')}
                accessibilityRole="button"
                accessibilityLabel="New Community"
                className="flex-row items-center justify-center gap-1.5 px-6 py-2.5 rounded-[14px] bg-primary active:opacity-80"
              >
                <Ionicons name="add" size={24} color={colors['text-invert']} />
                <Text className="text-body-1 text-white">New Community</Text>
              </Pressable>
            </View>
          </View>
        </>
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
          <Ionicons name="chevron-forward" size={18} color={colors['text-muted']} />
        </Pressable>
      ))}
    </Screen>
  );
};

export default CommunitiesScreen;