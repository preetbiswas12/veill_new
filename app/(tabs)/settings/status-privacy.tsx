import OptionSelector from '@/components/OptionSelector';
import { useState, useEffect } from 'react';
import StorageService from '@/utils/storage';

const StatusPrivacyPage = () => {
  const [selected, setSelected] = useState('contacts');

  useEffect(() => {
    const loadStatusPrivacy = async () => {
      const settings = await StorageService.getSettings();
      setSelected(settings.statusPrivacy || 'contacts');
    };
    loadStatusPrivacy();
  }, []);

  const handleSelect = async (value: string) => {
    setSelected(value);
    await StorageService.updateSetting('statusPrivacy', value);
  };

  return (
    <OptionSelector
      title="Status"
      description="Who can see my status updates"
      options={[
        { label: 'My contacts', value: 'contacts', description: 'All contacts can see your status updates' },
        { label: 'My contacts except...', value: 'except', description: 'Exclude specific contacts' },
        { label: 'Only share with...', value: 'only', description: 'Share with specific contacts only' },
      ]}
      selected={selected}
      onSelect={handleSelect}
    />
  );
};

export default StatusPrivacyPage;
