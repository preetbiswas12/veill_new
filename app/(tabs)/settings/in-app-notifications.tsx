import { useState, useEffect } from 'react';
import { View, ScrollView, Text, Switch, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';

import { ToggleRow, SectionBlock, PageHeader } from '@/components/SettingsUI';
import OptionSelector from '@/components/OptionSelector';
import StorageService from '@/utils/storage';

const InAppNotificationsPage = () => {
  const [highPriority, setHighPriority] = useState(true);
  const [conversationTones, setConversationTones] = useState(true);
  const [popup, setPopup] = useState('screen_off');
  const [showPopupOptions, setShowPopupOptions] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await StorageService.getSettings();
      setHighPriority(settings.highPriorityNotifications);
      setConversationTones(settings.conversationTones);
      setPopup(settings.popupNotification || 'screen_off');
    };
    loadSettings();
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    await StorageService.updateSetting(key, value);
  };

  const handlePopupSelect = async (value: string) => {
    setPopup(value);
    setShowPopupOptions(false);
    await StorageService.updateSetting('popupNotification', value);
  };

  if (showPopupOptions) {
    return (
      <OptionSelector
        title="Popup notification"
        description="Choose how popup notifications are displayed"
        options={[
          { label: 'No popup', value: 'no_popup' },
          { label: 'Only when screen "on"', value: 'screen_on' },
          { label: 'Only when screen "off"', value: 'screen_off' },
          { label: 'Always show popup', value: 'always' },
        ]}
        selected={popup}
        onSelect={handlePopupSelect}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="In-app notifications" />

        <SectionBlock marginTop={0}>
          <ToggleRow
            title="Conversation tones"
            description="Play sounds for incoming messages"
            toggle
            toggleValue={conversationTones}
            onToggle={(val) => {
              setConversationTones(val);
              handleToggle('conversationTones', val);
            }}
          />
          <ToggleRow
            title="Use high priority notifications"
            description="Show notifications at the top"
            toggle
            toggleValue={highPriority}
            onToggle={(val) => {
              setHighPriority(val);
              handleToggle('highPriorityNotifications', val);
            }}
          />
          <ToggleRow
            title="Popup notification"
            value={popup === 'no_popup' ? 'No popup' : popup === 'screen_on' ? 'Screen on' : popup === 'screen_off' ? 'Screen off' : 'Always'}
            onPress={() => setShowPopupOptions(true)}
          />
        </SectionBlock>
      </ScrollView>
    </View>
  );
};

export default InAppNotificationsPage;
