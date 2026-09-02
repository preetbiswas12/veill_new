// @ts-nocheck
import { CometChat } from '@cometchat/chat-sdk-react-native';
import React, { useCallback, useContext, useRef, useState } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import {
  CometChatAvatar,
  CometChatConversations,
  useTheme,
} from '@cometchat/chat-uikit-react-native';
import { AuthContext } from '../../../navigation/AuthContext';
import {
  useFocusEffect,
  useNavigation,
  CommonActions,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/types';
import { navigate, navigationRef } from '../../../navigation/NavigationService';
import { SCREEN_CONSTANTS } from '../../../utils/AppConstants';

type ChatNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Conversation'
>;

const Conversations: React.FC<{}> = ({}) => {
  const theme = useTheme();
  const { setIsLoggedIn: setLogout } = useContext(AuthContext);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuAnchor = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const navigation = useNavigation<ChatNavigationProp>();
  const avatarRef = useRef<View>(null);
  const loggedInUser = useRef<CometChat.User>(
    CometChatUIKit.loggedInUser,
  ).current;
  const [shouldHide, setShouldHide] = React.useState(false);
  const messageDeliveryAndReadReceipts = true;
  const userAndFriendsPresence = true;

  useFocusEffect(
    useCallback(() => {
      setShouldHide(false);
      return () => {
        setShouldHide(true);
        setShowMenu(false);
      };
    }, []),
  );

  const openMessagesFor = (item: CometChat.Conversation) => {
    const isUser = item.getConversationType() === 'user';
    const isGroup = item.getConversationType() === 'group';

    navigation.navigate('Messages', {
      user: isUser ? (item.getConversationWith() as CometChat.User) : undefined,
      group: isGroup
        ? (item.getConversationWith() as CometChat.Group)
        : undefined,
    });
  };

  const conversationsConfig = {
    onItemPress: openMessagesFor,
    onError: (err: any) => {
      console.log('ERROR IN CONVO: ', err);
    },
  };

  const handleAvatarPress = () => {
    try {
      if (avatarRef.current) {
        avatarRef.current.measureInWindow((x, y, _w, h) => {
          menuAnchor.current = { x, y, w: _w, h };
          setShowMenu(true);
        });
      }
    } catch (error) {
      console.error('Error while handling avatar press:', error);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setShowMenu(false);

    try {
      await CometChat.logout();
    } catch (error) {
      console.error('CometChat logout failed:', error);
      setIsLoggingOut(false);
      return;
    }

    setIsLoggingOut(false);
    setLogout(false);
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: SCREEN_CONSTANTS.SIGN_IN }],
      }),
    );
  };

  const Header = () => (
    <View style={[styles.header, { backgroundColor: theme.color.background1 }]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          ref={avatarRef}
          onPress={handleAvatarPress}
          activeOpacity={0.7}
        >
          <CometChatAvatar
            style={{
              containerStyle: {
                height: 38,
                width: 38,
                borderRadius: 19,
                overflow: 'hidden',
              },
              textStyle: {
                fontSize: 18,
                fontWeight: '600',
                color: theme.color.primary as string,
              },
            }}
            image={
              loggedInUser?.getAvatar()
                ? { uri: loggedInUser?.getAvatar() }
                : undefined
            }
            name={loggedInUser?.getName() ?? 'U'}
          />
        </TouchableOpacity>
      </View>
      <Text style={[styles.headerTitle, { color: theme.color.textPrimary as string }]}>
        Veill
      </Text>
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation.navigate('Users')}
        >
          <Text style={[styles.headerIconText, { color: theme.color.textPrimary as string }]}>
            +
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
          />
          <View
            style={[
              styles.dropdown,
              {
                top: menuAnchor.current.h + 8,
                right: 0,
                backgroundColor: theme.color.background2,
                borderColor: theme.color.borderDefault,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.color.border }]}
              onPress={() => {
                setShowMenu(false);
                navigation.navigate('SettingsList');
              }}
            >
              <Text style={[styles.menuItemText, { color: theme.color.textPrimary as string }]}>
                Settings
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleLogout}
              disabled={isLoggingOut}
            >
              <Text style={[styles.menuItemText, { color: theme.color.error as string }]}>
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  return shouldHide ? null : (
    <View style={{ flex: 1 }}>
      <Header />
      <View style={{ flex: 1 }}>
        <CometChatConversations
          {...conversationsConfig}
          AppBarOptions={null}
          selectionMode="none"
          usersStatusVisibility={userAndFriendsPresence}
          receiptsVisibility={messageDeliveryAndReadReceipts}
          hideSearchBar={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  headerIconText: {
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 24,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
  },
  dropdown: {
    position: 'absolute',
    zIndex: 999,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 180,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

export default Conversations;
