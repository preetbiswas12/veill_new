import { Entypo, Feather, MaterialIcons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { useCometChat } from '@/hooks/useCometChat';
import { useTheme } from '@/hooks/useTheme';

import Button from '@/components/Button';
import Screen from '@/components/Screen';
import Spinner from '@/components/Spinner';
import UserCard from '@/components/UserCard';
import useContacts from '@/hooks/useContacts';

const NewMessageScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { getOrCreateConversation } = useCometChat();
  const { contacts, loadingContacts } = useContacts();

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

  return (
    <Screen viewClassName="pt-1 px-4">
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
              onPress={() => onSelectUser(contact)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
};

export default NewMessageScreen;
