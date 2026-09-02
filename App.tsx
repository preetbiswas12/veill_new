import './gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import {
  Platform,
  View,
  PlatformColor,
  AppState,
  AppStateStatus,
} from 'react-native';
import { enableScreens } from 'react-native-screens';
enableScreens();
import {
  CometChatI18nProvider,
  CometChatIncomingCall,
  CometChatThemeProvider,
  CometChatUIEventHandler,
  CometChatUIEvents,
  CometChatUIKit,
  UIKitSettings,
} from '@cometchat/chat-uikit-react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import RootStackNavigator from './src/navigation/RootStackNavigator';
import { AppConstants } from './src/utils/AppConstants';
import { requestAndroidPermissions } from './src/utils/helper';
import { useAuth } from './src/navigation/AuthContext';
import { cometChatTheme } from './src/utils/theme';
import { initIncomingCalls, getOneSignalPlayerId } from './utils/incomingCalls';
import { registerPushToken } from './utils/onesignal';
import dailyCallService from './utils/daily';

const listenerId = 'app';

const App = (): React.ReactElement => {
  const { isAuthenticated, user, signOut } = useAuth();
  const [callReceived, setCallReceived] = useState(false);
  const incomingCall = useRef<CometChat.Call | CometChat.CustomMessage | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cometChatReady, setCometChatReady] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ uid: string; name: string } | null>(null);
  const theme = cometChatTheme;

  useEffect(() => {
    async function init() {
      try {
        await CometChatUIKit.init({
          appId: AppConstants.appId,
          region: AppConstants.region,
          subscriptionType: CometChat.AppSettings
            .SUBSCRIPTION_TYPE_ALL_USERS as UIKitSettings['subscriptionType'],
        });
        setCometChatReady(true);
      } catch (error) {
        console.log('Error during CometChat init', error);
        setCometChatReady(true);
      } finally {
        setIsInitializing(false);
      }
    }
    init();
  }, []);

  // Handle CometChat login when auth state changes
  useEffect(() => {
    let cancelled = false;

    async function handleAuthChange() {
      if (!cometChatReady) return;
      if (isAuthenticated && user && !isLoggedIn) {
        try {
          const { AuthService } = await import('./utils/auth');
          const cometchatToken = await AuthService.getCometChatAuthToken();
          if (cancelled) return;
          await CometChat.login({
            uid: cometchatToken.cometchatUid,
            authToken: cometchatToken.authToken,
          });
          if (cancelled) return;
          setCurrentUser({
            uid: cometchatToken.cometchatUid,
            name: user.displayName || user.username,
          });
          setIsLoggedIn(true);
        } catch (err) {
          console.log('CometChat token login failed:', err);
        }
      } else if (!isAuthenticated && isLoggedIn) {
        try {
          await CometChat.logout();
        } catch {
          // ignore
        }
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    }

    handleAuthChange();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id, cometChatReady]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      requestAndroidPermissions();
    }
    initIncomingCalls();
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        try {
          const chatUser = await CometChat.getLoggedinUser();
          setIsLoggedIn(!!chatUser);
        } catch (error) {
          console.log('Error verifying CometChat user on resume:', error);
        }
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    CometChat.addLoginListener(
      listenerId,
      new CometChat.LoginListener({
        loginSuccess: () => {
          setUserLoggedIn(true);
        },
        loginFailure: (e: CometChat.CometChatException) => {
          console.log('LoginListener :: loginFailure', e.message);
        },
        logoutSuccess: () => {
          setUserLoggedIn(false);
        },
        logoutFailure: (e: CometChat.CometChatException) => {
          console.log('LoginListener :: logoutFailure', e.message);
        },
      }),
    );

    return () => {
      CometChat.removeLoginListener(listenerId);
    };
  }, []);

  useEffect(() => {
    CometChat.addCallListener(
      listenerId,
      new CometChat.CallListener({
        onIncomingCallReceived: (call: CometChat.Call) => {
          try {
            const activeCall = CometChat.getActiveCall();
            if (activeCall) {
              setTimeout(() => {
                CometChat.rejectCall(
                  call.getSessionId(),
                  CometChat.CALL_STATUS.BUSY,
                ).catch((error) => {
                  console.error('Error rejecting call with busy status:', error);
                });
              }, 2000);
            } else {
              CometChatUIEventHandler.emitUIEvent(
                CometChatUIEvents.ccToggleBottomSheet,
                { isBottomSheetVisible: false },
              );
              incomingCall.current = call;
              setCallReceived(true);
            }
          } catch (error) {
            console.error('Error getting active call:', error);
            CometChatUIEventHandler.emitUIEvent(
              CometChatUIEvents.ccToggleBottomSheet,
              { isBottomSheetVisible: false },
            );
            incomingCall.current = call;
            setCallReceived(true);
          }
        },
        onOutgoingCallRejected: () => {
          incomingCall.current = null;
          setCallReceived(false);
        },
        onIncomingCallCancelled: () => {
          incomingCall.current = null;
          setCallReceived(false);
        },
      }),
    );

    CometChatUIEventHandler.addCallListener(listenerId, {
      ccCallEnded: () => {
        incomingCall.current = null;
        setCallReceived(false);
      },
    });

    return () => {
      CometChatUIEventHandler.removeCallListener(listenerId);
      CometChat.removeCallListener(listenerId);
    };
  }, [userLoggedIn]);

  const handleLogout = async () => {
    await signOut();
  };

  // Register device for push when logged in
  useEffect(() => {
    if (!isLoggedIn || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const playerId = await getOneSignalPlayerId();
        if (!cancelled && playerId) {
          await registerPushToken(user.id || (user as any).username, playerId);
        }
      } catch (err) {
        console.warn('[App] Push registration failed:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, user?.id]);

  if (isInitializing) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Platform.select({
            ios: PlatformColor('systemBackgroundColor'),
            android: PlatformColor('?android:attr/colorBackground'),
          }),
        }}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <CometChatThemeProvider theme={theme as any}>
          <CometChatI18nProvider>
            {isLoggedIn && callReceived && incomingCall.current ? (
              <CometChatIncomingCall
                call={incomingCall.current}
                onDecline={() => {
                  incomingCall.current = null;
                  setCallReceived(false);
                }}
              />
            ) : null}
            <RootStackNavigator
              isLoggedIn={isLoggedIn}
              onLogout={handleLogout}
              currentUser={currentUser}
            />
          </CometChatI18nProvider>
        </CometChatThemeProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default App;






