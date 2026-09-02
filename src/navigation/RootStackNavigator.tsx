// @ts-nocheck
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import BottomTabNavigator from './BottomTabNavigator';
import { SCREEN_CONSTANTS } from '../utils/AppConstants';
import { useTheme } from '@cometchat/chat-uikit-react-native';
import { RootStackParamList } from './types';
import { navigationRef, processPendingNavigation } from './NavigationService';
import SignIn from '../components/login/SignIn';
import SignUp from '../components/login/SignUp';
import ChatList from '../components/conversations/screens/Conversations';
import Messages from '../components/conversations/screens/Messages';
import GroupInfo from '../components/conversations/screens/GroupInfo';
import AddMember from '../components/conversations/screens/AddMember';
import BannedMember from '../components/conversations/screens/BannedMember';
import ViewMembers from '../components/conversations/screens/ViewMembers';
import TransferOwnership from '../components/conversations/screens/TransferOwnership';
import Calls from '../components/calls/Calls';
import CallDetails from '../components/calls/CallDetails';
import CallScreen from '../components/calls/CallScreen';
import IncomingCallScreen from '../components/calls/IncomingCallScreen';
import Users from '../components/users/Users';
import Groups from '../components/groups/Groups';
import SettingsList from '../components/settings/SettingsList';
import AccountSettings from '../components/settings/AccountSettings';
import ThemeSettings from '../components/settings/ThemeSettings';
import { StatusBar, useColorScheme } from 'react-native';

type Props = {
  isLoggedIn: boolean;
  onLogout: () => void;
  currentUser: { uid: string; name: string } | null;
};

const Stack = createStackNavigator<RootStackParamList>();

const RootStackNavigator = ({ isLoggedIn, onLogout, currentUser }: Props) => {
  const theme = useTheme();
  const NavigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.color.background1 as string,
    },
  };

  const isDark = useColorScheme() === 'dark';
  const backgroundColor = theme.color.background2;
  const barStyle = isDark ? 'light-content' : 'dark-content';

  return (
    <>
      <StatusBar
        backgroundColor={backgroundColor}
        barStyle={barStyle}
        translucent={false}
      />
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          processPendingNavigation();
        }}
        theme={NavigationTheme}
      >
        <Stack.Navigator
          initialRouteName={isLoggedIn ? SCREEN_CONSTANTS.BOTTOM_TAB_NAVIGATOR : SCREEN_CONSTANTS.SIGN_IN}
          screenOptions={{
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          {/* Auth Screens */}
          <Stack.Screen name={SCREEN_CONSTANTS.SIGN_IN} component={SignIn} />
          <Stack.Screen name={SCREEN_CONSTANTS.SIGN_UP} component={SignUp} />

          {/* Tab Screens */}
          <Stack.Screen
            name={SCREEN_CONSTANTS.BOTTOM_TAB_NAVIGATOR}
            component={BottomTabNavigator}
          />
          <Stack.Screen name={SCREEN_CONSTANTS.USERS} component={Users} />
          <Stack.Screen name={SCREEN_CONSTANTS.GROUPS} component={Groups} />

          {/* Chat Screens */}
          <Stack.Screen name={SCREEN_CONSTANTS.CONVERSATION} component={ChatList} />
          <Stack.Screen name={SCREEN_CONSTANTS.MESSAGES} component={Messages} />

          {/* Group Management */}
          <Stack.Screen name={SCREEN_CONSTANTS.GROUP_INFO} component={GroupInfo} />
          <Stack.Screen name={SCREEN_CONSTANTS.ADD_MEMBER} component={AddMember} />
          <Stack.Screen
            name={SCREEN_CONSTANTS.TRANSFER_OWNERSHIP}
            component={TransferOwnership}
          />
          <Stack.Screen name={SCREEN_CONSTANTS.BANNED_MEMBER} component={BannedMember} />
          <Stack.Screen name={SCREEN_CONSTANTS.VIEW_MEMBER} component={ViewMembers} />

          {/* Call Screens */}
          <Stack.Screen name={SCREEN_CONSTANTS.CALL_LOGS} component={Calls} />
          <Stack.Screen name={SCREEN_CONSTANTS.CALL_DETAILS} component={CallDetails} />
          <Stack.Screen
            name={SCREEN_CONSTANTS.CALL_SCREEN}
            component={CallScreen}
            options={{ gestureEnabled: false, animation: 'fade' }}
          />
          <Stack.Screen
            name={SCREEN_CONSTANTS.INCOMING_CALL}
            component={IncomingCallScreen}
            options={{ gestureEnabled: false, animation: 'fade' }}
          />

          {/* Settings Screens */}
          <Stack.Screen name={SCREEN_CONSTANTS.SETTINGS_LIST} component={SettingsList} />
          <Stack.Screen
            name={SCREEN_CONSTANTS.ACCOUNT_SETTINGS}
            component={AccountSettings}
          />
          <Stack.Screen
            name={SCREEN_CONSTANTS.THEME_SETTINGS}
            component={ThemeSettings}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default RootStackNavigator;
