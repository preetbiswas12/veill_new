import OptionSelector from '@/components/OptionSelector';
import { useState, useEffect } from 'react';
import StorageService from '@/utils/storage';

const MediaUploadQualityPage = () => {
  const [selected, setSelected] = useState('auto');

  useEffect(() => {
    const loadQuality = async () => {
      const settings = await StorageService.getSettings();
      setSelected(settings.mediaUploadQuality || 'auto');
    };
    loadQuality();
  }, []);

  const handleSelect = async (value: string) => {
    setSelected(value);
    await StorageService.updateSetting('mediaUploadQuality', value);
  };

  return (
    <OptionSelector
      title="Media upload quality"
      description="Higher quality uses more storage and data."
      options={[
        { label: 'Auto (recommended)', value: 'auto', description: 'Balance between quality and data usage' },
        { label: 'Best quality', value: 'best', description: 'Upload media in original quality (uses more data)' },
        { label: 'Data saver', value: 'data_saver', description: 'Use less data when uploading (lower quality)' },
      ]}
      selected={selected}
      onSelect={handleSelect}
    />
  );
};

export default MediaUploadQualityPage;
