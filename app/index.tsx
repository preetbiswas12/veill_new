import { Redirect, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import AppImage from '@/components/AppImage';
import Button from '@/components/Button';
import Screen from '@/components/Screen';
import { useCometChat } from '@/hooks/useCometChat';

const WelcomeScreen = () => {
  const { user, loading } = useCometChat();
  const router = useRouter();

  // Hold the splash while the provider restores any stored identity. `loading`
  // clears when there is no identity too, which is what lets a first-time
  // user reach the login screen instead of hanging on a blank screen.
  if (loading) return null;

  if (user) {
    return <Redirect href="/chats" />;
  }

  return (
    <Screen
      className="bg-surface"
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
        <Text className="text-base text-text-muted">Terms & Privacy Policy</Text>
      </View>
      <Button onPress={() => router.navigate('/sign-in')}>Continue</Button>
    </Screen>
  );
};

export default WelcomeScreen;

