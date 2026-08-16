import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { alert } from '@/utils/customAlert';
import Colors from '@/constants/Colors';

import { Ionicons } from '@expo/vector-icons';
import { SectionBlock, PageHeader } from '@/components/SettingsUI';

const PasskeysPage = () => {
  const passkeys = [
    { id: '1', name: 'Android Device', created: 'Jan 15, 2024', lastUsed: '2 hours ago' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="Passkeys" />

        <Text style={{ fontSize: 13, color: '#8696A0', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
          Passkeys let you sign in with your screen lock or biometric instead of a PIN code.
        </Text>

        <SectionBlock marginTop={0}>
          {passkeys.map((passkey, index) => (
            <TouchableOpacity
              key={passkey.id}
              activeOpacity={0.5}
              onPress={() =>
                alert('Passkey Details', 'Device: ' + passkey.name + '\nCreated: ' + passkey.created + '\nLast used: ' + passkey.lastUsed, [
                  { text: 'Remove', style: 'destructive', onPress: () => alert('Removed', 'Passkey removed.') },
                  { text: 'OK' },
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
                <Ionicons name="finger-print" size={22} color="#00A884" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 16, color: Colors.text }}>{passkey.name}</Text>
                  <Text style={{ fontSize: 13, color: '#8696A0', marginTop: 1 }}>
                    Last used: {passkey.lastUsed}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
              </View>
            </TouchableOpacity>
          ))}
        </SectionBlock>

        <TouchableOpacity
          activeOpacity={0.5}
          onPress={() =>
            alert('Create a passkey', 'A passkey lets you use your screen lock or biometric to log in to Veill.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Create', onPress: () => alert('Success', 'Passkey created successfully.') },
            ])
          }>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: Colors.card,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginTop: 8,
              borderTopWidth: 0.5,
              borderBottomWidth: 0.5,
              borderColor: Colors.lightGray,
            }}>
            <Ionicons name="add-circle" size={22} color="#00A884" />
            <Text style={{ fontSize: 16, color: '#00A884', marginLeft: 12 }}>Create passkey</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default PasskeysPage;


