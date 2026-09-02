// @ts-nocheck
import React from 'react';
import {
  StyleSheet,
  Platform,
  View,
  TouchableWithoutFeedback,
  Text,
} from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import { useTheme, Icon } from '@cometchat/chat-uikit-react-native';
import { SCREEN_CONSTANTS } from '../utils/AppConstants';
import Chatfill from '../assets/icons/Chatfill';
import Chat from '../assets/icons/Chat';
import PersonFill from '../assets/icons/PersonFill';
import Person from '../assets/icons/Person';
import CallFill from '../assets/icons/CallFill';
import Call from '../assets/icons/Call';
import GroupFill from '../assets/icons/GroupFill';
import Group from '../assets/icons/Group';
import Conversations from '../components/conversations/screens/Conversations';
import Calls from '../components/calls/Calls';
import Users from '../components/users/Users';
import Groups from '../components/groups/Groups';
import { BottomTabParamList } from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

type IconComponentType = React.ComponentType<{
  color?: string;
  height?: number;
  width?: number;
}>;

const icons: Record<
  string,
  { active: IconComponentType; inactive: IconComponentType }
> = {
  Chats: { active: Chatfill, inactive: Chat },
  Users: { active: PersonFill, inactive: Person },
  Calls: { active: CallFill, inactive: Call },
  Groups: { active: GroupFill, inactive: Group },
};

const CustomTabBarButton = ({ children, onPress }: BottomTabBarButtonProps) => (
  <TouchableWithoutFeedback onPress={onPress}>
    <View style={styles.tabButton}>{children}</View>
  </TouchableWithoutFeedback>
);

const BottomTabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Chats"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          { backgroundColor: theme.color.background1 as string },
        ],
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: theme.color.primary as string,
        tabBarInactiveTintColor: theme.color.iconSecondary as string,
        tabBarLabel: ({ focused }) => (
          <Text
            style={[
              styles.tabLabelText,
              {
                color: focused
                  ? (theme.color.primary as string)
                  : (theme.color.iconSecondary as string),
                fontWeight: focused ? '600' : '400',
                fontSize: focused ? 11 : 10,
              },
            ]}
          >
            {route.name}
          </Text>
        ),
        tabBarIcon: ({ focused, color }) => {
          const iconSet = icons[route.name];
          if (!iconSet) return null;

          const IconComponent = focused ? iconSet.active : iconSet.inactive;

          return (
            <Icon
              icon={
                <IconComponent
                  color={color}
                  height={24}
                  width={24}
                />
              }
            />
          );
        },
        tabBarButton: (props) => <CustomTabBarButton {...props} />,
      })}
    >
      <Tab.Screen name="Chats" component={Conversations} />
      <Tab.Screen name="Calls" component={Calls} />
      <Tab.Screen name="Users" component={Users} />
      <Tab.Screen name="Groups" component={Groups} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 84 : 68,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 8,
    borderTopWidth: 0,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  tabItem: {
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  tabLabelText: {
    letterSpacing: 0.2,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BottomTabNavigator;
