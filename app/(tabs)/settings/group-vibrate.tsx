import OptionSelector from '@/components/OptionSelector';
import { useState, useEffect } from 'react';
import StorageService from '@/utils/storage';

const GroupVibratePage = () => {
  const [selected, setSelected] = useState('default');

  useEffect(() => {
    const loadVibrate = async () => {
      const settings = await StorageService.getSettings();
      setSelected(settings.groupVibrate || 'default');
    };
    loadVibrate();
  }, []);

  const handleSelect = async (value: string) => {
    setSelected(value);
    await StorageService.updateSetting('groupVibrate', value);
  };

  return (
    <OptionSelector
      title="Vibrate"
      description="Choose vibration pattern for groups"
      options={[
        { label: 'Default', value: 'default' },
        { label: 'Short', value: 'short' },
        { label: 'Long', value: 'long' },
        { label: 'Two pulses', value: 'two' },
        { label: 'Three pulses', value: 'three' },
        { label: 'Off', value: 'off' },
      ]}
      selected={selected}
      onSelect={handleSelect}
    />
  );
};

export default GroupVibratePage;
