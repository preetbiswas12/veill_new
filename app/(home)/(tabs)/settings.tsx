import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ProfileCard, SettingsRowItem } from '@/components/BadgeIcon';
import Screen from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useCometChat } from '@/hooks/useCometChat';
import { useStarredMessages } from '@/hooks/useStarredMessages';
import { useTheme } from '@/hooks/useTheme';
import { showAlertDialog } from '@/components/AlertDialog';
import type { ThemePreference } from '@/hooks/useTheme';

/**
 * Settings, in the iOS Settings idiom the design specifies: a profile card, then
 * grouped lists of rows carrying a coloured rounded-square badge, a value on the
 * right where one applies, and a chevron that only appears on rows that go
 * somewhere.
 *
 * Every row either navigates or acts. Where CometChat has no client surface for
 * something the design shows, the row says so plainly instead of pretending.
 */
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const THEME_LABEL: Record<ThemePreference, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

interface Row {
  icon: IconName;
  badge: string;
  label: string;
  value?: string;
  onPress?: () => void;
}

interface Group {
  id: string;
  rows: Row[];
}

const SettingsScreen = () => {
  const { colors, preference: themePreference, setPreference: setThemePreference } = useTheme();
  const router = useRouter();
  const { user, groups, blockedIds } = useCometChat();
  const { entries: starredEntries } = useStarredMessages();
  const [query, setQuery] = useState('');

  const open = (path: string) => () => router.push(path as any);
  const unavailable = (what: string, why: string) => () => showAlertDialog(what, why);

  const groups_ = useMemo<Group[]>(
    () => [
      {
        id: 'library',
        rows: [
          {
            icon: 'person-circle-outline',
            badge: '#1FA1E3',
            label: 'Avatar',
            onPress: open('/profile'),
          },
          {
            icon: 'list-outline',
            badge: '#F19941',
            label: 'Lists',
            value: groups.length ? `${groups.length}` : undefined,
            onPress: unavailable(
              'Lists',
              'CometChat has no curated-list concept. Favourited chats are available from the Chats tab filter.'
            ),
          },
          {
            icon: 'star-outline',
            badge: '#EFB041',
            label: 'Starred messages',
            value: starredEntries.length ? `${starredEntries.length}` : undefined,
            onPress: open('/starred'),
          },
          {
            icon: 'laptop-outline',
            badge: '#0ABAB5',
            label: 'Linked devices',
            onPress: unavailable(
              'Linked devices',
              'This app signs in with a CometChat UID on this device only. There is no second session to list.'
            ),
          },
        ],
      },
      {
        id: 'account',
        rows: [
          {
            icon: 'key-outline',
            badge: '#5176D9',
            label: 'Account',
            value: user?.name || undefined,
            onPress: unavailable(
              'Account',
              `Signed in as ${user?.name || 'you'}.\nUID: ${user?.id || '-'}\n\nChanging your UID means creating a new CometChat user.`
            ),
          },
          { icon: 'lock-closed-outline', badge: '#34AADC', label: 'Privacy', onPress: open('/privacy') },
          { icon: 'chatbubble-ellipses-outline', badge: '#34C759', label: 'Chats', onPress: open('/chats-settings') },
          {
            icon: 'moon-outline',
            badge: '#5E5CE6',
            label: 'Theme',
            value: THEME_LABEL[themePreference],
            onPress: () => {
              const label = (preference: ThemePreference) =>
                `${THEME_LABEL[preference]}${themePreference === preference ? '  ✓' : ''}`;
              showAlertDialog('Theme', undefined, [
                { text: label('system'), onPress: () => setThemePreference('system') },
                { text: label('light'), onPress: () => setThemePreference('light') },
                { text: label('dark'), onPress: () => setThemePreference('dark') },
              ]);
            },
          },
          {
            icon: 'notifications-outline',
            badge: '#FC3D39',
            label: 'Notifications',
            onPress: open('/notifications'),
          },
          {
            icon: 'pie-chart-outline',
            badge: '#00A884',
            label: 'Storage and data',
            onPress: open('/storage'),
          },
        ],
      },
      {
        id: 'help',
        rows: [
          {
            icon: 'help-circle-outline',
            badge: '#986DEE',
            label: 'Help',
            onPress: unavailable('Help', 'There is no help centre inside this app yet.'),
          },
          {
            icon: 'heart-outline',
            badge: '#3EC151',
            label: 'Tell a friend',
            onPress: () =>
              showAlertDialog(
                'Invite a friend',
                `Share this so they can start a chat with you.\n\nYour CometChat UID is ${user?.id || 'unknown'}.`
              ),
          },
        ],
      },
    ],
    [router, user, groups.length, starredEntries.length, themePreference]
  );

  // The design's search field filters the rows beneath it.
  const visibleGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return groups_;
    return groups_
      .map((group) => ({
        ...group,
        rows: group.rows.filter((row) => row.label.toLowerCase().includes(needle)),
      }))
      .filter((group) => group.rows.length > 0);
  }, [groups_, query]);

  const nothingFound = query.trim().length > 0 && visibleGroups.length === 0;

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <ScreenHeader title="Settings" large />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Search, above the grouped lists. */}
        <View className="px-4 pb-3">
          <View className="flex-row items-center gap-2 h-10 px-3 rounded-search bg-surface-input">
            <Ionicons name="search" size={20} color={colors['text-muted']} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search settings"
              placeholderTextColor={colors['text-muted']}
              accessibilityLabel="Search settings"
              className="flex-1 text-body-2 text-text-strong"
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        {nothingFound ? (
          <View className="items-center gap-1 py-16 px-8">
            <Text className="text-body-1 font-semibold text-text-strong">No settings found</Text>
            <Text className="text-body-2 text-text-muted text-center">
              Nothing matches "{query.trim()}".
            </Text>
          </View>
        ) : null}

        {visibleGroups.map((group, index) => (
          <View key={group.id} className="mb-6">
            {/* Each group is a rounded card with hairline-separated rows. */}
            <View
              className={`mx-4 overflow-hidden ${
                index === 0 ? 'rounded-card' : 'rounded-card'
              }`}
            >
              {group.rows.map((row, rowIndex) => (
                <SettingsRowItem
                  key={row.label}
                  icon={row.icon}
                  badgeColor={row.badge}
                  label={row.label}
                  value={row.value}
                  onPress={row.onPress}
                  last={rowIndex === group.rows.length - 1}
                />
              ))}
            </View>
          </View>
        ))}

        <Text className="text-caption text-text-muted text-center px-4">from Meta</Text>
      </ScrollView>
    </Screen>
  );
};

export default SettingsScreen;
