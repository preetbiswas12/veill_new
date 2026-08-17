import { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import { SectionBlock, PageHeader } from '@/components/SettingsUI';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import StorageService from '@/utils/storage';

const NetworkUsagePage = () => {
  const [stats, setStats] = useState([
    { label: 'Calls', value: '0 MB', key: 'calls' },
    { label: 'Media', value: '0 MB', key: 'media' },
    { label: 'Messages', value: '0 MB', key: 'messages' },
    { label: 'Status', value: '0 MB', key: 'status' },
    { label: 'Roaming', value: '0 MB', key: 'roaming' },
  ]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const settings = await StorageService.getSettings();
      const updated = stats.map((stat) => ({
        ...stat,
        value: settings.networkUsage?.[stat.key] || '0 MB',
      }));
      setStats(updated);
    } catch {
      // ignore
    }
  };

  const total = stats.reduce((sum, stat) => {
    const val = parseFloat(stat.value) || 0;
    return sum + val;
  }, 0);

  const handleReset = () => {
    Alert.alert('Reset stats', 'Reset all network usage statistics to zero?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          const zeroStats: Record<string, string> = {};
          stats.forEach((stat) => {
            zeroStats[stat.key] = '0 MB';
          });
          await StorageService.updateSetting('networkUsage', zeroStats);
          await loadStats();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="Network usage" />

        <Text style={{ fontSize: 13, color: '#8696A0', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
          Total: {total.toFixed(1)} MB
        </Text>

        <SectionBlock marginTop={0}>
          {stats.map((stat, index) => (
            <View
              key={stat.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: Colors.card,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: index < stats.length - 1 ? 0.5 : 0,
                borderBottomColor: Colors.lightGray,
              }}>
              <Text style={{ fontSize: 16, color: Colors.text, flex: 1 }}>{stat.label}</Text>
              <Text style={{ fontSize: 14, color: '#8696A0' }}>{stat.value}</Text>
            </View>
          ))}
        </SectionBlock>

        <TouchableOpacity
          activeOpacity={0.5}
          onPress={handleReset}
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            marginBottom: 40,
            backgroundColor: Colors.card,
            borderRadius: 8,
            padding: 14,
            alignItems: 'center',
            borderTopWidth: 0.5,
            borderBottomWidth: 0.5,
            borderColor: Colors.lightGray,
          }}>
          <Text style={{ color: Colors.red, fontSize: 16 }}>Reset statistics</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default NetworkUsagePage;
