import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { alert } from '@/utils/customAlert';
import Colors from '@/constants/Colors';

import { SectionBlock, PageHeader } from '@/components/SettingsUI';
import { Ionicons } from '@expo/vector-icons';

const BlockedContactsPage = () => {
  const blocked: Array<{ name: string; phone: string }> = [];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="Blocked contacts" />

        <Text style={{ fontSize: 13, color: '#8696A0', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
          Blocked contacts will not be able to call you or send you messages.
        </Text>

        {blocked.length === 0 ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 20, alignItems: 'center' }}>
            <Ionicons name="ban-outline" size={48} color="#D1D5DB" />
            <Text style={{ fontSize: 14, color: '#8696A0', marginTop: 12 }}>No blocked contacts</Text>
            <Text style={{ fontSize: 13, color: '#8696A0', marginTop: 4, textAlign: 'center' }}>
              To block a contact, go to their profile and tap Block.
            </Text>
          </View>
        ) : (
          <SectionBlock marginTop={0}>
            {blocked.map((contact, index) => (
              <TouchableOpacity
                key={contact.phone}
                activeOpacity={0.5}
                onPress={() =>
                  alert('Unblock ' + contact.name + '?', '', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Unblock', onPress: () => {} },
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
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, color: Colors.text }}>{contact.name}</Text>
                    <Text style={{ fontSize: 13, color: '#8696A0', marginTop: 1 }}>{contact.phone}</Text>
                  </View>
                  <Ionicons name="close-circle" size={22} color="#D1D5DB" />
                </View>
              </TouchableOpacity>
            ))}
          </SectionBlock>
        )}
      </ScrollView>
    </View>
  );
};

export default BlockedContactsPage;

