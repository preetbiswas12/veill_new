import OptionSelector from '@/components/OptionSelector';
import { useState, useEffect } from 'react';
import StorageService from '@/utils/storage';

const AboutPage = () => {
  const [selected, setSelected] = useState('everyone');

  useEffect(() => {
    const loadAbout = async () => {
      const settings = await StorageService.getSettings();
      setSelected(settings.about || 'everyone');
    };
    loadAbout();
  }, []);

  const handleSelect = async (value: string) => {
    setSelected(value);
    await StorageService.updateSetting('about', value);
  };

  return (
    <OptionSelector
      title="About"
      description="Who can see my About info"
      options={[
        { label: 'Everyone', value: 'everyone' },
        { label: 'My contacts', value: 'contacts' },
        { label: 'My contacts except...', value: 'except', description: 'Choose contacts to exclude' },
        { label: 'Nobody', value: 'nobody' },
      ]}
      selected={selected}
      onSelect={handleSelect}
    />
  );
};

export default AboutPage;
