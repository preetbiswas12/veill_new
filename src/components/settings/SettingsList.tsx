// @ts-nocheck
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { SCREEN_CONSTANTS } from '../../utils/AppConstants';
import { useTheme } from '@cometchat/chat-uikit-react-native';

type SettingsNavigationProp = StackNavigationProp<RootStackParamList>;

const SettingsList = () => {
  const navigation = useNavigation<SettingsNavigationProp>();
  const theme = useTheme();

  const settingsItems = [
    { label: 'Account', screen: SCREEN_CONSTANTS.ACCOUNT_SETTINGS as any },
    { label: 'Theme', screen: SCREEN_CONSTANTS.THEME_SETTINGS as any },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.color.background1 as string }]}>
      <Text style={[styles.title, { color: theme.color.primaryText as string }]}>
        Settings
      </Text>
      <ScrollView>
        {settingsItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.item, { borderBottomColor: theme.color.border as string }]}
            onPress={() => navigation.navigate(item.screen as never)}
          >
            <Text style={[styles.itemText, { color: theme.color.primaryText as string }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
  },
  itemText: {
    fontSize: 16,
  },
});

export default SettingsList;

// @ts-nocheck

