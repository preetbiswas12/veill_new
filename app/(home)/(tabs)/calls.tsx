import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import Avatar from '@/components/Avatar';
import Screen from '@/components/Screen';
import { CallHistoryEntry, useCometChat } from '@/hooks/useCometChat';
import { useTheme } from '@/hooks/useTheme';

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

type CallFilter = 'all' | 'missed';

const CallsScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const { callHistory, loadingCallHistory, refreshCallHistory, startCall } = useCometChat();
  const [callFilter, setCallFilter] = useState<CallFilter>('all');

  useFocusEffect(
    useCallback(() => {
      void refreshCallHistory();
    }, [refreshCallHistory])
  );

  // A call is missed when it came in and was never answered.
  const visibleCalls = useMemo(() => {
    if (callFilter === 'all') return callHistory;
    return callHistory.filter((entry) => !entry.outgoing && entry.action !== 'answered');
  }, [callHistory, callFilter]);

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
    <Screen className="bg-surface">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {/* Large title with the trailing compose control, as iOS does. */}
        <View className="px-4 pt-1 pb-2 flex-row items-center justify-between">
          <Text className="flex-1 min-w-0 text-display font-bold text-text-strong">Calls</Text>
          <Pressable
            onPress={() => router.push('/find-by-username')}
            accessibilityRole="button"
            accessibilityLabel="Start a call"
            hitSlop={8}
            className="active:opacity-70"
          >
            <Ionicons name="add" size={26} color={colors['teal']} />
          </Pressable>
        </View>

        {/* Segmented control: All / Missed. */}
        <View className="px-4 pb-3">
          <View className="flex-row p-0.5 rounded-chip bg-surface-muted">
            {(['all', 'missed'] as const).map((option) => {
              const active = callFilter === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setCallFilter(option)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className={`flex-1 h-9 items-center justify-center rounded-full ${
                    active ? 'bg-surface' : ''
                  }`}
                >
                  <Text
                    className="text-body-2 font-medium"
                    style={{ color: active ? colors['text-strong'] : colors['text-muted'] }}
                  >
                    {option === 'all' ? 'All' : 'Missed'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-4 pb-4">
          <SectionTitle>Favourites</SectionTitle>
          <Pressable
            onPress={() => router.push('/find-by-username')}
            accessibilityRole="button"
            accessibilityLabel="Add favourite"
            className="flex-row items-center gap-4 px-4 rounded-search active:opacity-70"
          >
            <View className="h-10 w-10 rounded-full bg-surface-cta items-center justify-center">
              <Ionicons name="add" size={24} color={colors['text-strong']} />
            </View>
            <Text className="text-[15.8px] text-text-strong">Add favourite</Text>
          </Pressable>
        </View>

        <View className="gap-2">
          <SectionTitle>Recent</SectionTitle>

          {visibleCalls.length === 0 && !loadingCallHistory ? (
            <View className="items-center gap-2 px-10 py-10">
              <Ionicons name="call-outline" size={36} color={colors['text-muted']} />
              <Text className="text-body-1 font-semibold text-text-strong">
                {callFilter === 'missed' ? 'No missed calls' : 'No calls yet'}
              </Text>
              <Text className="text-body-2 text-text-muted text-center">
                {callFilter === 'missed'
                  ? 'Calls you did not answer will collect here.'
                  : 'Start a call from a chat and it will show up here.'}
              </Text>
            </View>
          ) : null}

          {loadingCallHistory && callHistory.length === 0 ? (
            <View className="py-10 items-center">
              <ActivityIndicator color={colors['product']} />
            </View>
          ) : null}

          {visibleCalls.map((entry) => {
            const missed = !entry.outgoing && entry.action !== 'answered';
            const label = missed ? 'Missed' : entry.outgoing ? 'Outgoing' : 'Incoming';
            return (
              <Pressable
                key={entry.id}
                onPress={() => openCall(entry)}
                accessibilityRole="button"
                accessibilityLabel={`${label} ${entry.video ? 'video' : 'voice'} call with ${
                  entry.peerName || entry.peerId
                }. Tap to call again.`}
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
                    style={{ color: missed ? colors['text-error'] : colors['text-strong'] }}
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
                      color={colors['text-muted']}
                    />
                    <Text className="text-body-2 text-text-muted">{label}</Text>
                  </View>
                </View>

                {/* The info affordance from the design's call row. */}
                <Pressable
                  onPress={() => openCall(entry)}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${entry.peerName || entry.peerId} again`}
                  hitSlop={10}
                  className="pt-[9px] pr-4 flex-row items-center gap-2"
                >
                  <Text className="text-body-2 text-text-muted">
                    {formatWhen(entry.timestamp)}
                  </Text>
                  <Ionicons name="information-circle-outline" size={18} color={colors['text-muted']} />
                </Pressable>
              </Pressable>
            );
          })}
        </View>

        <View className="flex-row items-start justify-center gap-1 py-px px-4 mt-2">
          <Ionicons name="lock-closed" size={12} color={colors['text-muted']} />
          <Text className="text-caption text-text-muted">
            Your calls are <Text className="text-text-product">end-to-end encrypted</Text>
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
};

export default CallsScreen;