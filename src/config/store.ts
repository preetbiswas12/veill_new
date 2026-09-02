import { create } from 'zustand';
import config from './config.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TypeScript interfaces for the config structure
interface ColorConfig {
  brandColor: string;
  primaryTextLight: string;
  primaryTextDark: string;
  secondaryTextLight: string;
  secondaryTextDark: string;
}

interface TypographyConfig {
  font: string;
  size: string;
}

interface StyleConfig {
  theme: string;
  color: ColorConfig;
  typography: TypographyConfig;
}

interface NoCodeStyles {
  buttonBackGround: string;
  buttonShape: string;
  openIcon: string;
  closeIcon: string;
  customJs: string;
  customCss: string;
}

interface NoCodeConfig {
  docked: boolean;
  styles: NoCodeStyles;
}

interface LayoutConfig {
  withSideBar: boolean;
  tabs: string[];
  chatType: string;
}

interface CoreMessagingConfig {
  typingIndicator: boolean;
  threadConversationAndReplies: boolean;
  photosSharing: boolean;
  videoSharing: boolean;
  audioSharing: boolean;
  fileSharing: boolean;
  editMessage: boolean;
  deleteMessage: boolean;
  messageDeliveryAndReadReceipts: boolean;
  userAndFriendsPresence: boolean;
}

interface DeeperEngagementConfig {
  mentions: boolean;
  mentionAll: boolean;
  reactions: boolean;
  messageTranslation: boolean;
  polls: boolean;
  collaborativeWhiteboard: boolean;
  collaborativeDocument: boolean;
  voiceNotes: boolean;
  emojis: boolean;
  stickers: boolean;
  userInfo: boolean;
  groupInfo: boolean;
}

interface AiUserCopilotConfig {
  conversationStarter: boolean;
  conversationSummary: boolean;
  smartReply: boolean;
}

interface GroupManagementConfig {
  createGroup: boolean;
  addMembersToGroups: boolean;
  joinLeaveGroup: boolean;
  deleteGroup: boolean;
  viewGroupMembers: boolean;
}

interface ModeratorControlsConfig {
  kickUsers: boolean;
  banUsers: boolean;
  promoteDemoteMembers: boolean;
  reportMessage: boolean;
}

interface PrivateMessagingConfig {
  sendPrivateMessageToGroupMembers: boolean;
}

interface ChatFeaturesConfig {
  coreMessagingExperience: CoreMessagingConfig;
  deeperUserEngagement: DeeperEngagementConfig;
  aiUserCopilot: AiUserCopilotConfig;
  userManagement: {
    friendsOnly: boolean;
  };
  groupManagement: GroupManagementConfig;
  moderatorControls: ModeratorControlsConfig;
  privateMessagingWithinGroups: PrivateMessagingConfig;
  inAppSounds: {
    incomingMessageSound: boolean;
    outgoingMessageSound: boolean;
  };
}

interface VoiceVideoCallingConfig {
  oneOnOneVoiceCalling: boolean;
  oneOnOneVideoCalling: boolean;
  groupVideoConference: boolean;
  groupVoiceConference: boolean;
}

interface CallFeaturesConfig {
  voiceAndVideoCalling: VoiceVideoCallingConfig;
}

interface SettingsConfig {
  chatFeatures: ChatFeaturesConfig;
  callFeatures: CallFeaturesConfig;
  layout: LayoutConfig;
  style: StyleConfig;
  noCode: NoCodeConfig;
  agent: {
    chatHistory: boolean;
    newChat: boolean;
    agentIcon: string;
    showAgentIcon: boolean;
  };
}

interface AppConfig {
  builderId: string;
  settings: SettingsConfig;
  name: string;
  type: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

// Zustand store interface
interface ConfigStore {
  config: AppConfig;
  updateConfig: (newConfig: Partial<AppConfig>) => void;
  resetConfig: () => void;
}

// Initialize config from storage
const initializeConfig = async (): Promise<AppConfig> => {
  try {
    const savedConfig = await AsyncStorage.getItem('@app_config');
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);

      let actualConfig: AppConfig;
      if (parsedConfig.data && parsedConfig.data.settings) {
        actualConfig = parsedConfig.data as AppConfig;
      } else if (parsedConfig.settings && parsedConfig.builderId) {
        actualConfig = parsedConfig as AppConfig;
      } else {
        return config as AppConfig;
      }

      if (actualConfig && actualConfig.settings && actualConfig.builderId) {
        return actualConfig;
      }
    }
  } catch (error) {
    console.error('Error loading config from storage:', error);
  }
  return config as AppConfig;
};

// Create the Zustand store
export const useConfigStore = create<ConfigStore>((set, _get) => ({
  config: config as AppConfig,

  updateConfig: (newConfig) =>
    set((state) => ({
      config: { ...state.config, ...newConfig },
    })),

  resetConfig: () =>
    set({
      config: config as AppConfig,
    }),
}));

// Initialize the store with saved config if available
initializeConfig().then((initialConfig) => {
  useConfigStore.setState({ config: initialConfig });
}).catch((error) => {
  console.error('Error initializing config:', error);
  useConfigStore.setState({ config: config as AppConfig });
});

export const useConfig = <T>(selector: (state: AppConfig) => T) =>
  useConfigStore((state) => selector(state.config));

// @ts-nocheck

