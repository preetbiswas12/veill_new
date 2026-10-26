import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import Screen from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useCometChat } from '@/hooks/useCometChat';
import { isPushAvailable } from '@/lib/push';
import { useTheme } from '@/hooks/useTheme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Notifications, backed by the SDK's push-preference APIs rather than a
 * placeholder: `fetchPushPreferences` / `updatePushPreferences` for the account
 * toggle, and `getMutedConversations` / `muteConversations` for the per-chat
 * list below.
 *
 * Push itself still needs the FCM extension, so the screen says so plainly
 * rather than pretending a toggle changed anything.
 */
const ToggleRow = ({
  icon,
  label,
  subtitle,
  value,
  onChange,
  last = false,
}: {
  icon: IconName;
  label: string;
  subtitle?: string;
  value: boolean;
  onChange: (next: boolean) => void;
  last?: boolean;
}) => {
  // Reads the palette itself rather than borrowing the screen's `colors`.
  const { colors } = useTheme();
  return (
  <View
    className={`flex-row items-center gap-3 pl-4 pr-4 min-h-[40px] py-2.5 ${
      last ? '' : 'border-b-hair border-separator'
    }`}
  >
    <Ionicons name={icon} size={24} color={colors['text-strong']} />
    <View className="flex-1 min-w-0">
      <Text className="text-body-1 text-text-strong" numberOfLines={1}>
        {label}
      </Text>
      {subtitle ? (
        <Text className="text-caption text-text-muted" numberOfLines={2}>
          {subtitle}
        </Text>
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

const NotificationsScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const {
    pushEnabled,
    setPushEnabled,
    refreshPushPreferences,
    mutedConversations,
    setConversationMuted,
    conversations,
  } = useCometChat();

  const pushReady = isPushAvailable();

  useEffect(() => {
    void refreshPushPreferences();
  }, [refreshPushPreferences]);

  return (
    <Screen viewClassName="bg-surface" edges={['left', 'right', 'bottom']}>
      <ScreenHeader
        left={
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={10}
            className="pr-1 active:opacity-70"
          >
            <Ionicons name="chevron-back" size={32} color={colors['text-strong']} />
          </Pressable>
        }
        title="Notifications"
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {!pushReady ? (
          <View className="mx-4 mt-4 rounded-search bg-surface-muted p-4 gap-1">
            <Text className="text-body-1 font-semibold text-text-strong">
              Push is not active on this build
            </Text>
            <Text className="text-body-2 text-text-muted">
              These preferences are saved to CometChat and will take effect once Firebase is
              configured. Messages and calls still arrive over the live connection.
            </Text>
          </View>
        ) : null}

        <View className="mt-[18px] mx-4 rounded-search overflow-hidden">
          <ToggleRow
            icon="notifications-outline"
            label="Push notifications"
            subtitle="Messages and calls wake the app when it is closed."
            value={pushEnabled !== false}
            onChange={(next) => {
              void setPushEnabled(next)
                .then(() =>
                  Alert.alert(
                    next ? 'Push enabled' : 'Push disabled',
                    'Saved to your CometChat account.'
                  )
                )
                .catch(() =>
                  Alert.alert(
                    'Could not save',
                    'Your CometChat app does not have the notifications extension enabled.'
                  )
                );
            }}
          />
        </View>

        <Text className="px-4 pt-6 pb-2 text-[15.8px] font-semibold text-text-muted">
          Muted chats
        </Text>

        {conversations.length === 0 ? (
          <View className="mx-4 rounded-search px-4 py-6 items-center gap-2">
            <Ionicons name="chatbubbles-outline" size={32} color={colors['text-muted']} />
            <Text className="text-body-2 text-text-muted text-center">
              No conversations to mute yet.
            </Text>
          </View>
        ) : (
          <View className="mx-4 rounded-search overflow-hidden">
            {conversations.map((conversation, index) => (
              <ToggleRow
                key={conversation.id}
                icon={conversation.type === 'group' ? 'people-outline' : 'person-outline'}
                label={conversation.name || conversation.id}
                value={!mutedConversations.includes(conversation.id)}
                onChange={(next) => {
                  void setConversationMuted(conversation.id, !next).catch(() =>
                    Alert.alert('Could not save', 'This chat could not be updated.')
                  );
                }}
                last={index === conversations.length - 1}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};

export default NotificationsScreen;