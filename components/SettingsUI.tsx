import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

type ToggleRowProps = {
  title: string;
  value?: string;
  description?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
  onPress?: () => void;
  danger?: boolean;
};

export const ToggleRow = ({
  title,
  value,
  description,
  toggle,
  toggleValue,
  onToggle,
  onPress,
  danger,
}: ToggleRowProps) => (
  <TouchableOpacity onPress={onPress} activeOpacity={toggle ? 1 : 0.5} disabled={toggle}>
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
      <View style={{ flex: 1, marginLeft: 0 }}>
        <Text style={{ fontSize: 16, color: danger ? Colors.red : Colors.text }}>{title}</Text>
        {description ? (
          <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>{description}</Text>
        ) : null}
      </View>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ true: '#00A884', false: Colors.lightGray }}
        />
      ) : value ? (
        <Text style={{ fontSize: 14, color: Colors.textSecondary, marginRight: 4 }}>{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      )}
    </View>
  </TouchableOpacity>
);

type SectionBlockProps = {
  children: React.ReactNode;
  marginTop?: number;
};

export const SectionBlock = ({ children, marginTop = 8 }: SectionBlockProps) => (
  <View
    style={{
      backgroundColor: Colors.card,
      borderTopWidth: 0.5,
      borderBottomWidth: 0.5,
      borderColor: Colors.lightGray,
      marginTop,
    }}>
    {children}
  </View>
);

type PageHeaderProps = {
  title: string;
};

export const PageHeader = ({ title }: PageHeaderProps) => (
  <View
    style={{
      backgroundColor: Colors.card,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    }}>
    <Text style={{ fontSize: 22, fontWeight: '600', color: Colors.text }}>{title}</Text>
  </View>
);
