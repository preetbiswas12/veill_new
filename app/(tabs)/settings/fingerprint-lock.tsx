import { useState, useEffect } from 'react';
import { View, ScrollView, Text, Switch } from 'react-native';
import { alert } from '@/utils/customAlert';
import Colors from '@/constants/Colors';

import { ToggleRow, SectionBlock, PageHeader } from '@/components/SettingsUI';
import OptionSelector from '@/components/OptionSelector';
import StorageService from '@/utils/storage';

const FingerprintLockPage = () => {
  const [enabled, setEnabled] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [autoLock, setAutoLock] = useState('immediately');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await StorageService.getSettings();
      setEnabled(settings.fingerprintLock || false);
      setAutoLock(settings.autoLock || 'immediately');
      setShowNotifications(settings.showNotifications || false);
    };
    loadSettings();
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    await StorageService.updateSetting(key, value);
  };

  const handleAutoLockSelect = async (value: string) => {
    setAutoLock(value);
    setShowContent(false);
    await StorageService.updateSetting('autoLock', value);
  };

  if (!enabled || showContent) {
    return (
      <OptionSelector
        title="Automatically lock"
        description="Choose when to lock Veill"
        options={[
          { label: 'Immediately', value: 'immediately' },
          { label: 'After 1 minute', value: '1min' },
          { label: 'After 30 minutes', value: '30min' },
        ]}
        selected={autoLock}
        onSelect={handleAutoLockSelect}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="Fingerprint lock" />

        <Text style={{ fontSize: 13, color: '#8696A0', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
          Lock Veill with your fingerprint when switching away from the app.
        </Text>

        <SectionBlock marginTop={0}>
          <ToggleRow
            title="Unlock with fingerprint"
            toggle
            toggleValue={enabled}
            onToggle={(val) => {
              if (!val) {
                alert('Disable fingerprint lock?', 'Veill will no longer require fingerprint to open.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Disable', onPress: () => {
                    setEnabled(false);
                    handleToggle('fingerprintLock', false);
                  } },
                ]);
              } else {
                alert('Confirm fingerprint', 'Touch the fingerprint sensor to enable.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'OK', onPress: () => {
                    setEnabled(true);
                    handleToggle('fingerprintLock', true);
                  } },
                ]);
              }
            }}
          />
        </SectionBlock>

        {enabled && (
          <>
            <View style={{ marginTop: 8 }} />
            <SectionBlock marginTop={0}>
              <ToggleRow
                title="Automatically lock"
                value={autoLock === 'immediately' ? 'Immediately' : autoLock === '1min' ? 'After 1 minute' : 'After 30 minutes'}
                onPress={() => setShowContent(true)}
              />
            </SectionBlock>

            <SectionBlock>
              <ToggleRow
                title="Show content in notifications"
                description="Preview message text in notification"
                toggle
                toggleValue={showNotifications}
                onToggle={(val) => {
                  setShowNotifications(val);
                  handleToggle('showNotifications', val);
                }}
              />
            </SectionBlock>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default FingerprintLockPage;

