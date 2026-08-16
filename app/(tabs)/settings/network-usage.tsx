import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { alert } from '@/utils/customAlert';
import { SectionBlock, PageHeader } from '@/components/SettingsUI';
import Colors from '@/constants/Colors';

const NetworkUsagePage = () => {
  const stats = [
    { label: 'Calls', value: '45.2 MB' },
    { label: 'Media', value: '1.2 GB' },
    { label: 'Google Drive', value: '234 MB' },
    { label: 'Messages', value: '12.3 MB' },
    { label: 'Status', value: '2.1 MB' },
    { label: 'Roaming', value: '0 MB' },
  ];

  const total = '1.5 GB';

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="Network usage" />

        <Text style={{ fontSize: 13, color: '#8696A0', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
          Total: {total}
        </Text>

        <SectionBlock marginTop={0}>
          {stats.map((stat, index) => (
            <View
              key={stat.label}
              style={{
                flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
                paddingHorizontal: 16, paddingVertical: 14,
                borderBottomWidth: index < stats.length - 1 ? 0.5 : 0, borderBottomColor: Colors.lightGray,
              }}>
              <Text style={{ fontSize: 16, color: Colors.text, flex: 1 }}>{stat.label}</Text>
              <Text style={{ fontSize: 14, color: '#8696A0' }}>{stat.value}</Text>
            </View>
          ))}
        </SectionBlock>

        <TouchableOpacity
          activeOpacity={0.5}
          onPress={() => alert('Reset stats', 'Reset all network usage statistics to zero?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reset', style: 'destructive', onPress: () => alert('Done', 'Network usage stats reset.') },
          ])}
          style={{
            marginHorizontal: 16, marginTop: 16, marginBottom: 40,
            backgroundColor: Colors.card, borderRadius: 8, padding: 14, alignItems: 'center',
            borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: Colors.lightGray,
          }}>
          <Text style={{ color: Colors.red, fontSize: 16 }}>Reset statistics</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default NetworkUsagePage;

