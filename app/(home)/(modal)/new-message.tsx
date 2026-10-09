import { Entypo, Feather, MaterialIcons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { useCometChat } from '@/hooks/useCometChat';

import Button from '@/components/Button';
import Screen from '@/components/Screen';
import Spinner from '@/components/Spinner';
import UserCard from '@/components/UserCard';
import useContacts from '@/hooks/useContacts';

const NewMessageScreen = () => {
  const router = useRouter();
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
      <View className="w-full">
        <Link href="/new-group" asChild>
          <Button
            variant="plain"
            className="bg-white flex-row items-center justify-between rounded-t-lg pt-0.5"
          >
            <View className="px-4">
              <MaterialIcons name="people-outline" size={24} color="black" />
            </View>
            <View className="flex-row flex-grow items-center justify-between gap-2 border-b border-gray-200">
              <Text>New Group</Text>
              <View className="p-2">
                <Entypo name="chevron-small-right" size={24} color="gray" />
              </View>
            </View>
          </Button>
        </Link>
        <Link href="/find-by-username" asChild>
          <Button
            variant="plain"
            className="bg-white flex-row items-center justify-between rounded-b-lg pb-0.5"
          >
            <View className="px-4">
              <Feather name="at-sign" size={24} color="black" />
            </View>
            <View className="flex-row flex-grow items-center justify-between gap-2">
              <Text>Find by Username</Text>
              <View className="p-2">
                <Entypo name="chevron-small-right" size={24} color="gray" />
              </View>
            </View>
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
