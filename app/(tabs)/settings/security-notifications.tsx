import { View, ScrollView, Text, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import { ToggleRow, SectionBlock, PageHeader } from '@/components/SettingsUI';
import StorageService from '@/utils/storage';
import Colors from '@/constants/Colors';

const SecurityNotificationsPage = () => {
  const [showNotifications, setShowNotifications] = useState(true);
  const [showInChat, setShowInChat] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await StorageService.getSettings();
      setShowNotifications(settings.securityNotifications ?? true);
      setShowInChat(settings.securityNotificationsInChat || false);
    };
    loadSettings();
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    await StorageService.updateSetting(key, value);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="Security notifications" />

        <Text style={{ fontSize: 13, color: '#8696A0', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
          Get notified when a contact's security code changes. This helps you verify if a contact's end-to-end encryption has changed.
        </Text>

        <SectionBlock marginTop={0}>
          <ToggleRow
            title="Show security notifications"
            toggle
            toggleValue={showNotifications}
            onToggle={(val) => {
              setShowNotifications(val);
              handleToggle('securityNotifications', val);
            }}
          />
          <ToggleRow
            title="Show in chat"
            description="Show security notifications inside chats"
            toggle
            toggleValue={showInChat}
            onToggle={(val) => {
              setShowInChat(val);
              handleToggle('securityNotificationsInChat', val);
            }}
          />
        </SectionBlock>

        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Text style={{ fontSize: 13, color: '#8696A0' }}>
            When a contact reinstalls the app or switches devices, their security code changes. If you have encryption notifications enabled, you'll be notified of this change in the chat.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default SecurityNotificationsPage;
