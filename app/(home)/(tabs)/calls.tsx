import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import Avatar from '@/components/Avatar';
import Screen from '@/components/Screen';
import { CallHistoryEntry, useCometChat } from '@/hooks/useCometChat';

/**
 * Calls, built from the Figma frame "Calls" (156:4133): a 33.33pt bold large
 * title, then a Favourites section and a Recent section, each headed by an
 * 18.33pt semibold label. Recent rows are 56.66pt with a 40pt avatar and the
 * call direction under the name; missed calls render the name in red.
 */

const formatWhen = (timestamp: number): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (timestamp >= startOfToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (timestamp >= startOfToday - 6 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit' });
};

/** 18.33pt semibold section label. */
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <View className="h-[25px] px-4 justify-center">
    <Text className="text-[18.33px] font-semibold text-text-strong">{children}</Text>
  </View>
);

const CallsScreen = () => {
  const router = useRouter();
  const { callHistory, loadingCallHistory, refreshCallHistory, startCall } = useCometChat();

  useFocusEffect(
    useCallback(() => {
      void refreshCallHistory();
    }, [refreshCallHistory])
  );

  const openCall = (entry: CallHistoryEntry) => {
    router.push({
      pathname: '/call/[id]',
      params: {
        id: entry.peerId,
        name: entry.peerName || '',
        image: entry.peerImage || '',
        video: entry.video ? '1' : '0',
        direction: 'outgoing',
      },
    });
  };

  return (
    <Screen className="bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        {/* Title block: 33.33pt bold, matching the chat list. */}
        <View className="pt-[5px] pb-2 px-4">
          <Text className="text-display font-bold text-text-strong">Calls</Text>
        </View>

        <View className="gap-4 pb-4">
          <SectionTitle>Favourites</SectionTitle>
          <Pressable
            onPress={() => router.push('/find-by-username')}
            accessibilityRole="button"
            accessibilityLabel="Add favourite"
            className="flex-row items-center gap-4 px-4 rounded-[10px] active:opacity-70"
          >
            <View className="h-10 w-10 rounded-full bg-surface-cta items-center justify-center">
              <Ionicons name="add" size={24} color="#0a0a0a" />
            </View>
            <Text className="text-[15.8px] text-text-strong">Add favourite</Text>
          </Pressable>
        </View>

        <View className="gap-2">
          <SectionTitle>Recent</SectionTitle>

          {loadingCallHistory && callHistory.length === 0 ? (
            <View className="py-10 items-center">
              <ActivityIndicator color="#1dab61" />
            </View>
          ) : null}

          {!loadingCallHistory && callHistory.length === 0 ? (
            <View className="items-center gap-2 px-10 py-10">
              <Ionicons name="call-outline" size={36} color="#767779" />
              <Text className="text-body-1 font-semibold text-text-strong">No calls yet</Text>
              <Text className="text-body-2 text-text-muted text-center">
                Start a call from a chat and it will show up here.
              </Text>
            </View>
          ) : null}

          {callHistory.map((entry) => {
            const missed = !entry.outgoing && entry.action !== 'answered';
            const label = missed ? 'Missed' : entry.outgoing ? 'Outgoing' : 'Incoming';
            return (
              <Pressable
                key={entry.id}
                onPress={() => void startCall(entry.peerId, entry.video)}
                accessibilityRole="button"
                accessibilityLabel={`${label} ${entry.video ? 'video' : 'voice'} call with ${
                  entry.peerName || entry.peerId
                }`}
                className="flex-row items-start gap-[16.66px] pl-4 h-[56.66px] active:bg-surface-muted"
              >
                <View className="pt-[9.66px]">
                  <Avatar
                    name={entry.peerName || entry.peerId}
                    imageUrl={entry.peerImage}
                    size={40}
                    fontSize={17}
                  />
                </View>

                <View className="flex-1 min-w-0 pr-4 pt-[10px] gap-[1.5px]">
                  <Text
                    className="text-body-1"
                    style={{ color: missed ? '#ea0038' : '#0a0a0a' }}
                    numberOfLines={1}
                  >
                    {entry.peerName || entry.peerId}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Ionicons
                      name={
                        entry.video
                          ? missed
                            ? 'videocam-outline'
                            : entry.outgoing
                              ? 'arrow-up'
                              : 'arrow-down'
                          : missed
                            ? 'call-outline'
                            : entry.outgoing
                              ? 'arrow-up'
                              : 'arrow-down'
                      }
                      size={16}
                      color="#767779"
                    />
                    <Text className="text-body-2 text-text-muted">{label}</Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => openCall(entry)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open call with ${entry.peerName || entry.peerId}`}
                  hitSlop={10}
                  className="pt-[13px]"
                >
                  <Text className="text-body-2 text-text-muted">
                    {formatWhen(entry.timestamp)}
                  </Text>
                </Pressable>
              </Pressable>
            );
          })}
        </View>

        <View className="flex-row items-start justify-center gap-1 py-px px-4 mt-2">
          <Ionicons name="lock-closed" size={12} color="#767779" />
          <Text className="text-caption text-text-muted">
            Your calls are <Text className="text-text-product">end-to-end encrypted</Text>
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
};

export default CallsScreen;