import OptionSelector from '@/components/OptionSelector';
import { useState, useEffect } from 'react';
import StorageService from '@/utils/storage';
import { useTheme } from '@/contexts/ThemeContext';

const ThemePage = () => {
  const { setTheme } = useTheme();
  const [selected, setSelected] = useState<'light' | 'dark' | 'system'>('dark');

  useEffect(() => {
    const loadTheme = async () => {
      const settings = await StorageService.getSettings();
      setSelected((settings.theme as 'light' | 'dark' | 'system') || 'dark');
    };
    loadTheme();
  }, []);

  const handleSelect = async (value: string) => {
    setSelected(value as 'light' | 'dark' | 'system');
    await StorageService.updateSetting('theme', value);
    setTheme(value as 'light' | 'dark' | 'system');
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
