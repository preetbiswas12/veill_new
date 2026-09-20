import { useUser } from '@clerk/clerk-expo';
import { Redirect, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import AppImage from '@/components/AppImage';
import Button from '@/components/Button';
import Screen from '@/components/Screen';

const WelcomeScreen = () => {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return <Redirect href="/chats" />;
  }

  return (
    <Screen
      className="bg-white"
      viewClassName="px-10 pb-10 w-full items-center justify-end gap-16"
    >
      <AppImage
        source={require('@/assets/images/onboarding_splash_Normal.png')}
        className="w-[85%] h-[55%]"
        contentFit="cover"
      />
      <View className="flex items-center gap-4">
        <View className="flex w-full items-center">
          <Text className="text-center text-[28.5px] font-semibold">
            Take privacy with you.
          </Text>
          <Text className="w-[210px] text-center text-[28.5px] font-semibold">
            Be yourself in every message.
          </Text>
        </View>
        <Text className="text-base text-gray-500">Terms & Privacy Policy</Text>
      </View>
      <Button onPress={() => router.navigate('/sign-up')}>Continue</Button>
    </Screen>
  );
};

export default WelcomeScreen;

