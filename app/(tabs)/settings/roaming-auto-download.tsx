import { View, ScrollView, Text, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import { ToggleRow, SectionBlock, PageHeader } from '@/components/SettingsUI';
import StorageService from '@/utils/storage';
import Colors from '@/constants/Colors';

const RoamingAutoDownloadPage = () => {
  const [photos, setPhotos] = useState(false);
  const [audio, setAudio] = useState(false);
  const [videos, setVideos] = useState(false);
  const [documents, setDocuments] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await StorageService.getSettings();
      setPhotos(settings.roamingAutoDownloadPhotos ?? false);
      setAudio(settings.roamingAutoDownloadAudio ?? false);
      setVideos(settings.roamingAutoDownloadVideos ?? false);
      setDocuments(settings.roamingAutoDownloadDocuments ?? false);
    };
    loadSettings();
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    await StorageService.updateSetting(key, value);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="When roaming" />

        <Text style={{ fontSize: 13, color: '#8696A0', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
          Choose which media to auto-download when you are roaming. Auto-downloading may incur extra charges.
        </Text>

        <SectionBlock marginTop={0}>
          <ToggleRow title="Photos" toggle toggleValue={photos} onToggle={(val) => { setPhotos(val); handleToggle('roamingAutoDownloadPhotos', val); }} />
          <ToggleRow title="Audio" toggle toggleValue={audio} onToggle={(val) => { setAudio(val); handleToggle('roamingAutoDownloadAudio', val); }} />
          <ToggleRow title="Videos" toggle toggleValue={videos} onToggle={(val) => { setVideos(val); handleToggle('roamingAutoDownloadVideos', val); }} />
          <ToggleRow title="Documents" toggle toggleValue={documents} onToggle={(val) => { setDocuments(val); handleToggle('roamingAutoDownloadDocuments', val); }} />
        </SectionBlock>
      </ScrollView>
    </View>
  );
};

export default RoamingAutoDownloadPage;
