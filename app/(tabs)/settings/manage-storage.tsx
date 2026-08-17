import { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import { SectionBlock, PageHeader } from '@/components/SettingsUI';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import StorageService from '@/utils/storage';

const ManageStoragePage = () => {
  const [cacheSize, setCacheSize] = useState('Calculating...');
  const [mediaSize, setMediaSize] = useState('0 MB');
  const [chatSize, setChatSize] = useState('0 MB');

  useEffect(() => {
    calculateStorage();
  }, []);

  const calculateStorage = async () => {
    try {
      const chats = await StorageService.getChats();
      let chatBytes = 0;
      for (const chat of chats) {
        chatBytes += JSON.stringify(chat).length;
      }
      setChatSize(formatBytes(chatBytes));

      const auth = await StorageService.getAuth();
      let authBytes = 0;
      if (auth) {
        authBytes = JSON.stringify(auth).length;
      }
      const settings = await StorageService.getSettings();
      let settingsBytes = JSON.stringify(settings).length;

      const totalBytes = chatBytes + authBytes + settingsBytes;
      setCacheSize(formatBytes(totalBytes));
      setMediaSize('0 MB');
    } catch {
      setCacheSize('Unknown');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleClearCache = () => {
    Alert.alert('Clear cache?', 'This will clear app cache including temporary files.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            const chats = await StorageService.getChats();
            for (const chat of chats) {
              if (chat.messages) {
                chat.messages = [];
              }
            }
            await StorageService.saveChats(chats);
            await calculateStorage();
            Alert.alert('Done', 'Cache cleared successfully.');
          } catch {
            Alert.alert('Error', 'Failed to clear cache.');
          }
        },
      },
    ]);
  };

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="Manage storage" />

        <SectionBlock marginTop={0}>
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 36, fontWeight: '700', color: Colors.text }}>{cacheSize}</Text>
            <Text style={{ fontSize: 14, color: '#8696A0', marginTop: 4 }}>Total storage used</Text>
            <TouchableOpacity
              onPress={handleClearCache}
              style={{
                marginTop: 16,
                backgroundColor: Colors.red,
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderRadius: 20,
              }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Clear cache</Text>
            </TouchableOpacity>
          </View>
        </SectionBlock>

        <View style={{ marginTop: 8 }} />
        <SectionBlock marginTop={0}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: Colors.lightGray }}>
            <Ionicons name="chatbubbles" size={22} color="#00A884" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 16, color: Colors.text }}>Chats</Text>
            </View>
            <Text style={{ fontSize: 14, color: '#8696A0', marginRight: 4 }}>{chatSize}</Text>
          </View>
          <View style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="image" size={22} color="#00A884" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 16, color: Colors.text }}>Media</Text>
            </View>
            <Text style={{ fontSize: 14, color: '#8696A0', marginRight: 4 }}>{mediaSize}</Text>
          </View>
        </SectionBlock>

        <View style={{ marginTop: 8 }} />
        <SectionBlock marginTop={0}>
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={handleOpenSettings}
            style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="settings" size={22} color="#00A884" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 16, color: Colors.text }}>Open system app settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
          </TouchableOpacity>
        </SectionBlock>
      </ScrollView>
    </View>
  );
};

export default ManageStoragePage;
