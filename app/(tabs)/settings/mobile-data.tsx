import { View, ScrollView, Text, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import { ToggleRow, SectionBlock, PageHeader } from '@/components/SettingsUI';
import StorageService from '@/utils/storage';
import Colors from '@/constants/Colors';

const MobileDataPage = () => {
  const [photos, setPhotos] = useState(true);
  const [audio, setAudio] = useState(false);
  const [videos, setVideos] = useState(false);
  const [documents, setDocuments] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await StorageService.getSettings();
      setPhotos(settings.mobileDataPhotos ?? true);
      setAudio(settings.mobileDataAudio ?? false);
      setVideos(settings.mobileDataVideos ?? false);
      setDocuments(settings.mobileDataDocuments ?? false);
    };
    loadSettings();
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    await StorageService.updateSetting(key, value);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="When using mobile data" />

        <Text style={{ fontSize: 13, color: '#8696A0', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
          Choose which media to auto-download when you are connected to mobile data.
        </Text>

        <SectionBlock marginTop={0}>
          <ToggleRow title="Photos" toggle toggleValue={photos} onToggle={(val) => { setPhotos(val); handleToggle('mobileDataPhotos', val); }} />
          <ToggleRow title="Audio" toggle toggleValue={audio} onToggle={(val) => { setAudio(val); handleToggle('mobileDataAudio', val); }} />
          <ToggleRow title="Videos" toggle toggleValue={videos} onToggle={(val) => { setVideos(val); handleToggle('mobileDataVideos', val); }} />
          <ToggleRow title="Documents" toggle toggleValue={documents} onToggle={(val) => { setDocuments(val); handleToggle('mobileDataDocuments', val); }} />
        </SectionBlock>
      </ScrollView>
    </View>
  );
};

export default MobileDataPage;
