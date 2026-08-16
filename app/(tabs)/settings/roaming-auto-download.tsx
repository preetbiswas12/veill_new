import { View, ScrollView, Text, Switch } from 'react-native';
import Colors from '@/constants/Colors';

import { useState } from 'react';
import { ToggleRow, SectionBlock, PageHeader } from '@/components/SettingsUI';

const RoamingAutoDownloadPage = () => {
  const [photos, setPhotos] = useState(false);
  const [audio, setAudio] = useState(false);
  const [videos, setVideos] = useState(false);
  const [documents, setDocuments] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="When roaming" />

        <Text style={{ fontSize: 13, color: '#8696A0', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
          Choose which media to auto-download when you are roaming. Auto-downloading may incur extra charges.
        </Text>

        <SectionBlock marginTop={0}>
          <ToggleRow title="Photos" toggle toggleValue={photos} onToggle={setPhotos} />
          <ToggleRow title="Audio" toggle toggleValue={audio} onToggle={setAudio} />
          <ToggleRow title="Videos" toggle toggleValue={videos} onToggle={setVideos} />
          <ToggleRow title="Documents" toggle toggleValue={documents} onToggle={setDocuments} />
        </SectionBlock>
      </ScrollView>
    </View>
  );
};

export default RoamingAutoDownloadPage;

