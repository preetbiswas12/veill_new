import { Feather } from '@expo/vector-icons';
import clsx from 'clsx';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import AppMenu from '@/components/AppMenu';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import Screen from '@/components/Screen';
import { CallHistoryEntry, getCallStatusText, useCometChat } from '@/hooks/useCometChat';

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
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const CallsScreen = () => {
  const router = useRouter();
  const { callHistory, loadingCallHistory, refreshCallHistory } = useCometChat();

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
        name: entry.peerName || entry.peerId,
        image: entry.peerImage || '',
        video: entry.video ? '1' : '0',
        direction: 'outgoing',
      },
    });
  };

  const describe = (entry: CallHistoryEntry) => {
    const status =
      getCallStatusText(entry.action) || (entry.outgoing ? 'Outgoing' : 'Incoming');
    return `${status} · ${formatWhen(entry.timestamp)}`;
  };

  const missed = (entry: CallHistoryEntry) =>
    !entry.outgoing && ['unanswered', 'initiated', 'busy'].includes(entry.action);

  const showEmpty = !loadingCallHistory && callHistory.length === 0;

  return (
    <Screen className="bg-white" viewClassName="px-4 items-start">
      <View className="flex flex-row items-center justify-between w-full h-10">
        <AppMenu />
        <View className="flex flex-row items-center gap-8">
          <Button variant="plain">
            <Feather name="phone" size={20} color="black" />
          </Button>
        </View>
      </View>
      <Button
        variant="plain"
        className="flex flex-row items-center justify-center gap-4 mt-4"
        onPress={() => router.push('/new-message')}
      >
        <Feather name="phone-call" size={20} color="black" />
        <Text className="font-semibold">Start a call</Text>
      </Button>

      {loadingCallHistory && callHistory.length === 0 ? (
        <View className="flex-1 w-full items-center justify-center">
          <ActivityIndicator color="#1dab61" />
        </View>
      ) : showEmpty ? (
        <View className="flex-1 w-full flex-col items-center justify-center mt-8">
          <Text className="font-semibold">No recent calls</Text>
          <Text className="text-sm text-gray-600">
            Get started by calling a friend
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 w-full mt-2" showsVerticalScrollIndicator={false}>
          {callHistory.map((entry) => {
            const isMissed = missed(entry);
            return (
              <Button
                key={entry.id}
                variant="plain"
                className="flex-row items-center gap-3 w-full py-2"
                onPress={() => openCall(entry)}
                accessibilityLabel={`Call ${entry.peerName || entry.peerId}`}
              >
                <Avatar
                  name={entry.peerName || entry.peerId}
                  imageUrl={entry.peerImage}
                  size={44}
                  fontSize={18}
                  placeholderType="text"
                />
                <View className="flex-1 min-w-0">
                  <Text className="font-semibold text-[15px]" numberOfLines={1}>
                    {entry.peerName || entry.peerId}
                  </Text>
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <Feather
                      name={entry.outgoing ? 'arrow-up-right' : 'arrow-down-left'}
                      size={13}
                      color={isMissed ? '#ef4444' : '#9ca3af'}
                    />
                    <Text
                      className={clsx('text-xs', isMissed ? 'text-red-500' : 'text-text-muted')}
                      numberOfLines={1}
                    >
                      {describe(entry)}
                    </Text>
                  </View>
                </View>
                <Feather
                  name={entry.video ? 'video' : 'phone'}
                  size={18}
                  color="#1dab61"
                />
              </Button>
            );
          })}
          <View className="h-4" />
        </ScrollView>
      )}
    </Screen>
  );
};

export default CallsScreen;
