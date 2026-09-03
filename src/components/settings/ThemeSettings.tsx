// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@cometchat/chat-uikit-react-native';
import { useConfig } from '../../config/store';
import { createTypography } from '../../utils/themeTypography';

const ThemeSettings = () => {
  const theme = useTheme();
  const styleConfig = useConfig((state) => state.settings.style);

  const fonts = ['inter', 'roboto', 'times new roman'];

  return (
    <View style={[styles.container, { backgroundColor: theme.color.background1 as string }]}>
      <Text style={[styles.title, { color: theme.color.primaryText as string }]}>
        Theme Settings
      </Text>
      <ScrollView>
        <View style={[styles.section, { borderBottomColor: theme.color.border as string }]}>
          <Text style={[styles.label, { color: theme.color.primaryText as string }]}>
            Font Family
          </Text>
          {fonts.map((font) => (
            <TouchableOpacity
              key={font}
              style={[
                styles.option,
                styleConfig?.typography?.font === font && {
                  backgroundColor: (theme.color.primary as string) + '20',
                },
              ]}
              onPress={() => {
                // Font selection would update config here
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: styleConfig?.typography?.font === font
                      ? theme.color.primary as string
                      : theme.color.primaryText as string,
                    fontFamily: createTypography(font).fontFamily,
                  },
                ]}
              >
                {font}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
  section: {
    padding: 16,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  option: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
  },
});

export default ThemeSettings;

// @ts-nocheck

