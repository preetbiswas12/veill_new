import { View, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { alert } from '@/utils/customAlert';
import { useState } from 'react';
import { SectionBlock, PageHeader } from '@/components/SettingsUI';
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';

const DeleteAccountPage = () => {
  const router = useRouter();
  const [reason, setReason] = useState('');

  const reasons = [
    'I am changing my device',
    'I am changing my identity',
    'I am deleting my account',
    'Other',
  ];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="Delete my account" />

        <Text style={{ fontSize: 13, color: '#8696A0', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
          Deleting your account is permanent. You will not be able to recover your account or data.
        </Text>

        <SectionBlock marginTop={0}>
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 14, color: Colors.text, fontWeight: '500', marginBottom: 8 }}>
              Why are you deleting your account? (optional)
            </Text>
            {reasons.map((r) => (
              <TouchableOpacity
                key={r}
                activeOpacity={0.5}
                onPress={() => setReason(r)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                }}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: reason === r ? '#00A884' : '#D1D5DB',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}>
                  {reason === r && (
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#00A884' }} />
                  )}
                </View>
                <Text style={{ fontSize: 15, color: Colors.text }}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionBlock>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            alert(
              'Delete account?',
              'This action is permanent and cannot be undone. All your messages, media, and account data will be deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    alert('Account deleted', 'Your account has been deleted.', [
                      { text: 'OK', onPress: () => router.replace('/') },
                    ]);
                  },
                },
              ]
            );
          }}
          style={{
            marginHorizontal: 16,
            marginTop: 8,
            backgroundColor: Colors.red,
            borderRadius: 8,
            padding: 14,
            alignItems: 'center',
          }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Delete account</Text>
        </TouchableOpacity>

        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}>
          <Text style={{ fontSize: 13, color: '#8696A0' }}>
            Deleting your account will:
          </Text>
          <Text style={{ fontSize: 13, color: '#8696A0', marginTop: 4 }}>
            - Delete your account info and profile photo
          </Text>
          <Text style={{ fontSize: 13, color: '#8696A0', marginTop: 2 }}>
            - Delete you from all groups
          </Text>
          <Text style={{ fontSize: 13, color: '#8696A0', marginTop: 2 }}>
            - Delete your message history
          </Text>
          <Text style={{ fontSize: 13, color: '#8696A0', marginTop: 2 }}>
            - Erase your backup
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default DeleteAccountPage;

