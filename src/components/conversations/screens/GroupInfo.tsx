// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatAvatar, useTheme } from '@cometchat/chat-uikit-react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/types';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Info from '../../../assets/icons/Info';
import { CommonUtils } from '../../../utils/CommonUtils';
import { useConfig } from '../../../config/store';

type Props = StackScreenProps<RootStackParamList, 'GroupInfo'>;

const GroupInfo: React.FC<Props> = ({ route }) => {
  const { group } = route.params;
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [localGroup, setLocalGroup] = useState(group);
  const createGroup = useConfig(
    (state) => state.settings.chatFeatures.groupManagement.createGroup
  );
  const viewGroupMembers = useConfig(
    (state) => state.settings.chatFeatures.groupManagement.viewGroupMembers
  );

  useEffect(() => {
    setLocalGroup(CommonUtils.clone(group));
  }, [group]);

  const handleLeaveGroup = useCallback(async () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await CometChat.leaveGroup(group.getGuid());
              navigation.popToTop();
            } catch (error) {
              console.error('Error leaving group:', error);
            }
          },
        },
      ],
    );
  }, [group, navigation]);

  const handleDeleteGroup = useCallback(async () => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await CometChat.deleteGroup(group.getGuid());
              navigation.popToTop();
            } catch (error) {
              console.error('Error deleting group:', error);
            }
          },
        },
      ],
    );
  }, [group, navigation]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.color.background1 }]}>
      <View style={styles.header}>
        <CometChatAvatar
          name={localGroup.getName()}
          image={undefined}
        />
        <Text style={[styles.groupName, { color: theme.color.textPrimary }]}>
          {localGroup.getName()}
        </Text>
        <Text style={[styles.groupGuid, { color: theme.color.textSecondary }]}>
          {localGroup.getGuid()}
        </Text>
      </View>

      <View style={[styles.section, { borderTopColor: theme.color.borderLight }]}>
        {viewGroupMembers && (
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.color.background1 }]}
            onPress={() => navigation.navigate('ViewMembers', { group })}
          >
            <Info color={theme.color.textPrimary} height={24} width={24} />
            <Text style={[styles.menuText, { color: theme.color.textPrimary }]}>
              View Members
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: theme.color.background1 }]}
          onPress={handleLeaveGroup}
        >
          <Text style={[styles.menuText, { color: theme.color.error }]}>
            Leave Group
          </Text>
        </TouchableOpacity>
        {createGroup && (
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.color.background1 }]}
            onPress={handleDeleteGroup}
          >
            <Text style={[styles.menuText, { color: theme.color.error }]}>
              Delete Group
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  groupName: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
  },
  groupGuid: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    borderTopWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuText: {
    fontSize: 16,
  },
});

export default GroupInfo;

// @ts-nocheck

