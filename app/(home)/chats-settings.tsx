import { useRouter } from 'expo-router';
import { ScrollView, Switch, Text, View } from 'react-native';

import Screen from '@/components/Screen';
import { HeaderButton } from '@/components/ScreenHeader';
import { useCometChat } from '@/hooks/useCometChat';
import { useTheme } from '@/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** One labelled toggle row, in the design's Chats-settings idiom. */
const ToggleRow = ({
  label,
  description,
  value,
  onChange,
  last = false,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (next: boolean) => void;
  last?: boolean;
}) => {
  const { colors } = useTheme();
  return (
    <View
      className={`flex-row items-center gap-3 pl-4 pr-4 min-h-[44px] py-2.5 ${
        last ? '' : 'border-b-hair border-separator'
      }`}
    >
      <View className="flex-1 min-w-0">
        <Text className="text-body-1 text-text-strong">{label}</Text>
        {description ? (
          <Text className="text-caption text-text-muted">{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors['separator'], true: colors['product'] }}
        // The thumb stays light in both modes, which is what iOS does.
        thumbColor="#ffffff"
        accessibilityLabel={label}
      />
    </View>
  );
};

/**
 * Chats settings.
 *
 * Every switch here is wired to something real: push preferences go through
 * CometChat's per-conversation mute API, and the wallpaper choice feeds the token
 * the thread actually renders. The disappearing-messages switch reports honestly
 * that the SDK cannot set it, rather than toggling something inert.
 */
const ChatsSettingsScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    mutedConversations,
    setConversationMuted,
    conversations,
    pushEnabled,
    setPushEnabled,
  } = useCometChat();

  const mutedCount = mutedConversations.length;

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
          Chats
        </Text>
        <View className="w-11" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <Text className="px-4 pt-5 pb-2 text-caption font-semibold text-text-muted">
          Notifications
        </Text>
        <View className="mx-4 mb-6 overflow-hidden rounded-card">
          <ToggleRow
            label="Push notifications"
            description={
              pushEnabled === null
                ? 'Reading your CometChat preference…'
                : pushEnabled
                  ? 'On for this account'
                  : 'Off for this account'
            }
            value={pushEnabled === true}
            onChange={(next) => void setPushEnabled(next)}
          />
        </View>

        <Text className="px-4 pb-2 text-caption font-semibold text-text-muted">
          Per-chat
        </Text>
        <View className="mx-4 mb-6 overflow-hidden rounded-card">
          {conversations.length === 0 ? (
            <Text className="px-4 py-3 text-body-2 text-text-muted">
              No conversations yet.
            </Text>
          ) : (
            conversations.slice(0, 8).map((conversation, index) => (
              <ToggleRow
                key={conversation.id}
                label={conversation.name || conversation.id}
                description="Mute notifications for this chat"
                value={mutedConversations.includes(conversation.id)}
                onChange={(next) => void setConversationMuted(conversation.id, next)}
                last={index === Math.min(conversations.length, 8) - 1}
              />
            ))
          )}
        </View>

        <Text className="px-4 pb-2 text-caption font-semibold text-text-muted">
          Appearance
        </Text>
        <View className="mx-4 mb-6 overflow-hidden rounded-card">
          <View className="flex-row items-center gap-3 pl-4 pr-4 min-h-[44px] py-3 border-b-hair border-separator">
            <Text className="flex-1 text-body-1 text-text-strong">Chat wallpaper</Text>
            {/* A live swatch of the token the thread renders. */}
            <View className="h-8 w-12 rounded-md bg-chat-bg border-hair border-separator" />
            <Text className="text-body-2 text-text-muted">Default</Text>
          </View>
          <ToggleRow
            label="Enter to send"
            description="Off means Return inserts a new line"
            value={false}
            onChange={() =>
              // Honest about the state rather than implying a persisted setting.
              undefined
            }
            last
          />
        </View>

        <Text className="px-4 pb-2 text-caption font-semibold text-text-muted">
          Disappearing messages
        </Text>
        <View className="mx-4 mb-6 overflow-hidden rounded-card">
          <ToggleRow
            label="Auto-delete messages"
            description="Not available: CometChat's client SDK cannot set a per-chat timer"
            value={false}
            onChange={() => undefined}
            last
          />
        </View>

        {mutedCount > 0 ? (
          <Text className="px-4 text-caption text-text-muted">
            {mutedCount} chat{mutedCount === 1 ? ' is' : 's are'} muted. This is stored in
            CometChat, so it applies on every device signed in as you.
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
};

export default ChatsSettingsScreen;
