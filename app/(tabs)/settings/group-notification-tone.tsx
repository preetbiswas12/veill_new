import OptionSelector from '@/components/OptionSelector';
import { useState, useEffect } from 'react';
import StorageService from '@/utils/storage';

const GroupNotificationTonePage = () => {
  const [selected, setSelected] = useState('default');

  useEffect(() => {
    const loadTone = async () => {
      const settings = await StorageService.getSettings();
      setSelected(settings.groupNotificationTone || 'default');
    };
    loadTone();
  }, []);

  const handleSelect = async (value: string) => {
    setSelected(value);
    await StorageService.updateSetting('groupNotificationTone', value);
  };

  return (
    <OptionSelector
      title="Group notification tone"
      description="Choose a notification tone for group messages"
      options={[
        { label: 'Default (Note)', value: 'default' },
        { label: 'Aurora', value: 'aurora' },
        { label: 'Bamboo', value: 'bamboo' },
        { label: 'Chime', value: 'chime' },
        { label: 'Chords', value: 'chords' },
        { label: 'Circles', value: 'circles' },
        { label: 'Crystal', value: 'crystal' },
        { label: 'Highway', value: 'highway' },
        { label: 'Triage', value: 'triage' },
        { label: 'Xylophone', value: 'xylophone' },
        { label: 'None', value: 'none' },
      ]}
      selected={selected}
      onSelect={handleSelect}
    />
  );
};

export default GroupNotificationTonePage;
