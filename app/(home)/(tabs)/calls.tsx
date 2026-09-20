import { Feather } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import AppMenu from '@/components/AppMenu';
import Button from '@/components/Button';
import Screen from '@/components/Screen';

const CallsScreen = () => {
  return (
    <Screen className="bg-white" viewClassName="px-4 items-start">
      <View className="flex flex-row items-center justify-between w-full h-10">
        <AppMenu />
        <View className="flex flex-row items-center gap-8">
          <Button variant="plain">
            <Feather name="phone" size={20} color="black" />
          </Button>
        </View>
      </View>
      <Button
        variant="plain"
        className="flex flex-row items-center justify-center gap-4 mt-4"
      >
        <Feather name="link" size={20} color="black" />
        <Text className="font-semibold">Create a Call Link</Text>
      </Button>
      <View className="flex-1 w-full flex-col items-center justify-center mt-8">
        <Text className="font-semibold">No recent calls</Text>
        <Text className="text-sm text-gray-600">
          Get started by calling a friend
        </Text>
      </View>
    </Screen>
  );
};

export default CallsScreen;
