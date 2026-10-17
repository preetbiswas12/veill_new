import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import Avatar from '@/components/Avatar';
import Screen from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useCometChat } from '@/hooks/useCometChat';
import { getError } from '@/lib/utils';

/** A single settings row: icon, label, optional value, chevron. */
const SettingRow = ({
  icon,
  label,
  value,
  onPress,
  destructive = false,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    accessibilityRole="button"
    className="flex-row items-center gap-4 px-4 h-[56px] active:bg-surface-muted"
  >
    <Ionicons name={icon} size={22} color={destructive ? '#ea0038' : '#767779'} />
    <Text
      className="flex-1 text-body-1"
      style={{ color: destructive ? '#ea0038' : '#0a0a0a' }}
    >
      {label}
    </Text>
    {value ? <Text className="text-body-2 text-text-muted">{value}</Text> : null}
    {onPress ? <Ionicons name="chevron-forward" size={18} color="#767779" /> : null}
  </Pressable>
);

/**
 * Settings is the account surface the design's Settings tab expects: identity
 * at the top, then the account-level actions. Editing the name and avatar lives
 * on the profile screen this screen links into.
 */
const SettingsScreen = () => {
  const router = useRouter();
  const { user, signOut } = useCometChat();

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'You will need to sign in again on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/');
          } catch (err) {
            getError(err);
          }
        },
      },
    ]);
  };

  return (
    <Screen viewClassName="bg-white" edges={['left', 'right', 'bottom']}>
      <View className="px-4 pt-2 pb-3">
        <Text className="text-display font-bold text-text-strong">Settings</Text>
      </View>

      <Pressable
        onPress={() => router.push('/profile')}
        accessibilityRole="button"
        accessibilityLabel="Edit profile"
        className="flex-row items-center gap-4 px-4 py-4 active:bg-surface-muted"
      >
        <Avatar name={user?.name || ''} imageUrl={user?.image} size={64} fontSize={26} />
        <View className="flex-1 min-w-0">
          <Text className="text-body-1 font-semibold text-text-strong" numberOfLines={1}>
            {user?.name || 'Set a name'}
          </Text>
          {user?.id ? (
            <Text className="text-body-2 text-text-muted" numberOfLines={1}>
              {user.id}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color="#767779" />
      </Pressable>

      <View className="h-hair bg-separator" />

      <SettingRow
        icon="person-outline"
        label="Profile"
        value={user?.name}
        onPress={() => router.push('/profile')}
      />
      <SettingRow
        icon="chatbubbles-outline"
        label="Chats"
        onPress={() => router.push('/chats')}
      />
      <SettingRow
        icon="people-outline"
        label="Communities"
        onPress={() => router.push('/communities')}
      />
      <SettingRow
        icon="shield-checkmark-outline"
        label="Encryption"
        value="end-to-end"
        onPress={() =>
          Alert.alert(
            'End-to-end encrypted',
            'Messages you send are delivered through your CometChat app and are readable only by the participants of the conversation.'
          )
        }
      />

      <View className="h-4" />
      <View className="h-hair bg-separator" />

      <SettingRow
        icon="call-outline"
        label="Calls"
        onPress={() => router.push('/calls')}
      />
      <SettingRow icon="log-out-outline" label="Sign out" onPress={confirmSignOut} destructive />
    </Screen>
  );
};

export default SettingsScreen;