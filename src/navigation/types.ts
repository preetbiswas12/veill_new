import { NavigatorScreenParams } from '@react-navigation/native';
import { CometChat } from '@cometchat/chat-sdk-react-native';

export type CallType = 'audio' | 'video';

export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  BottomTabNavigator: NavigatorScreenParams<BottomTabParamList>;
  Users: undefined;
  Groups: undefined;
  Conversation: undefined;
  Messages: {
    user?: CometChat.User;
    group?: CometChat.Group;
    fromMention?: boolean;
    fromMessagePrivately?: boolean;
    parentMessageId?: number;
  };
  GroupInfo: {
    group: CometChat.Group;
  };
  AddMember: {
    group: CometChat.Group;
  };
  TransferOwnership: {
    group: CometChat.Group;
  };
  BannedMember: {
    group: CometChat.Group;
  };
  ViewMembers: {
    group: CometChat.Group;
  };
  CallLogs: undefined;
  CallDetails: {
    call: any;
  };
  CallScreen: {
    incoming?: import('../../utils/daily').ActiveCall;
  };
  IncomingCall: {
    call?: import('../../utils/daily').ActiveCall;
  };
  SettingsList: undefined;
  AccountSettings: undefined;
  ThemeSettings: undefined;
  CreateConversation: { type?: 'user' | 'group' };
  ThreadView: {
    message: CometChat.BaseMessage;
    user?: CometChat.User;
    group?: CometChat.Group;
  };
  TransferOwnershipSection: {
    group: CometChat.Group;
  };
  UserInfo: {
    user: CometChat.User;
  };
};

export type BottomTabParamList = {
  Chats: undefined;
  Calls: undefined;
  Users: undefined;
  Groups: undefined;
};
