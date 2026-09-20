import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import Button from '@/components/Button';
import Screen from '@/components/Screen';
import TextField from '@/components/TextField';
import useUserForm from '@/hooks/useUserForm';
import { getError } from '@/lib/utils';

const SignInScreen = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const { emailAddress, password, onChangeEmailAddress, onChangePassword } =
    useUserForm();
  const [loading, setLoading] = useState(false);

  const onSignInPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/chats');
      } else {
        alert('State incomplete');
      }
    } catch (err) {
      getError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen viewClassName="pt-10 px-4 gap-4" loadingOverlay={loading}>
      <View className="gap-3">
        <Text className="text-center text-3xl font-semibold">Sign in</Text>
        <Text className="text-center text-base text-gray-500">
          Enter your email address or username and password to sign in.
        </Text>
      </View>
      <TextField
        autoCapitalize="none"
        value={emailAddress}
        placeholder="Enter email or username"
        onChangeText={onChangeEmailAddress}
      />
      <TextField
        value={password}
        placeholder="Enter password"
        secureTextEntry={true}
        onChangeText={onChangePassword}
      />
      <Button onPress={onSignInPress}>Continue</Button>
      <View className="flex-row gap-[3px]">
        <Text>Don&apos;t have an account?</Text>
        <Link href="/sign-up">
          <Text className="text-blue-600">Sign up</Text>
        </Link>
      </View>
    </Screen>
  );
};

export default SignInScreen;

