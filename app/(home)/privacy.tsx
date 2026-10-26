import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { SettingsRowItem } from '@/components/BadgeIcon';
import Screen from '@/components/Screen';
import { HeaderButton } from '@/components/ScreenHeader';
import { useCometChat } from '@/hooks/useCometChat';
import { useFavourites } from '@/hooks/useFavourites';
import { useTheme } from '@/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Privacy.
 *
 * The rows that CometChat's client SDK can actually enforce are live: blocked
 * users come from `getBlockedUsers`, and blocking goes through the SDK rather
 * than being faked. The presence rows describe what the platform does rather
 * than offering a switch that would not take effect, because there is no client
 * API to change last-seen or online visibility.
 */
const PrivacyScreen = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { blockedIds, toggleBlockUser, isBlocked } = useCometChat();
  const { ids: favouriteIds } = useFavourites();

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
          Privacy
        </Text>
        {/* Balances the back button so the title stays optically centred. */}
        <View className="w-11" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <Text className="px-4 pt-5 pb-2 text-caption text-text-muted">
          Your messages are delivered through your CometChat app. Only the people in
          a conversation can read what is sent there.
        </Text>

        {blockedIds.length ? (
          <View className="mb-6">
            <Text className="px-4 pb-2 text-caption font-semibold text-text-muted">
              Blocked
            </Text>
            <View className="mx-4 overflow-hidden rounded-card">
              {blockedIds.map((uid, index) => (
                <View
                  key={uid}
                  className={`flex-row items-center gap-3 pl-4 pr-4 min-h-[44px] py-2.5 ${
                    index === blockedIds.length - 1 ? '' : 'border-b-hair border-separator'
                  }`}
                >
                  <Text className="flex-1 min-w-0 text-body-1 text-text-strong" numberOfLines={1}>
                    {uid}
                  </Text>
                  <Text
                    onPress={() => void toggleBlockUser(uid)}
                    accessibilityRole="button"
                    className="text-body-2 text-link active:opacity-60"
                  >
                    Unblock
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View className="mb-6">
          <Text className="px-4 pb-2 text-caption font-semibold text-text-muted">Who can see</Text>
          <View className="mx-4 overflow-hidden rounded-card">
            <SettingsRowItem
              icon="person-outline"
              badgeColor="#4a90d9"
              label="Profile photo"
              value="Everyone"
              onPress={() =>
                // Read-only: CometChat has no client API for profile visibility.
                undefined
              }
            />
            <SettingsRowItem
              icon="information-circle-outline"
              badgeColor="#4a90d9"
              label="About"
              value="Everyone"
            />
            <SettingsRowItem
              icon="call-outline"
              badgeColor="#4a90d9"
              label="Last seen and online"
              value="Everyone"
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="px-4 pb-2 text-caption font-semibold text-text-muted">
            Chats and calls
          </Text>
          <View className="mx-4 overflow-hidden rounded-card">
            <SettingsRowItem
              icon="chatbubble-ellipses-outline"
              badgeColor="#4a90d9"
              label="Who can add me to groups"
              value="Everyone"
            />
            <SettingsRowItem
              icon="star-outline"
              badgeColor="#4a90d9"
              label="Favourites on this device"
              value={favouriteIds.length ? `${favouriteIds.length}` : 'None'}
            />
          </View>
        </View>

        <View className="items-center px-8 pb-6">
          <Ionicons name="shield-checkmark-outline" size={28} color={colors['text-muted']} />
          <Text className="mt-2 text-caption text-text-muted text-center">
            Blocking a person hides your messages from them and stops theirs from
            reaching you. It is applied through CometChat, so it takes effect on
            every device signed in as you.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
};

export default PrivacyScreen;
