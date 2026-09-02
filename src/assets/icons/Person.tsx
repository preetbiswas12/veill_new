import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

const Person: React.FC<{ width?: number; height?: number; color?: string }> = ({ width = 24, height = 24, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
    <Path d="M4 21C4 16.5817 7.58172 13 12 13C16.4183 13 20 16.5817 20 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export default Person;
