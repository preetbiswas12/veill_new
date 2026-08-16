import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';

type Option = {
  label: string;
  value: string;
  description?: string;
};

export type OptionSelectorProps = {
  title: string;
  description?: string;
  options: Option[];
  selected: string;
  onSelect: (value: string) => void;
};

const OptionSelector = ({
  title,
  description,
  options,
  selected,
  onSelect,
}: OptionSelectorProps) => {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={{
            backgroundColor: Colors.card,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
          }}>
          <Text style={{ fontSize: 22, fontWeight: '600', color: Colors.text }}>{title}</Text>
        </View>

        {description ? (
          <Text
            style={{
              fontSize: 13,
              color: '#8696A0',
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 6,
            }}>
            {description}
          </Text>
        ) : null}

        <View
          style={{
            backgroundColor: Colors.card,
            borderTopWidth: 0.5,
            borderBottomWidth: 0.5,
            borderColor: Colors.lightGray,
            marginTop: description ? 0 : 0,
          }}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => onSelect(option.value)}
              activeOpacity={0.5}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: Colors.card,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: index < options.length - 1 ? 0.5 : 0,
                  borderBottomColor: Colors.lightGray,
                }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, color: Colors.text }}>{option.label}</Text>
                  {option.description ? (
                    <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>
                      {option.description}
                    </Text>
                  ) : null}
                </View>
                {selected === option.value ? (
                  <Ionicons name="checkmark" size={22} color={Colors.primary} />
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default OptionSelector;
