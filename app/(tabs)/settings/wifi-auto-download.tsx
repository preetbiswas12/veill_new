import { View, ScrollView, Text, Switch } from 'react-native';
import Colors from '@/constants/Colors';

import { useState } from 'react';
import { ToggleRow, SectionBlock, PageHeader } from '@/components/SettingsUI';

const WifiAutoDownloadPage = () => {
  const [photos, setPhotos] = useState(true);
  const [audio, setAudio] = useState(true);
  const [videos, setVideos] = useState(true);
  const [documents, setDocuments] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="When connected on Wi-Fi" />

        <Text style={{ fontSize: 13, color: '#8696A0', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
          Choose which media to auto-download when you are connected to Wi-Fi.
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

export default WifiAutoDownloadPage;

