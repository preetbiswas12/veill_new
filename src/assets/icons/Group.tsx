import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

const Group: React.FC<{ width?: number; height?: number; color?: string }> = ({ width = 24, height = 24, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Circle cx="9" cy="8" r="3.5" stroke={color} strokeWidth="2" />
    <Path d="M2 21C2 17.13 4.13 14 9 14C13.87 14 16 17.13 16 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M17 11C18.6569 11 20 9.65685 20 8C20 6.34315 18.6569 5 17 5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M22 19C22 16.5 20.5 14.5 17 14.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export default Group;
