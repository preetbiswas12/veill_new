// @ts-nocheck
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatUsers, useTheme } from '@cometchat/chat-uikit-react-native';
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';

type UserNavigationProp = StackNavigationProp<RootStackParamList, 'Users'>;

const Users: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<UserNavigationProp>();
  const [shouldHide, setShouldHide] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setShouldHide(false);
      return () => {
        setShouldHide(true);
      };
    }, []),
  );

  return shouldHide ? null : (
    <View style={{ flex: 1 }}>
      <View style={[styles.header, { backgroundColor: theme.color.background1 as string, borderBottomColor: theme.color.border as string }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: theme.color.primary as string }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.color.textPrimary as string }]}>
          Contacts
        </Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={{ flex: 1, backgroundColor: theme.color.background1 }}>
        <CometChatUsers
          onItemPress={(user: CometChat.User) => {
            navigation.navigate('Messages', { user });
          }}
          usersRequestBuilder={new CometChat.UsersRequestBuilder()
            .setLimit(30)
            .hideBlockedUsers(false)
            .setRoles([])
            .friendsOnly(false)
            .setStatus('')
            .setTags([])
            .sortBy('name')
            .setUIDs([])}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 22,
    fontWeight: '400',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: -0.2,
  },
});

export default Users;
