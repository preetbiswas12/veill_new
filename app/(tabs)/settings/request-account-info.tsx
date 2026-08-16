import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { alert } from '@/utils/customAlert';
import Colors from '@/constants/Colors';

import { useState } from 'react';
import { SectionBlock, PageHeader } from '@/components/SettingsUI';
import { Ionicons } from '@expo/vector-icons';

const RequestAccountInfoPage = () => {
  const [requested, setRequested] = useState(false);
  const [readyDate, setReadyDate] = useState('');

  const handleRequest = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setReadyDate(formatted);
    setRequested(true);
    alert('Request sent', 'Your account info will be ready by ' + formatted + '. You will be notified when it is ready.');
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="Request account info" />

        <Text style={{ fontSize: 13, color: '#8696A0', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
          Request a report of your Veill account information and settings, which can help you see what information is available to you through Veill.
        </Text>

        <SectionBlock marginTop={0}>
          <View style={{ padding: 16 }}>
            {requested ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="document-text" size={24} color="#00A884" />
                  <Text style={{ fontSize: 16, color: Colors.text, marginLeft: 12 }}>Report requested</Text>
                </View>
                <Text style={{ fontSize: 14, color: '#8696A0', marginBottom: 16 }}>
                  Your report will be ready by {readyDate}. You will receive a notification when it is available for download.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => alert('Cancel request', 'Are you sure?', [
                    { text: 'No', style: 'cancel' },
                    { text: 'Yes', onPress: () => setRequested(false) },
                  ])}
                  style={{
                    backgroundColor: '#F5F5F5',
                    borderRadius: 8,
                    padding: 12,
                    alignItems: 'center',
                  }}>
                  <Text style={{ color: '#00A884', fontSize: 14 }}>Cancel request</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 14, color: Colors.text, marginBottom: 16 }}>
                  Request a report of your account information and settings. This may take a few days to prepare.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleRequest}
                  style={{
                    backgroundColor: '#00A884',
                    borderRadius: 8,
                    padding: 14,
                    alignItems: 'center',
                  }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Request report</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </SectionBlock>
      </ScrollView>
    </View>
  );
};

export default RequestAccountInfoPage;


