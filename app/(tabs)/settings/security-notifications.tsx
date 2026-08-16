import { View, ScrollView, Text, Switch, Alert } from 'react-native';
import Colors from '@/constants/Colors';

import { useState } from 'react';
import { ToggleRow, SectionBlock, PageHeader } from '@/components/SettingsUI';

const SecurityNotificationsPage = () => {
  const [showNotifications, setShowNotifications] = useState(true);
  const [showInChat, setShowInChat] = useState(false);

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
            onToggle={setShowNotifications}
          />
          <ToggleRow
            title="Show in chat"
            description="Show security notifications inside chats"
            toggle
            toggleValue={showInChat}
            onToggle={setShowInChat}
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

