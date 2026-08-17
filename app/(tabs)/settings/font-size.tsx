import { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { SectionBlock, PageHeader } from '@/components/SettingsUI';
import { Ionicons } from '@expo/vector-icons';
import StorageService from '@/utils/storage';
import Colors from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

const sizes = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
  { label: 'Very large', value: 'xlarge' },
];

const sizeValues = {
  small: 13,
  medium: 16,
  large: 19,
  xlarge: 22,
};

const FontSizePage = () => {
  const { fontSize, fontSizeValue, setFontSize } = useTheme();
  const [selected, setSelected] = useState(fontSize);

  useEffect(() => {
    const loadFontSize = async () => {
      const settings = await StorageService.getSettings();
      const size = settings.fontSize || 'medium';
      setSelected(size);
    };
    loadFontSize();
  }, []);

  const handleSelect = async (value: string) => {
    setSelected(value as 'small' | 'medium' | 'large' | 'xlarge');
    await setFontSize(value as 'small' | 'medium' | 'large' | 'xlarge');
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="Font size" />

        <SectionBlock marginTop={8}>
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 13, color: '#8696A0', marginBottom: 16 }}>
              {sizes.find((s) => s.value === selected)?.label || 'Medium'}
            </Text>

            <View style={{ backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, minHeight: 100 }}>
              <Text style={{ fontSize: fontSizeValue, color: Colors.text, marginBottom: 8 }}>
                The quick brown fox jumps over the lazy dog
              </Text>
              <Text style={{ fontSize: fontSizeValue, color: '#8696A0' }}>
                This is a preview of how your messages will appear with this font size.
              </Text>
            </View>
          </View>
        </SectionBlock>

        <SectionBlock marginTop={8}>
          {sizes.map((size) => (
            <TouchableOpacity
              key={size.value}
              activeOpacity={0.5}
              onPress={() => handleSelect(size.value)}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: Colors.card,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: 0.5,
                  borderBottomColor: Colors.lightGray,
                }}>
                <Text style={{ flex: 1, fontSize: 16, color: Colors.text }}>{size.label}</Text>
                {selected === size.value ? (
                  <Ionicons name="checkmark" size={22} color="#00A884" />
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </SectionBlock>
      </ScrollView>
    </View>
  );
};

export default FontSizePage;
