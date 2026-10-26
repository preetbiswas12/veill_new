import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import Screen from '@/components/Screen';
import { HeaderButton } from '@/components/ScreenHeader';
import { useStarredMessages } from '@/hooks/useStarredMessages';
import { useTheme } from '@/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Starred messages.
 *
 * The store is local (see hooks/useStarredMessages.ts) because CometChat 4.1.0
 * exposes no star action on the client SDK. Entries carry their body so this
 * renders without refetching conversations, which also means a starred message
 * survives its conversation being cleared.
 */
const StarredScreen = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { entries, ready, remove } = useStarredMessages();

  const formatWhen = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    return sameDay
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <View
        style={{
          paddingTop: insets.top,
          borderBottomWidth: 0.5,
          borderBottomColor: colors['separator'],
          backgroundColor: colors['panel-blur'],
        }}
        className="flex-row items-center px-2"
      >
        <HeaderButton onPress={() => router.back()} label="Back" icon="chevron-back" size={44} />
        <Text className="flex-1 text-body-1 font-semibold text-text-strong text-center">
          Starred
        </Text>
        <View className="w-11" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {!ready ? (
          <View className="items-center py-10">
            <Text className="text-body-2 text-text-muted">Loading\u2026</Text>
          </View>
        ) : entries.length === 0 ? (
          <View className="items-center gap-2 py-20 px-10">
            <Text className="text-body-1 font-semibold text-text-strong">
              No starred messages
            </Text>
            <Text className="text-body-2 text-text-muted text-center">
              Long-press a message and choose Star message to keep it here.
            </Text>
          </View>
        ) : (
          <View className="py-2">
            {entries.map((entry, index) => (
              <View
                key={entry.id}
                className={`mx-4 py-3 ${
                  index === entries.length - 1 ? '' : 'border-b-hair border-separator'
                }`}
              >
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="flex-1 min-w-0 text-body-3 font-semibold text-text-strong" numberOfLines={1}>
                    {entry.senderName}
                  </Text>
                  <Text className="text-caption text-text-muted">{formatWhen(entry.timestamp)}</Text>
                </View>
                <Text className="mt-1 text-body-1 text-text-strong">{entry.body}</Text>
                <View className="mt-2 flex-row justify-end">
                  <Text
                    onPress={() => void remove(entry.id)}
                    accessibilityRole="button"
                    className="text-body-2 text-link active:opacity-70"
                  >
                    Remove
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};

export default StarredScreen;
