import { useState, useEffect } from 'react';
import { View, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { alert } from '@/utils/customAlert';
import { SectionBlock, PageHeader } from '@/components/SettingsUI';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import StorageService from '@/utils/storage';

const TwoStepVerificationPage = () => {
  const [enabled, setEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await StorageService.getSettings();
      setEnabled(settings.twoStepVerification || false);
      setPin(settings.twoStepPin || '');
    };
    loadSettings();
  }, []);

  const handleEnable = async () => {
    if (pin.length !== 6) {
      alert('Invalid PIN', 'PIN must be 6 digits.');
      return;
    }
    if (pin !== confirmPin) {
      alert('Mismatch', 'PINs do not match.');
      return;
    }
    setEnabled(true);
    await StorageService.updateSetting('twoStepVerification', true);
    await StorageService.updateSetting('twoStepPin', pin);
    alert('Enabled', 'Two-step verification has been enabled.');
  };

  const handleDisable = async () => {
    alert('Disable two-step verification?', 'You will no longer need a PIN to register your phone number with Veill.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disable', style: 'destructive', onPress: async () => { 
        setEnabled(false); 
        setPin(''); 
        setConfirmPin('');
        await StorageService.updateSetting('twoStepVerification', false);
        await StorageService.updateSetting('twoStepPin', '');
      } },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="Two-step verification" />

        <Text style={{ fontSize: 13, color: '#8696A0', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
          For added security, enable two-step verification.
        </Text>

        {!enabled ? (
          <SectionBlock marginTop={0}>
            <View style={{ padding: 16 }}>
              <Text style={{ fontSize: 14, color: Colors.text, marginBottom: 12 }}>
                Enter a 6-digit PIN that you can remember:
              </Text>
              <TextInput
                placeholder="Enter PIN"
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
                value={pin}
                onChangeText={setPin}
                style={{
                  backgroundColor: '#F5F5F5',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  marginBottom: 8,
                }}
              />
              <TextInput
                placeholder="Confirm PIN"
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
                value={confirmPin}
                onChangeText={setConfirmPin}
                style={{
                  backgroundColor: '#F5F5F5',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  marginBottom: 16,
                }}
              />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleEnable}
                style={{
                  backgroundColor: pin.length === 6 && confirmPin.length === 6 ? '#00A884' : '#D1D5DB',
                  borderRadius: 8,
                  padding: 14,
                  alignItems: 'center',
                }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Enable</Text>
              </TouchableOpacity>
            </View>
          </SectionBlock>
        ) : (
          <SectionBlock marginTop={0}>
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Ionicons name="shield-checkmark" size={48} color="#00A884" />
              <Text style={{ fontSize: 16, color: Colors.text, marginTop: 12 }}>Two-step verification is enabled</Text>
              <Text style={{ fontSize: 13, color: '#8696A0', marginTop: 4, textAlign: 'center' }}>
                Two-step verification is active for this account.
              </Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => alert('Change PIN', 'Enter your current PIN, then set a new one.')}
                  style={{
                    flex: 1,
                    backgroundColor: '#F5F5F5',
                    borderRadius: 8,
                    padding: 12,
                    alignItems: 'center',
                  }}>
                  <Text style={{ color: '#00A884', fontSize: 14 }}>Change PIN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleDisable}
                  style={{
                    flex: 1,
                    backgroundColor: '#F5F5F5',
                    borderRadius: 8,
                    padding: 12,
                    alignItems: 'center',
                  }}>
                  <Text style={{ color: Colors.red, fontSize: 14 }}>Disable</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SectionBlock>
        )}
      </ScrollView>
    </View>
  );
};

export default TwoStepVerificationPage;

