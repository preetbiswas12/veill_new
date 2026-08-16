import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { alert } from '@/utils/customAlert';
import Colors from '@/constants/Colors';

import { useState } from 'react';
import { SectionBlock, PageHeader } from '@/components/SettingsUI';
import { useRouter } from 'expo-router';

const AddAccountPage = () => {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="Add account" />

        <Text style={{ fontSize: 13, color: '#8696A0', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
          Sign out to log in with a different account.
        </Text>

        <SectionBlock marginTop={0}>
          <View style={{ padding: 16 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                alert('Add Account', 'Sign out and log in with a different account to add another account.');
              }}
              style={{
                backgroundColor: '#00A884',
                borderRadius: 8,
                padding: 14,
                alignItems: 'center',
              }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </SectionBlock>
      </ScrollView>
    </View>
  );
};

export default AddAccountPage;

