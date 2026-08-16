import OptionSelector from '@/components/OptionSelector';
import { useState, useEffect } from 'react';
import StorageService from '@/utils/storage';

const ThemePage = () => {
  const [selected, setSelected] = useState('light');

  useEffect(() => {
    const loadTheme = async () => {
      const settings = await StorageService.getSettings();
      setSelected(settings.theme);
    };
    loadTheme();
  }, []);

  const handleSelect = async (value: string) => {
    setSelected(value);
    await StorageService.updateSetting('theme', value);
  };

  return (
    <OptionSelector
      title="Theme"
      description="Choose your Veill theme"
      options={[
        { label: 'Light', value: 'light', description: 'Use the light theme' },
        { label: 'Dark', value: 'dark', description: 'Use the dark theme' },
        { label: 'System default', value: 'system', description: 'Match your device settings' },
      ]}
      selected={selected}
      onSelect={handleSelect}
    />
  );
};

export default ThemePage;

