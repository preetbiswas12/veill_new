import Colors from '@/constants/Colors';
import { Stack } from 'expo-router';
const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Settings', headerShown: false }} />
      <Stack.Screen name="profile-edit" options={{ title: 'Edit Profile', headerShown: false }} />

      {/* Account sub-screens */}
      <Stack.Screen name="account" options={{ title: 'Account', headerShown: false }} />
      <Stack.Screen name="security-notifications" options={{ title: 'Security notifications' }} />
      <Stack.Screen name="two-step-verification" options={{ title: 'Two-step verification' }} />
      <Stack.Screen name="change-number" options={{ title: 'Change number' }} />
      <Stack.Screen name="delete-account" options={{ title: 'Delete my account' }} />

      {/* Privacy sub-screens */}
      <Stack.Screen name="privacy" options={{ title: 'Privacy', headerShown: false }} />
      <Stack.Screen name="last-seen" options={{ title: 'Last seen and online' }} />
      <Stack.Screen name="profile-photo" options={{ title: 'Profile photo' }} />
      <Stack.Screen name="about" options={{ title: 'About' }} />
      <Stack.Screen name="status-privacy" options={{ title: 'Status' }} />
      <Stack.Screen name="blocked-contacts" options={{ title: 'Blocked contacts' }} />
      <Stack.Screen name="fingerprint-lock" options={{ title: 'Fingerprint lock' }} />
      <Stack.Screen name="message-timer" options={{ title: 'Default message timer' }} />

      {/* Chats sub-screens */}
      <Stack.Screen name="chats-settings" options={{ title: 'Chats', headerShown: false }} />
      <Stack.Screen name="theme" options={{ title: 'Theme' }} />
      <Stack.Screen name="wallpaper" options={{ title: 'Wallpaper' }} />
      <Stack.Screen name="font-size" options={{ title: 'Font size' }} />
      <Stack.Screen name="archived-chats" options={{ title: 'Archived chats' }} />

      {/* Notifications sub-screens */}
      <Stack.Screen name="notifications" options={{ title: 'Notifications', headerShown: false }} />
      <Stack.Screen name="notification-tone" options={{ title: 'Notification tone' }} />
      <Stack.Screen name="vibrate" options={{ title: 'Vibrate' }} />
      <Stack.Screen name="popup-notification" options={{ title: 'Popup notification' }} />
      <Stack.Screen name="group-notification-tone" options={{ title: 'Group notification tone' }} />
      <Stack.Screen name="group-vibrate" options={{ title: 'Vibrate' }} />
      <Stack.Screen name="in-app-notifications" options={{ title: 'In-app notifications' }} />

      {/* Storage sub-screens */}
      <Stack.Screen name="storage-and-data" options={{ title: 'Storage and data', headerShown: false }} />
      <Stack.Screen name="manage-storage" options={{ title: 'Manage storage' }} />
      <Stack.Screen name="network-usage" options={{ title: 'Network usage' }} />
      <Stack.Screen name="mobile-data" options={{ title: 'When using mobile data' }} />
      <Stack.Screen name="wifi-auto-download" options={{ title: 'When connected on Wi-Fi' }} />
      <Stack.Screen name="roaming-auto-download" options={{ title: 'When roaming' }} />
      <Stack.Screen name="media-upload-quality" options={{ title: 'Media upload quality' }} />

      {/* Help */}
      <Stack.Screen name="help" options={{ title: 'Help', headerShown: false }} />
    </Stack>
  );
};
export default Layout;

