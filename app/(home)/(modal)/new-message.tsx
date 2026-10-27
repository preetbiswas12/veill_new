import { Entypo, Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { useCometChat } from '@/hooks/useCometChat';
import { useTheme } from '@/hooks/useTheme';

import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import Screen from '@/components/Screen';
import Spinner from '@/components/Spinner';
import UserCard from '@/components/UserCard';
import { showAlertDialog } from '@/components/AlertDialog';
import useContacts from '@/hooks/useContacts';
import { STORIES_GUID } from '@/lib/cometchat';

interface ForwardTarget {
  id: string;
  type: 'user' | 'group';
}

/**
 * New-message picker, and — when it arrives carrying a `forward` text — the
 * forward picker the thread's action sheet routes to.
 *
 * Forward mode follows the design's WhatsApp parentage: the quoted message
 * previews on top, taps become a multi-select across contacts and joined
 * groups, and a floating action button sends once per target. The same sealed
 * send path text always uses runs per destination (each conversation seals the
 * content under its own key — the plaintext is re-sealed, never relayed).
 */
const NewMessageScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { getOrCreateConversation, sendTextMessage, groups, user } = useCometChat();
  const { contacts, loadingContacts } = useContacts();

  const forwardParam = useLocalSearchParams<{ forward?: string | string[] }>().forward;
  const forwardedText = Array.isArray(forwardParam) ? forwardParam[0] : forwardParam;
  const isForwarding = Boolean(forwardedText);

  const [selected, setSelected] = useState<ForwardTarget[]>([]);
  const [sending, setSending] = useState(false);

  const selectableGroups = useMemo(
    () => groups.filter((group) => group.id !== STORIES_GUID),
    [groups]
  );

  const toggle = useCallback((target: ForwardTarget) => {
    setSelected((prev) =>
      prev.some((entry) => entry.id === target.id)
        ? prev.filter((entry) => entry.id !== target.id)
        : [...prev, target]
    );
  }, []);

  const onSelectUser = async (contact: {
    id: string;
    name?: string;
    image?: string;
  }) => {
    const conversation = await getOrCreateConversation(contact.id, 'user');
    router.dismissTo({
      pathname: '/chat/[id]',
      params: {
        id: conversation.id,
        name: conversation.name || contact.name || '',
        image: conversation.image || contact.image || '',
        type: conversation.type,
      },
    });
  };

  const targets = useMemo<ForwardTarget[]>(
    () => [
      ...contacts
        .filter((contact) => contact.id !== user?.id)
        .map((contact) => ({ id: contact.id, type: 'user' as const })),
      ...selectableGroups.map((group) => ({ id: group.id, type: 'group' as const })),
    ],
    [contacts, selectableGroups, user?.id]
  );

  const onSendForward = useCallback(async () => {
    const text = forwardedText ?? '';
    if (!text || selected.length === 0 || sending) return;
    setSending(true);

    // One sealed send per target; a single dead conversation reports partial
    // progress honestly instead of implying the whole thing failed.
    let fulfilled = 0;
    for (const target of selected) {
      try {
        await sendTextMessage(target.id, text, target.type);
        fulfilled += 1;
      } catch {
        // counted below
      }
    }

    setSending(false);
    if (fulfilled === selected.length) {
      router.back();
      return;
    }
    showAlertDialog(
      'Forward incomplete',
      `Sent to ${fulfilled} of ${selected.length}. Check your connection, then forward again from the original chat.`
    );
    if (fulfilled > 0) router.back();
  }, [forwardedText, selected, sending, sendTextMessage, router]);

  const checkbox = (name: string, chosen: boolean) => (
    <Ionicons
      name={chosen ? 'checkmark-circle' : 'ellipse-outline'}
      size={22}
      color={chosen ? colors['product'] : colors['text-muted']}
      accessibilityLabel={`${chosen ? 'Selected' : 'Not selected'}: ${name}`}
    />
  );

  return (
    <Screen viewClassName="pt-1 relative">
      {isForwarding ? (
        <>
          {/* What is being forwarded, quoted once at the top. */}
          <View className="mx-4 mb-2 rounded-card bg-surface border-hair border-panel-border p-3 flex-row items-start gap-3">
            <Ionicons
              name="arrow-redo-outline"
              size={18}
              color={colors['text-muted']}
              style={{ marginTop: 2 }}
            />
            <View className="flex-1 min-w-0">
              <Text className="text-caption text-text-muted">Forwarding</Text>
              <Text className="text-body-2 text-text-strong" numberOfLines={4}>
                {forwardedText}
              </Text>
            </View>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 96 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="mx-4 overflow-hidden rounded-card bg-surface">
              {contacts
                .filter((contact) => contact.id !== user?.id)
                .map((contact, index, list) => (
                  <Pressable
                    key={contact.id}
                    onPress={() => toggle({ id: contact.id, type: 'user' })}
                    className={`flex-row items-center gap-3 px-4 py-3 active:bg-surface-muted ${
                      index < list.length - 1 ? 'border-b-hair border-separator' : ''
                    }`}
                    accessibilityLabel={`Select ${contact.name || contact.username || contact.id}`}
                  >
                    <View className="h-10 w-10">
                      <Avatar
                        name={contact.name || contact.username || contact.id}
                        imageUrl={contact.image}
                        size={40}
                      />
                    </View>
                    <Text className="flex-1 text-body-2 text-text-strong" numberOfLines={1}>
                      {contact.name || contact.username || contact.id}
                    </Text>
                    {checkbox(contact.name || contact.id, selected.some((entry) => entry.id === contact.id))}
                  </Pressable>
                ))}
              {loadingContacts && contacts.length === 0 ? (
                <View className="items-center py-4">
                  <Spinner />
                </View>
              ) : null}
              {!loadingContacts && contacts.length <= 1 && selectableGroups.length === 0 ? (
                <Text className="px-4 py-4 text-body-3 text-text-muted">
                  No contacts to forward to yet.
                </Text>
              ) : null}
            </View>

            {selectableGroups.length > 0 ? (
              <>
                <Text className="mx-4 mt-4 mb-1 text-caption uppercase text-text-muted">
                  Groups
                </Text>
                <View className="mx-4 overflow-hidden rounded-card bg-surface">
                  {selectableGroups.map((group, index, list) => (
                    <Pressable
                      key={group.id}
                      onPress={() => toggle({ id: group.id, type: 'group' })}
                      className={`flex-row items-center gap-3 px-4 py-3 active:bg-surface-muted ${
                        index < list.length - 1 ? 'border-b-hair border-separator' : ''
                      }`}
                      accessibilityLabel={`Select ${group.name}`}
                    >
                      <View className="h-10 w-10">
                        <Avatar name={group.name} imageUrl={group.image} size={40} />
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text className="text-body-2 text-text-strong" numberOfLines={1}>
                          {group.name}
                        </Text>
                        <Text className="text-caption text-text-muted">
                          {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                        </Text>
                      </View>
                      {checkbox(group.name, selected.some((entry) => entry.id === group.id))}
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
          </ScrollView>

          {selected.length > 0 ? (
            <View className="absolute bottom-6 right-4">
              <Pressable
                onPress={() => void onSendForward()}
                accessibilityLabel={`Forward to ${selected.length} chats`}
                className="h-14 w-14 rounded-full bg-product items-center justify-center active:opacity-80"
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 4,
                }}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
          ) : null}
        </>
      ) : (
        <>
          <View className="w-full overflow-hidden rounded-card bg-surface">
            <Link href="/new-group" asChild>
              <Button
                variant="plain"
                className="flex-row items-center justify-between px-4 py-3 border-b-hair border-separator"
              >
                <View className="flex-row items-center gap-3">
                  <MaterialIcons name="people-outline" size={24} color={colors['teal']} />
                  <Text className="text-body-1 text-text-strong">New Group</Text>
                </View>
                <Entypo name="chevron-small-right" size={24} color={colors['text-muted']} />
              </Button>
            </Link>
            <Link href="/find-by-username" asChild>
              <Button
                variant="plain"
                className="flex-row items-center justify-between px-4 py-3"
              >
                <View className="flex-row items-center gap-3">
                  <Feather name="at-sign" size={24} color={colors['teal']} />
                  <Text className="text-body-1 text-text-strong">Find by Username</Text>
                </View>
                <Entypo name="chevron-small-right" size={24} color={colors['text-muted']} />
              </Button>
            </Link>
          </View>
          {loadingContacts && (
            <View className="flex items-center justify-center py-4">
              <Spinner />
            </View>
          )}
          {!loadingContacts && contacts.length > 0 && (
            <View className="flex flex-col gap-2 mt-4">
              {contacts.map((contact) => (
                <UserCard
                  key={contact.id}
                  user={contact}
                  onPress={() => void onSelectUser(contact)}
                />
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
};

export default NewMessageScreen;
