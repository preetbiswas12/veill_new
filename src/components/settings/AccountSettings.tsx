// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@cometchat/chat-ui-kit-react-native';

const AccountSettings = () => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.color.background1 as string }]}>
      <Text style={[styles.title, { color: theme.color.primaryText as string }]}>
        Account Settings
      </Text>
      <ScrollView>
        <View style={[styles.section, { borderBottomColor: theme.color.border as string }]}>
          <Text style={[styles.label, { color: theme.color.primaryText as string }]}>
            Profile
          </Text>
          <Text style={[styles.value, { color: theme.color.secondaryText as string }]}>
            Manage your profile information
          </Text>
        </View>
        <View style={[styles.section, { borderBottomColor: theme.color.border as string }]}>
          <Text style={[styles.label, { color: theme.color.primaryText as string }]}>
            Privacy
          </Text>
          <Text style={[styles.value, { color: theme.color.secondaryText as string }]}>
            Control your privacy settings
          </Text>
        </View>
        <View style={[styles.section, { borderBottomColor: theme.color.border as string }]}>
          <Text style={[styles.label, { color: theme.color.primaryText as string }]}>
            Security
          </Text>
          <Text style={[styles.value, { color: theme.color.secondaryText as string }]}>
            Password and authentication
          </Text>
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
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
  },
});

export default AccountSettings;

// @ts-nocheck

