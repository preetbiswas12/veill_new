import { useSignUp } from '@clerk/clerk-expo';
import clsx from 'clsx';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import Button from '@/components/Button';
import Screen from '@/components/Screen';
import TextField from '@/components/TextField';
import useUserForm from '@/hooks/useUserForm';
import { getError } from '@/lib/utils';

const SignUpScreen = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const {
    firstName,
    lastName,
    username,
    usernameNumber,
    numberError,
    emailAddress,
    password,
    onChangeFirstName,
    onChangeLastName,
    onChangeUsername,
    onChangeNumber,
    onChangeEmailAddress,
    onChangePassword,
  } = useUserForm();
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const onSignUpPress = async () => {
    if (!isLoaded || numberError) return;
    setLoading(true);
    try {
      const finalUsername = `${username}_${usernameNumber}`;
      await signUp.create({
        firstName,
        lastName,
        username: finalUsername,
        emailAddress: emailAddress.toLowerCase(),
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      getError(err);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/chats');
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err) {
      getError(err);
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <Screen viewClassName="pt-10 px-4 gap-4" loadingOverlay={loading}>
        <View className="gap-3">
          <Text className="text-center text-3xl font-semibold">
            Verify email address
          </Text>
          <Text className="text-center text-base text-gray-500">
            Enter the code we sent to {emailAddress.toLowerCase()}
          </Text>
          <Button
            variant="text"
            className="text-base text-blue-600"
            onPress={() => setPendingVerification(false)}
          >
            Wrong email?
          </Button>
        </View>
        <TextField
          value={code}
          placeholder="Enter your verification code"
          keyboardType="numeric"
          onChangeText={(code) => setCode(code)}
        />
        <Button onPress={onVerifyPress}>Verify</Button>
      </Screen>
    );
  }

  return (
    <Screen viewClassName="pt-10 px-4 gap-4" loadingOverlay={loading}>
      <View className="gap-3">
        <Text className="text-center text-3xl font-semibold">Sign up</Text>
        <Text className="text-center text-base text-gray-500">
          Create an account to get started
        </Text>
      </View>
      <View className="gap-3">
        <TextField
          value={firstName}
          placeholder="First name"
          onChangeText={onChangeFirstName}
        />
        <TextField
          value={lastName}
          placeholder="Last name"
          onChangeText={onChangeLastName}
        />
        <View className="relative">
          <TextField
            autoCapitalize="none"
            value={username}
            placeholder="Username"
            onChangeText={onChangeUsername}
            className="pr-12"
          />
          <View className="absolute right-3 top-3 flex-row gap-2">
            <View className="w-0.5 h-5 bg-gray-300" />
            <TextInput
              keyboardType="number-pad"
              maxLength={2}
              value={usernameNumber}
              onChangeText={onChangeNumber}
              className="w-5 h-5 android:w-8 android:h-12 android:bottom-3.5"
            />
          </View>
          <Text
            className={clsx(
              'pl-2 pt-2 text-xs',
              numberError ? 'text-red-500' : 'text-gray-500'
            )}
          >
            {numberError ||
              'Usernames are always paired with a set of numbers.'}
          </Text>
        </View>
        <TextField
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Email address"
          onChangeText={onChangeEmailAddress}
        />
        <TextField
          value={password}
          placeholder="Password"
          secureTextEntry={true}
          onChangeText={onChangePassword}
        />
      </View>
      <Button onPress={onSignUpPress}>Continue</Button>
      <View className="flex-row gap-[3px]">
        <Text>Already have an account?</Text>
        <Link href="/sign-in">
          <Text className="text-blue-600">Sign in</Text>
        </Link>
      </View>
    </Screen>
  );
};

export default SignUpScreen;

