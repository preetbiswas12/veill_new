import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Share, Switch, Text, View } from 'react-native';

import Avatar from '@/components/Avatar';
import Screen from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useFavourites } from '@/hooks/useFavourites';
import { useCometChat, getMessageBody, getMessageText, getMessageTimestamp } from '@/hooks/useCometChat';
import { useTheme } from '@/hooks/useTheme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Contact info, built from the Figma frame "Contact info - Full view"
 * (178:7585): a 120pt avatar on a 28pt radius, a 26.8pt bold name over a 16pt
 * secondary id, three 73pt action tiles, then the rounded white cards of
 * settings rows at 0.33pt separators.
 *
 * Only rows with real behaviour are rendered - every control here does
 * something rather than navigating nowhere.
 */

/** 73pt tile: white, 10pt radius, green 24pt icon over a 14pt label. */
const ActionTile = ({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) => {
  // A helper component reads the palette itself rather than borrowing the
  // screen's `colors`, which is not in scope here.
  const { colors } = useTheme();
  return (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    className="flex-1 min-w-0 h-[73px] items-center gap-[5px] px-2 py-[14.5px] rounded-search bg-surface-muted active:opacity-70"
  >
    <Ionicons name={icon} size={24} color={colors['product']} />
    <Text className="text-body-2 text-text-strong" numberOfLines={1}>
      {label}
    </Text>
  </Pressable>
  );
};

/** Settings row: 24pt icon, label, optional value, chevron or switch. */
const Row = ({
  icon,
  label,
  value,
  subtitle,
  onPress,
  toggle,
  toggleValue,
  onToggle,
  destructive = false,
  last = false,
}: {
  icon: IconName;
  label: string;
  value?: string;
  subtitle?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (next: boolean) => void;
  destructive?: boolean;
  last?: boolean;
}) => {
  const { colors } = useTheme();
  return (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    accessibilityRole="button"
    className={`flex-row items-center gap-[18.66px] pl-[18px] pr-[9px] min-h-[40px] py-[11px] ${
      last ? '' : 'border-b-hair border-separator'
    }`}
  >
    <Ionicons
      name={icon}
      size={24}
      color={destructive ? colors['text-error'] : colors['teal']}
    />
    <View className="flex-1 min-w-0">
      <View className="flex-row items-center justify-between">
        <Text
          className="flex-1 min-w-0 text-body-1"
          style={{ color: destructive ? colors['text-error'] : colors['text-strong'] }}
          numberOfLines={1}
        >
          {label}
        </Text>
        {value ? (
          <Text className="text-body-2 text-text-muted" numberOfLines={1}>
            {value}
          </Text>
        ) : null}
        {toggle ? (
          <Switch
            value={!!toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: colors['separator'], true: colors['product'] }}
            // The thumb stays light in both modes, which is what iOS does.
            thumbColor="#ffffff"
          />
        ) : onPress ? (
          <Ionicons name="chevron-forward" size={16} color={colors['text-muted']} />
        ) : null}
      </View>
      {subtitle ? (
        <Text className="text-caption text-text-muted" numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  </Pressable>
  );
};

/** Section heading from the design's "Title small": 15.8pt semibold. */
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <View className="px-4 py-2">
    <Text className="text-[15.8px] font-semibold text-text-strong">{children}</Text>
  </View>
);

const ContactInfoScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const { id, name, image, type } = useLocalSearchParams<{
    id: string;
    name?: string;
    image?: string;
    type?: string;
  }>();
  const { user, createGroup, isBlocked, toggleBlockUser, clearConversation, messagesByConversation } =
    useCometChat();
  const { isFavourite, toggle } = useFavourites();
  const blocked = isBlocked(String(id));

  const [muted, setMuted] = useState(false);
  const [locked, setLocked] = useState(false);

  const title = name || id || 'Contact';
  const isGroup = type === 'group';

  const openCall = (video: boolean) => {
    router.replace({
      pathname: '/call/[id]',
      params: {
        id: String(id ?? ''),
        name: title,
        image: image || '',
        video: video ? '1' : '0',
        direction: 'outgoing',
      },
    });
  };

  const shareContact = async () => {
    try {
      await Share.share({
        message: `${title}\nCometChat UID: ${id}`,
      });
    } catch {
      // User dismissed the share sheet.
    }
  };

  const confirmClearChat = () => {
    Alert.alert('Clear chat?', 'This deletes every message you can see in this conversation.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            const removed = await clearConversation(String(id), isGroup ? 'group' : 'user');
            Alert.alert('Chat cleared', removed === 1 ? '1 message deleted.' : `${removed} messages deleted.`);
          } catch {
            Alert.alert('Could not clear', 'Some messages could not be deleted.');
          }
        },
      },
    ]);
  };

  // CometChat has no export endpoint, so the transcript is built from what is
  // loaded and handed to the system share sheet.
  const exportChat = async () => {
    const loaded = messagesByConversation.get(String(id)) || [];
    if (loaded.length === 0) {
      Alert.alert('Nothing to export', 'Load the chat first so its messages are available.');
      return;
    }
    const transcript = loaded
      .map((message: any) => {
        const at = new Date(getMessageTimestamp(message) || Date.now()).toLocaleString();
        const who =
          typeof message?.getSender === 'function' ? message.getSender()?.getName?.() : undefined;
        return `[${at}] ${who || 'Unknown'}: ${getMessageBody(message) || getMessageText(message) || ''}`;
      })
      .join('\n');
    try {
      await Share.share({ message: `Chat with ${title}\n\n${transcript}` });
    } catch {
      // Share sheet dismissed.
    }
  };

  return (
    <Screen className="bg-surface" edges={['left', 'right', 'bottom']}>
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
        title="Contact info"
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="items-center gap-[23.66px] pt-[6px] px-4">
          <View className="items-center gap-3">
            <Avatar
              name={title}
              imageUrl={image}
              size={120}
              fontSize={44}
              placeholderType={isGroup ? 'icon' : 'text'}
            />
            <View className="items-center gap-[5px]">
              <Text className="text-[26.8px] font-bold text-text-strong" numberOfLines={1}>
                {title}
              </Text>
              <Text className="text-[16px] text-text-muted" numberOfLines={1}>
                {id}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-2 w-full">
            <ActionTile icon="call-outline" label="Audio" onPress={() => openCall(false)} />
            <ActionTile icon="videocam-outline" label="Video" onPress={() => openCall(true)} />
            <ActionTile
              icon="people-outline"
              label="Group"
              onPress={() => router.push('/new-group')}
            />
          </View>
        </View>

        <View className="gap-[18px] px-4 mt-[18px]">
          <View className="rounded-search overflow-hidden">
            <Row
              icon="notifications-outline"
              label="Mute notifications"
              toggle
              toggleValue={muted}
              onToggle={setMuted}
            />
            {!isGroup ? (
              <Row
                icon="lock-closed-outline"
                label="Lock chat"
                subtitle="Lock and hide this chat on this device."
                toggle
                toggleValue={locked}
                onToggle={setLocked}
                last
              />
            ) : (
              <Row icon="lock-closed-outline" label="Lock chat" toggle last />
            )}
          </View>

          <View className="rounded-search overflow-hidden">
            <Row
              icon="shield-checkmark-outline"
              label="Encryption"
              subtitle="Messages and calls are end-to-end encrypted."
              onPress={() =>
                Alert.alert(
                  'End-to-end encrypted',
                  'Messages you send are delivered through your CometChat app and are readable only by the participants of this conversation.'
                )
              }
            />
            <Row
              icon="person-circle-outline"
              label="Contact details"
              value={id}
              onPress={() => Alert.alert('Contact details', `CometChat UID: ${id}`)}
              last
            />
          </View>
        </View>

        <SectionTitle>No groups in common</SectionTitle>
        <View className="px-4">
          <View className="rounded-search overflow-hidden">
            <Pressable
              onPress={() => router.push('/new-group')}
              accessibilityRole="button"
              accessibilityLabel={`Create group with ${title}`}
              className="flex-row items-center gap-[18.66px] pl-[18px] pr-[9px] min-h-[40px] py-[11px] active:bg-surface-muted"
            >
              <View className="h-6 w-6 rounded-full bg-surface-muted items-center justify-center">
                <Ionicons name="add" size={16} color={colors['text-strong']} />
              </View>
              <Text className="flex-1 text-body-1 text-text-strong" numberOfLines={1}>
                Create Group with {title.split(' ')[0]}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors['text-muted']} />
            </Pressable>
            {user?.id && user.id !== id ? (
              <Pressable
                onPress={async () => {
                  try {
                    await createGroup(`${title.split(' ')[0]} & me`, [user.id, String(id)]);
                    Alert.alert('Group created', 'The new group is in Communities.');
                  } catch {
                    // createGroup surfaces the failure on the provider.
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Start a group here"
                className="flex-row items-center gap-[18.66px] pl-[18px] pr-[9px] min-h-[40px] py-[11px] border-t-hair border-separator active:bg-surface-muted"
              >
                <View className="h-6 w-6 rounded-full bg-surface-muted items-center justify-center">
                  <Ionicons name="people-outline" size={14} color={colors['text-strong']} />
                </View>
                <Text className="flex-1 text-body-1 text-text-strong" numberOfLines={1}>
                  Start a group with {title.split(' ')[0]}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors['text-muted']} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <View className="gap-[18px] px-4 mt-[18px]">
          <View className="rounded-search overflow-hidden">
            <Row
              icon="share-outline"
              label="Share contact"
              onPress={() => void shareContact()}
            />
            <Row
              icon="star-outline"
              label={isFavourite(String(id)) ? 'Remove from favourites' : 'Add to favourites'}
              onPress={async () => {
                const added = await toggle(String(id));
                Alert.alert(
                  added ? 'Added to favourites' : 'Removed from favourites',
                  `${title} ${added ? 'now shows' : 'no longer shows'} under the Favourites filter.`
                );
              }}
            />
            <Row
              icon="download-outline"
              label="Export chat"
              onPress={() => void exportChat()}
            />
            <Row
              icon="trash-outline"
              label="Clear chat"
              onPress={confirmClearChat}
            />
            <Row
              icon={blocked ? 'close-circle-outline' : 'ban-outline'}
              label={blocked ? `Unblock ${title.split(' ')[0]}` : `Block ${title.split(' ')[0]}`}
              destructive
              onPress={() => {
                void toggleBlockUser(String(id))
                  .then((nowBlocked) =>
                    Alert.alert(
                      nowBlocked ? 'Blocked' : 'Unblocked',
                      `${title} ${nowBlocked ? 'can no longer message you.' : 'can message you again.'}`
                    )
                  )
                  .catch(() =>
                    Alert.alert('Could not update', 'Blocking needs to be enabled on this CometChat app.')
                  );
              }}
              last
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
};

export default ContactInfoScreen;