import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { alert } from '@/utils/customAlert';
import Colors from '@/constants/Colors';

import { useState } from 'react';
import { SectionBlock, PageHeader } from '@/components/SettingsUI';
import { Ionicons } from '@expo/vector-icons';

const ChatBackupPage = () => {
  const [lastBackup, setLastBackup] = useState('Never');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [autoBackup, setAutoBackup] = useState('Off');

  const handleBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      const now = new Date();
      setLastBackup(now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setIsBackingUp(false);
      alert('Backup complete', 'Your chats have been backed up.');
    }, 2000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="Chat backup" />

        <SectionBlock marginTop={0}>
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Ionicons name="cloud-upload" size={40} color="#00A884" />
            <Text style={{ fontSize: 14, color: Colors.text, marginTop: 12 }}>Last backup: {lastBackup}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleBackup}
              disabled={isBackingUp}
              style={{
                backgroundColor: '#00A884',
                borderRadius: 8,
                padding: 12,
                paddingHorizontal: 24,
                marginTop: 16,
                opacity: isBackingUp ? 0.6 : 1,
              }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                {isBackingUp ? 'Backing up...' : 'Back up now'}
              </Text>
            </TouchableOpacity>
          </View>
        </SectionBlock>

        <View style={{ marginTop: 8 }} />
        <SectionBlock marginTop={0}>
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={() =>
              alert('Auto backup', 'Choose how often to backup your chats.', [
                { text: 'Daily', onPress: () => setAutoBackup('Daily') },
                { text: 'Weekly', onPress: () => setAutoBackup('Weekly') },
                { text: 'Monthly', onPress: () => setAutoBackup('Monthly') },
                { text: 'Off', onPress: () => setAutoBackup('Off') },
              ])
            }>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: Colors.card,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 0.5,
                borderBottomColor: Colors.lightGray,
              }}>
              <Ionicons name="time" size={22} color="#00A884" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 16, color: Colors.text }}>Auto backup</Text>
              </View>
              <Text style={{ fontSize: 14, color: '#8696A0', marginRight: 4 }}>{autoBackup}</Text>
              <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={() => alert('Google Drive settings', 'Manage your Google Drive backup settings.')}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: Colors.card,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
              <Ionicons name="logo-google" size={22} color="#4285F4" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 16, color: Colors.text }}>Google Drive settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={() => alert('Include videos', 'Choose whether to include videos in your backup.')}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: Colors.card,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
              <Ionicons name="videocam" size={22} color="#00A884" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 16, color: Colors.text }}>Include videos</Text>
                <Text style={{ fontSize: 13, color: '#8696A0', marginTop: 1 }}>Approximately 0 MB</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
            </View>
          </TouchableOpacity>
        </SectionBlock>

        <View style={{ marginTop: 8 }} />
        <SectionBlock marginTop={0}>
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={() =>
              alert('Export chat', 'Export chat without media or with media.', [
                { text: 'Without media', onPress: () => alert('Exporting', 'Chat export started.') },
                { text: 'Include media', onPress: () => alert('Exporting', 'Chat export with media started.') },
                { text: 'Cancel', style: 'cancel' },
              ])
            }>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: Colors.card,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
              <Ionicons name="share" size={22} color="#00A884" />
              <Text style={{ fontSize: 16, color: Colors.text, marginLeft: 12 }}>Export chat</Text>
            </View>
          </TouchableOpacity>
        </SectionBlock>
      </ScrollView>
    </View>
  );
};

export default ChatBackupPage;

