import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { SettingsRowItem } from '@/components/BadgeIcon';
import Screen from '@/components/Screen';
import { HeaderButton } from '@/components/ScreenHeader';
import { useCometChat } from '@/hooks/useCometChat';
import { useTheme } from '@/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Storage and data.
 *
 * CometChat's client SDK exposes no per-user byte accounting, so the figures here
 * are real but structural: how much is held in this app for this account, and
 * which of it is messages versus media references. Labelling them as counts
 * rather than pretending to be a server-side usage report is the honest version
 * of the design's bar chart.
 */
const StorageScreen = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { conversations, groups, messagesByConversation } = useCometChat();

  const loadedThreads = messagesByConversation.size;
  const loadedMessages = Array.from(messagesByConversation.values()).reduce(
    (sum, list) => sum + list.length,
    0
  );

  // What this account holds, as a share of the total so the bar has a scale.
  const items = [
    { label: 'Conversations', value: conversations.length, color: colors['product'] },
    { label: 'Groups', value: groups.length, color: colors['tick-read'] },
    { label: 'Threads loaded', value: loadedThreads, color: colors['link'] },
    { label: 'Messages loaded', value: loadedMessages, color: colors['text-muted'] },
  ];
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;

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
          Storage and data
        </Text>
        <View className="w-11" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-6 pb-4">
          <Text className="text-body-1 font-semibold text-text-strong">On this device</Text>
          <Text className="mt-1 text-body-2 text-text-muted">
            Counts of what this app currently holds for your account. CometChat does
            not report per-user byte usage to the client, so these are counts rather
            than a size.
          </Text>
        </View>

        {/* Bar chart, coloured by category, per the design. */}
        <View className="px-4 pb-2">
          <View className="h-3 rounded-full overflow-hidden flex-row bg-surface-muted">
            {items.map((item) =>
              item.value > 0 ? (
                <View
                  key={item.label}
                  style={{
                    flex: item.value,
                    backgroundColor: item.color,
                  }}
                />
              ) : null
            )}
          </View>
        </View>

        <View className="px-4 pb-6 gap-2">
          {items.map((item) => (
            <View key={item.label} className="flex-row items-center gap-2">
              <View
                style={{ backgroundColor: item.color }}
                className="w-3 h-3 rounded-full"
              />
              <Text className="flex-1 text-body-2 text-text-strong">{item.label}</Text>
              <Text className="text-body-2 text-text-muted">{item.value}</Text>
              <Text className="text-caption text-text-muted w-12 text-right">
                {Math.round((item.value / total) * 100)}%
              </Text>
            </View>
          ))}
        </View>

        <View className="mx-4 mb-6 overflow-hidden rounded-card">
          <SettingsRowItem
            icon="trash-outline"
            badgeColor="#d93025"
            label="Clear message cache"
            onPress={() =>
              // The store is in memory only; a remount refetches from CometChat.
              router.replace('/chats')
            }
          />
        </View>
      </ScrollView>
    </Screen>
  );
};

export default StorageScreen;
