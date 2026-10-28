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
        className="active:opacity-70"
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
          {/* Explicit styles: inside a Modal, NativeWind's CSS-variable classes
              do not reliably resolve on Android and render unstyled. */}
          <View
            style={{
              position: 'absolute',
              top: menuPosition.top,
              left: menuPosition.left,
              minWidth: 200,
              borderRadius: 10, // rounded-search
              backgroundColor: colors['surface'],
              borderWidth: 0.5,
              borderColor: colors['separator'],
              overflow: 'hidden',
            }}
          >
            <Pressable
              onPress={goToProfile}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 0.5,
                borderBottomColor: colors['separator'],
                backgroundColor: pressed ? colors['surface-muted'] : 'transparent',
              })}
            >
              <Text style={{ fontSize: 17, lineHeight: 22, color: colors['text-strong'] }}>
                Profile
              </Text>
              <Ionicons name="person-outline" size={20} color={colors['text-strong']} />
            </Pressable>
            <Pressable
              onPress={() => void handleSignOut()}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: pressed ? colors['surface-muted'] : 'transparent',
              })}
            >
              <Text style={{ fontSize: 17, lineHeight: 22, color: colors['text-error'] }}>
                Sign out
              </Text>
              <Ionicons name="log-out-outline" size={20} color={colors['text-error']} />
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default AppMenu;