import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

const Info: React.FC<{ width?: number; height?: number; color?: string }> = ({ width = 24, height = 24, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path d="M12 8V12M12 16H12.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export default Info;
