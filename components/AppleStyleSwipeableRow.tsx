import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { Component, PropsWithChildren } from 'react';
import { Animated, StyleSheet, Text, View, I18nManager } from 'react-native';

import { RectButton } from 'react-native-gesture-handler';

import Swipeable from 'react-native-gesture-handler/Swipeable';

export type SwipeableAction = 'more' | 'archive' | 'delete';

export interface AppleStyleSwipeableRowProps {
  children?: React.ReactNode;
  onMore?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

export default class AppleStyleSwipeableRow extends Component<PropsWithChildren<AppleStyleSwipeableRowProps>> {
  private renderRightAction = (
    text: string,
    color: string,
    x: number,
    progress: Animated.AnimatedInterpolation<number>,
    onPress?: () => void
  ) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [x, 0],
    });
    const pressHandler = () => {
      this.close();
      onPress?.();
    };

    return (
      <Animated.View style={{ flex: 1, transform: [{ translateX: trans }] }}>
        <RectButton style={[styles.rightAction, { backgroundColor: color }]} onPress={pressHandler}>
          <Ionicons
            name={text === 'More' ? 'ellipsis-horizontal' : text === 'Archive' ? 'archive' : 'trash'}
            size={24}
            color={'#fff'}
            style={{ paddingTop: 10 }}
          />
          <Text style={styles.actionText}>{text}</Text>
        </RectButton>
      </Animated.View>
    );
  };

  private renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragAnimatedValue: Animated.AnimatedInterpolation<number>
  ) => {
    const { onMore, onArchive, onDelete } = this.props;
    return (
      <View
        style={{
          width: 192,
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
        }}>
        {this.renderRightAction('More', '#C8C7CD', 192, progress, onMore)}
        {this.renderRightAction('Archive', Colors.muted, 128, progress, onArchive)}
        {this.renderRightAction('Delete', Colors.red, 64, progress, onDelete)}
      </View>
    );
  };

  private swipeableRow?: Swipeable;

  private updateRef = (ref: Swipeable) => {
    this.swipeableRow = ref;
  };
  private close = () => {
    this.swipeableRow?.close();
  };
  render() {
    const { children } = this.props;
    return (
      <Swipeable
        ref={this.updateRef}
        friction={2}
        enableTrackpadTwoFingerGesture
        rightThreshold={40}
        renderRightActions={this.renderRightActions}
        onSwipeableOpen={(direction) => {
          console.log(`Opening swipeable from the ${direction}`);
        }}
        onSwipeableClose={(direction) => {
          console.log(`Closing swipeable to the ${direction}`);
        }}>
        {children}
      </Swipeable>
    );
  }
}

const styles = StyleSheet.create({
  leftAction: {
    flex: 1,
    backgroundColor: '#497AFC',
    justifyContent: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    backgroundColor: 'transparent',
    padding: 10,
  },
  rightAction: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
