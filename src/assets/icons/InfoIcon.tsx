import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

const InfoIcon: React.FC<{ width?: number; height?: number; color?: string }> = ({ width = 24, height = 24, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path d="M12 16V12M12 8H12.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export default InfoIcon;
