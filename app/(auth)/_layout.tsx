import { Redirect, Stack } from 'expo-router';

import { useCometChat } from '@/hooks/useCometChat';

const AuthLayout = () => {
  const { user, loading } = useCometChat();

  // While the provider restores a stored identity, render nothing so the login
  // screen does not flash for returning users. `loading` also clears when there
  // is no identity at all - that is the first-time path into this screen.
  if (loading) return null;

  if (user) {
    return <Redirect href={'/chats'} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
    </Stack>
  );
};

export default AuthLayout;