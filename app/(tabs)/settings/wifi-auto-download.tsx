import { View, ScrollView, Text, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import { ToggleRow, SectionBlock, PageHeader } from '@/components/SettingsUI';
import StorageService from '@/utils/storage';
import Colors from '@/constants/Colors';

const WifiAutoDownloadPage = () => {
  const [photos, setPhotos] = useState(true);
  const [audio, setAudio] = useState(true);
  const [videos, setVideos] = useState(true);
  const [documents, setDocuments] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await StorageService.getSettings();
      setPhotos(settings.wifiAutoDownloadPhotos ?? true);
      setAudio(settings.wifiAutoDownloadAudio ?? true);
      setVideos(settings.wifiAutoDownloadVideos ?? true);
      setDocuments(settings.wifiAutoDownloadDocuments ?? true);
    };
    loadSettings();
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    await StorageService.updateSetting(key, value);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="When connected on Wi-Fi" />

        <Text style={{ fontSize: 13, color: '#8696A0', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
          Choose which media to auto-download when you are connected to Wi-Fi.
        </Text>

        <SectionBlock marginTop={0}>
          <ToggleRow title="Photos" toggle toggleValue={photos} onToggle={(val) => { setPhotos(val); handleToggle('wifiAutoDownloadPhotos', val); }} />
          <ToggleRow title="Audio" toggle toggleValue={audio} onToggle={(val) => { setAudio(val); handleToggle('wifiAutoDownloadAudio', val); }} />
          <ToggleRow title="Videos" toggle toggleValue={videos} onToggle={(val) => { setVideos(val); handleToggle('wifiAutoDownloadVideos', val); }} />
          <ToggleRow title="Documents" toggle toggleValue={documents} onToggle={(val) => { setDocuments(val); handleToggle('wifiAutoDownloadDocuments', val); }} />
        </SectionBlock>
      </ScrollView>
    </View>
  );
};

export default WifiAutoDownloadPage;
