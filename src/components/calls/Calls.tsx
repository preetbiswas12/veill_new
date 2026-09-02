// @ts-nocheck
import { CometChatCallLogs, useTheme } from '@cometchat/chat-uikit-react-native';
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { SCREEN_CONSTANTS } from '../../utils/AppConstants';

type CallNavigationProp = StackNavigationProp<RootStackParamList, 'CallLogs'>;

const Calls: React.FC = () => {
  const [shouldHide, setShouldHide] = useState(false);
  const navigation = useNavigation<CallNavigationProp>();
  const theme = useTheme();

  useFocusEffect(
    useCallback(() => {
      setShouldHide(false);
      return () => {
        setShouldHide(true);
      };
    }, []),
  );

  const onItemPress = (item: any) => {
    navigation.navigate('CallDetails', { call: item });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.color.background1 as string }]}>
      {!shouldHide && <CometChatCallLogs onItemPress={onItemPress} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Calls;
