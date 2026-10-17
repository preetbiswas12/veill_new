import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { getError } from '../lib/utils';
import Avatar from './Avatar';
import { useCometChat } from '@/hooks/useCometChat';
import { useTheme } from '@/hooks/useTheme';

/**
 * Account menu used by the design's `Header` component. The trigger is the
 * signed-in avatar; the sheet carries the profile shortcut and sign out.
 */
const AppMenu = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const { user, signOut } = useCometChat();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const avatarRef = useRef<View>(null);

  const toggleMenu = () => {
    if (menuVisible) {
      setMenuVisible(false);
      return;
    }
    if (avatarRef.current) {
      avatarRef.current.measure((_x, _y, _width, height, pageX, pageY) => {
        setMenuPosition({ top: pageY + height + 8, left: Math.max(12, pageX - 8) });
        setMenuVisible(true);
      });
    }
  };

  const goToProfile = () => {
    setMenuVisible(false);
    router.push('/profile');
  };

  const handleSignOut = async () => {
    setMenuVisible(false);
    try {
      await signOut();
      router.replace('/');
    } catch (err) {
      getError(err);
    }
  };

  return (
    <>
      <Pressable
        onPress={toggleMenu}
        ref={avatarRef}
        accessibilityRole="button"
        accessibilityLabel="Account menu"
        hitSlop={8}
        className="active:opacity-60"
      >
        <Avatar imageUrl={user?.image} size={28} fontSize={12} name={user?.name || ''} />
      </Pressable>

      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuVisible(false)}>
          <View
            style={{ top: menuPosition.top, left: menuPosition.left }}
            className="absolute min-w-[200px] rounded-[10px] bg-white border-hair border-separator"
          >
            <Pressable
              onPress={goToProfile}
              accessibilityRole="button"
              className="flex-row items-center justify-between px-4 py-3 border-b-hair border-separator active:bg-surface-muted"
            >
              <Text className="text-body-1 text-text-strong">Profile</Text>
              <Ionicons name="person-outline" size={20} color={colors['text-strong']} />
            </Pressable>
            <Pressable
              onPress={() => void handleSignOut()}
              accessibilityRole="button"
              className="flex-row items-center justify-between px-4 py-3 active:bg-surface-muted"
            >
              <Text className="text-body-1 text-text-error">Sign out</Text>
              <Ionicons name="log-out-outline" size={20} color={colors['text-error']} />
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default AppMenu;