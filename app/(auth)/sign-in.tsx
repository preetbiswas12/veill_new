import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import Screen from '@/components/Screen';
import TextField from '@/components/TextField';
import { useCometChat } from '@/hooks/useCometChat';
import { useTheme } from '@/hooks/useTheme';

/**
 * Identity screen, restyled as the iOS welcome sheet.
 *
 * CometChat has no password auth, so this is deliberately a name and nothing
 * else: the UID is derived from it, the CometChat user is created on first use,
 * and the choice is stored on the device so the app opens straight into the
 * chats next time.
 *
 * Layout is anchored like the iOS welcome: brand block floats from just under
 * the status bar, the form sits in the lower third above the keyboard, and the
 * footnote rides the bottom inset. Everything colours from the theme tokens, so
 * dark mode is native to this screen rather than patched on.
 */
const SignInScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
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
    <Screen className="bg-surface" loadingOverlay={submitting}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View className="flex-1 px-6" style={{ paddingBottom: insets.bottom + 16 }}>
          {/* Brand block: the mark sits just under the status bar on its own
              breathing room, on the app surface colour. */}
          <View style={{ paddingTop: insets.top + 24 }} className="items-center">
            <View
              className="w-16 h-16 rounded-[16px] items-center justify-center"
              style={{ backgroundColor: colors['product'] }}
            >
              <Ionicons name="chatbubbles" size={34} color={colors['text-invert']} />
            </View>
            <Text className="text-display font-bold text-text-strong mt-4">veill</Text>
            <Text className="text-body-2 text-text-muted text-center mt-1">
              Messenger that keeps every photo and video sealed before it leaves
              your phone.
            </Text>
          </View>

          {/* The form in the lower third — where the keyboard can reach it
              without crushing the brand block. */}
          <View className="mt-auto gap-3">
            <TextField
              autoCapitalize="none"
              autoCorrect={false}
              value={name}
              placeholder="Your name"
              placeholderTextColor={colors['text-muted']}
              onChangeText={(text) => {
                setName(text);
                if (localError) setLocalError(null);
              }}
              onSubmitEditing={() => void onContinue()}
              returnKeyType="go"
              accessibilityLabel="Your name"
            />
            {message ? (
              <View className="flex-row items-center gap-1.5 px-1">
                <Ionicons name="alert-circle-outline" size={14} color={colors['text-error']} />
                <Text className="text-caption text-text-error flex-1">{message}</Text>
              </View>
            ) : null}

            <Button onPress={() => void onContinue()} disabled={submitting}>
              Continue
            </Button>

            <Text className="text-caption text-text-muted text-center px-4">
              Your name becomes the account this device signs in as. It is created
              automatically the first time.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

export default SignInScreen;
