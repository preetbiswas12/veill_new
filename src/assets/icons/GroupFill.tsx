import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

const GroupFill: React.FC<{ width?: number; height?: number; color?: string }> = ({ width = 24, height = 24, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Circle cx="9" cy="8" r="3.5" fill={color} />
    <Path d="M2 21C2 17.13 4.13 14 9 14C13.87 14 16 17.13 16 21" fill={color} />
    <Circle cx="17" cy="8" r="2.5" fill={color} />
    <Path d="M22 19C22 16.5 20.5 14.5 17 14.5" fill={color} />
  </Svg>
);

export default GroupFill;
