import { useUser } from '@clerk/clerk-expo';
import { Feather } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import AppMenu from '@/components/AppMenu';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import Screen from '@/components/Screen';

const StoriesScreen = () => {
  const { user } = useUser();

  return (
    <Screen className="bg-white" viewClassName="px-4 pt-1">
      <View className="flex flex-row items-center justify-between w-full h-8">
        <AppMenu />
        <View className="flex flex-row items-center gap-8">
          <Button variant="plain">
            <Feather name="camera" size={20} color="black" />
          </Button>
        </View>
      </View>
      <Button variant="plain" className="flex-row items-center gap-3 mt-4">
        <View className="relative w-10 h-10">
          <Avatar
            imageUrl={user?.imageUrl}
            size={40}
            fontSize={16}
            name={user?.fullName!}
          />
          <View className="absolute -bottom-1 -right-1 w-[22px] h-[22px] rounded-full border-[3px] border-white bg-blue-600 flex items-center justify-center">
            <Feather name="plus" size={14} color="white" />
          </View>
        </View>
        <View>
          <Text className="font-semibold">My Stories</Text>
          <Text className="text-xs text-gray-500">Tap to add</Text>
        </View>
      </Button>
    </Screen>
  );
};

export default StoriesScreen;

