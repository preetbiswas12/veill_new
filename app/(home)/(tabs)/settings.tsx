import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';

import Avatar from '@/components/Avatar';
import Screen from '@/components/Screen';
import { useCometChat } from '@/hooks/useCometChat';

type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Settings, rebuilt from the Figma frame "Settings - Full view" (121:2160):
 * a 33.33pt bold title over a search field, then five rounded white cards at a
 * 10pt radius holding 40pt rows with 24pt icons and 0.33pt separators.
 *
 * Rows are grouped exactly as the design groups them. Where CometChat has no
 * equivalent the row responds with an Alert saying so rather than opening
 * nothing.
 */

/** 40pt row: 24pt icon, label, chevron. */
const Row = ({
  icon,
  label,
  onPress,
  last = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  last?: boolean;
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    className={`flex-row items-center gap-3 pl-4 pr-2 h-10 active:bg-surface-muted ${
      last ? '' : 'border-b-hair border-separator'
    }`}
  >
    <Ionicons name={icon} size={24} color="#0a0a0a" />
    <Text className="flex-1 min-w-0 text-body-1 text-text-strong" numberOfLines={1}>
      {label}
    </Text>
    <Ionicons name="chevron-forward" size={16} color="#767779" />
  </Pressable>
);

const notWired = (what: string) => () =>
  Alert.alert(what, 'This section is not connected to CometChat yet.');

const openExternal = (url: string) => () => {
  void Linking.openURL(url).catch(() => {
    Alert.alert('Could not open', url);
  });
};

const SettingsScreen = () => {
  const router = useRouter();
  const { user } = useCometChat();
  const [query, setQuery] = useState('');

  const groups = useMemo(
    () => [
      {
        id: 'library',
        rows: [
          { icon: 'list' as IconName, label: 'List', onPress: notWired('List') },
          {
            icon: 'megaphone-outline' as IconName,
            label: 'Broadcast messages',
            onPress: notWired('Broadcast messages'),
          },
          {
            icon: 'star-outline' as IconName,
            label: 'Starred messages',
            onPress: notWired('Starred messages'),
          },
          {
            icon: 'laptop-outline' as IconName,
            label: 'Linked devices',
            onPress: notWired('Linked devices'),
          },
        ],
      },
      {
        id: 'account',
        rows: [
          {
            icon: 'key-outline' as IconName,
            label: 'Account',
            onPress: () =>
              Alert.alert('Account', `Signed in as ${user?.name || 'you'}.\nUID: ${user?.id || '-'}`),
          },
          {
            icon: 'lock-closed-outline' as IconName,
            label: 'Privacy',
            onPress: () =>
              Alert.alert(
                'Privacy',
                'Messages you send are delivered through your CometChat app and are readable only by the participants of the conversation.'
              ),
          },
          {
            icon: 'chatbubble-outline' as IconName,
            label: 'Chats',
            onPress: () => router.push('/chats'),
          },
          {
            icon: 'notifications-outline' as IconName,
            label: 'Notifications',
            onPress: notWired('Notifications'),
          },
          {
            icon: 'arrow-down-outline' as IconName,
            label: 'Storage and data',
            onPress: notWired('Storage and data'),
          },
        ],
      },
      {
        id: 'help',
        rows: [
          { icon: 'help-circle-outline' as IconName, label: 'Help', onPress: notWired('Help') },
          {
            icon: 'heart-outline' as IconName,
            label: 'Invite a friend',
            onPress: async () => {
              try {
                await Share.share({
                  message: `Join me on veill. My CometChat UID is ${user?.id || ''}.`,
                });
              } catch {
                // Share sheet dismissed.
              }
            },
          },
        ],
      },
      {
        id: 'meta',
        title: 'Also from Meta',
        rows: [
          {
            icon: 'logo-instagram' as IconName,
            label: 'Open Instagram',
            onPress: openExternal('https://www.instagram.com/'),
          },
          {
            icon: 'logo-facebook' as IconName,
            label: 'Open Facebook',
            onPress: openExternal('https://www.facebook.com/'),
          },
          {
            icon: 'planet-outline' as IconName,
            label: 'Open Threads',
            onPress: openExternal('https://www.threads.net/'),
          },
        ],
      },
    ],
    [router, user?.id, user?.name]
  );

  // The design's search field filters the rows beneath it.
  const visibleGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return groups;
    return groups
      .map((group) => ({
        ...group,
        rows: group.rows.filter((row) => row.label.toLowerCase().includes(needle)),
      }))
      .filter((group) => group.rows.length > 0);
  }, [groups, query]);

  return (
    <Screen viewClassName="bg-white" edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title block: 33.33pt bold over the search field. */}
        <View className="gap-2 px-4 pt-[5px] pb-2">
          <Text className="text-display font-bold text-text-strong">Settings</Text>
          <View className="pt-px">
            <View className="flex-row items-center gap-2.5 pb-2">
              <View className="flex-1 flex-row items-center gap-1 p-[5px] rounded-search bg-surface-cta">
                <Ionicons name="search" size={24} color="#767779" />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search"
                  placeholderTextColor="#767779"
                  accessibilityLabel="Search settings"
                  className="flex-1 text-[16.4px] text-text-strong"
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Card 1 - profile. */}
        {query.trim().toLowerCase() === '' || 'avatar'.includes(query.trim().toLowerCase()) ? (
          <View className="mx-4 rounded-[10px] overflow-hidden">
            <Pressable
              onPress={() => router.push('/profile')}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              className="flex-row items-center gap-3 h-[71px] pl-4 pr-4 border-b-hair border-separator active:bg-surface-muted"
            >
              <Avatar name={user?.name || ''} imageUrl={user?.image} size={56} fontSize={22} />
              <View className="flex-1 min-w-0 gap-px pr-4">
                <Text className="text-[20px] text-text-strong" numberOfLines={1}>
                  {user?.name || 'Set a name'}
                </Text>
                <Text className="text-[16px] text-text-muted" numberOfLines={1}>
                  {user?.id || ''}
                </Text>
              </View>
              <View className="h-7 w-7 rounded-full bg-surface-cta items-center justify-center">
                <Ionicons name="create-outline" size={18} color="#0a0a0a" />
              </View>
            </Pressable>
            <Row
              icon="person-circle-outline"
              label="Avatar"
              onPress={() => router.push('/profile')}
              last
            />
          </View>
        ) : null}

        {visibleGroups.map((group, groupIndex) => (
          <View key={group.id} className={groupIndex === 0 && query ? '' : 'mt-[18px]'}>
            {group.title ? (
              <Text className="text-body-2 text-text-muted px-4 pb-1">{group.title}</Text>
            ) : null}
            <View className="mx-4 rounded-[10px] overflow-hidden">
              {group.rows.map((row, rowIndex) => (
                <Row
                  key={row.label}
                  icon={row.icon}
                  label={row.label}
                  onPress={row.onPress}
                  last={rowIndex === group.rows.length - 1}
                />
              ))}
            </View>
          </View>
        ))}

        {visibleGroups.length === 0 ? (
          <View className="items-center gap-2 px-10 py-12">
            <Ionicons name="search-outline" size={36} color="#767779" />
            <Text className="text-body-2 text-text-muted text-center">
              No settings match &quot;{query.trim()}&quot;.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
};

export default SettingsScreen;