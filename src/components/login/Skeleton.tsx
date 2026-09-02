// @ts-nocheck
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@cometchat/chat-uikit-react-native';

const Skeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.skeletonItem,
            { backgroundColor: theme.color.background3 },
          ]}
        >
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.color.background4 },
            ]}
          />
          <View
            style={[
              styles.textLine,
              { backgroundColor: theme.color.background4 },
            ]}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  skeletonItem: {
    width: '30%',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 12,
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  textLine: {
    width: '80%',
    height: 12,
    borderRadius: 4,
  },
});

export default Skeleton;

// @ts-nocheck

