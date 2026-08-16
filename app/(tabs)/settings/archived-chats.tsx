import { View, ScrollView, Text, Switch, Alert } from 'react-native';
import Colors from '@/constants/Colors';

import { useState } from 'react';
import { ToggleRow, SectionBlock, PageHeader } from '@/components/SettingsUI';

const ArchivedChatsPage = () => {
  const [showArchived, setShowArchived] = useState(false);
  const [keepArchived, setKeepArchived] = useState(true);

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
            onToggle={setKeepArchived}
          />
          <ToggleRow
            title="Show in chat list"
            description="Show archived chats at the top of the chat list"
            toggle
            toggleValue={showArchived}
            onToggle={setShowArchived}
          />
        </SectionBlock>
      </ScrollView>
    </View>
  );
};

export default ArchivedChatsPage;

