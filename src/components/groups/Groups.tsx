// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  CometChatGroups,
  useTheme,
} from '@cometchat/chat-uikit-react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { RootStackParamList } from '../../navigation/types';
import { useConfig } from '../../config/store';

type GroupNavigationProp = StackNavigationProp<RootStackParamList, 'Groups'>;

const Groups: React.FC = () => {
  const createGroup = useConfig(
    (state) => state.settings.chatFeatures.groupManagement.createGroup
  );
  const theme = useTheme();
  const navigation = useNavigation<GroupNavigationProp>();
  const [shouldHide, setShouldHide] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setShouldHide(false);
      return () => {
        setShouldHide(true);
      };
    }, [navigation]),
  );

  const handleGroupItemPress = (group: CometChat.Group) => {
    if (group.getHasJoined()) {
      navigation.navigate('Messages', { group });
      return;
    }
    if (group.getType() === CometChat.GROUP_TYPE.PUBLIC) {
      joinPublicGroup(group);
    }
  };

  const joinPublicGroup = async (group: CometChat.Group) => {
    try {
      const joinedGroup = await CometChat.joinGroup(
        group.getGuid(),
        group.getType() as CometChat.GroupType,
        '',
      );
      navigation.navigate('Messages', { group: joinedGroup });
    } catch (error) {
      console.log('Error joining public group:', error);
    }
  };

  if (shouldHide) return null;

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.header, { backgroundColor: theme.color.background1 as string, borderBottomColor: theme.color.border as string }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: theme.color.primary as string }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.color.textPrimary as string }]}>
          Groups
        </Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={{ flex: 1, backgroundColor: theme.color.background1 }}>
        <CometChatGroups
          onItemPress={handleGroupItemPress}
          hideHeader={true}
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
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
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

export default Groups;
