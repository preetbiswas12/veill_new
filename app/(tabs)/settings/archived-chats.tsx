import { View, ScrollView, Text, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import { ToggleRow, SectionBlock, PageHeader } from '@/components/SettingsUI';
import StorageService from '@/utils/storage';
import Colors from '@/constants/Colors';

const ArchivedChatsPage = () => {
  const [showArchived, setShowArchived] = useState(false);
  const [keepArchived, setKeepArchived] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await StorageService.getSettings();
      setShowArchived(settings.showArchivedChats || false);
      setKeepArchived(settings.keepArchivedChats ?? true);
    };
    loadSettings();
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    await StorageService.updateSetting(key, value);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="Archived chats" />

        <SectionBlock marginTop={0}>
          <ToggleRow
            title="Keep chats archived"
            description="Archived chats will remain archived when you receive a new message from a chat that is not muted."
            toggle
            toggleValue={keepArchived}
            onToggle={(val) => {
              setKeepArchived(val);
              handleToggle('keepArchivedChats', val);
            }}
          />
          <ToggleRow
            title="Show in chat list"
            description="Show archived chats at the top of the chat list"
            toggle
            toggleValue={showArchived}
            onToggle={(val) => {
              setShowArchived(val);
              handleToggle('showArchivedChats', val);
            }}
          />
        </SectionBlock>
      </ScrollView>
    </View>
  );
};

export default ArchivedChatsPage;
