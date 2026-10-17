import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import Button from '@/components/Button';
import Screen from '@/components/Screen';
import TextField from '@/components/TextField';
import { useCometChat } from '@/hooks/useCometChat';

/**
 * Identity screen.
 *
 * CometChat has no password auth, so this is deliberately a name and nothing
 * else: the UID is derived from it, the CometChat user is created on first use,
 * and the choice is stored on the device so the app opens straight into the
 * chats next time. Two accounts (alice / bob) are all that is needed to test
 * messaging and calling.
 */
const SignInScreen = () => {
  const router = useRouter();
  const { loginAs, authError } = useCometChat();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const onContinue = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setLocalError('Enter a name to continue');
      return;
    }
    setLocalError(null);
    setSubmitting(true);
    try {
      await loginAs(trimmed);
      // The provider takes it from here; navigating while it initializes would
      // race the session, so let the (home) layout redirect once it is ready.
      router.replace('/chats');
    } catch {
      // `authError` from the provider is rendered below.
    } finally {
      setSubmitting(false);
    }
  };

  const message = localError || authError;

  return (
    <Screen viewClassName="pt-16 px-4 gap-4" loadingOverlay={submitting}>
      <View className="gap-3">
        <Text className="text-center text-3xl font-semibold">veill</Text>
        <Text className="text-center text-base text-gray-500">
          Enter a name to start messaging and calling
        </Text>
      </View>

      <View className="gap-3">
        <TextField
          autoCapitalize="none"
          value={name}
          placeholder="Your name"
          onChangeText={(text) => {
            setName(text);
            if (localError) setLocalError(null);
          }}
          onSubmitEditing={() => void onContinue()}
          returnKeyType="go"
        />
        {message ? <Text className="text-xs text-red-500">{message}</Text> : null}
      </View>

      <Button onPress={() => void onContinue()} disabled={submitting}>
        Continue
      </Button>

      <Text className="text-center text-xs text-gray-500">
        Your CometChat account is created automatically the first time you sign
        in.
      </Text>
    </Screen>
  );
};

export default SignInScreen;