// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@cometchat/chat-uikit-react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dailyCallService from '@/utils/daily';

type Props = StackScreenProps<RootStackParamList, 'CallDetails'>;

const CallDetails: React.FC<Props> = ({ route, navigation }) => {
  const { call } = route.params;
  const theme = useTheme();

  const initiateCall = async () => {
    const peerId = call.peerId || String(call.id);
    const name = call.name || peerId;
    const image = call.img || '';

    await dailyCallService.startOutgoingCall(
      { id: peerId, name, image },
      !!call.video,
    );
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.color.background1 }]}>
      <View style={styles.detailContent}>
        <View style={[styles.avatarContainer, { backgroundColor: theme.color.primary }]}>
          <Text style={styles.avatarText}>
            {(call.name || '?')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.name, { color: theme.color.textPrimary }]}>
          {call.name || 'Unknown'}
        </Text>
        <Text style={[styles.callType, { color: theme.color.textSecondary }]}>
          {call.video ? 'Video' : 'Voice'} Call • {call.incoming ? 'Incoming' : 'Outgoing'}
          {call.missed ? ' • Missed' : ''}
        </Text>
        {call.date && (
          <Text style={[styles.date, { color: theme.color.textSecondary }]}>
            {call.date}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.color.primary }]}
          onPress={initiateCall}
        >
          <Ionicons
            name={call.video ? 'videocam' : 'call'}
            size={24}
            color={theme.color.staticWhite}
          />
          <Text style={[styles.actionText, { color: theme.color.staticWhite }]}>
            {call.video ? 'Video Call' : 'Voice Call'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  detailContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 16,
  },
  callType: {
    fontSize: 14,
    marginTop: 8,
  },
  date: {
    fontSize: 14,
    marginTop: 4,
  },
  actions: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CallDetails;

// @ts-nocheck

