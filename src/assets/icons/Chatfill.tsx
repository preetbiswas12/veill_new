import React from 'react';
import Svg, { Path } from 'react-native-svg';

const Chatfill: React.FC<{ width?: number; height?: number; color?: string }> = ({ width = 24, height = 24, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path d="M21 11.5C21 16.1944 16.9706 20 12 20C10.5 20 9.07 19.69 7.78 19.14L3 20L4.14 16.36C3.41 14.91 3 13.25 3 11.5C3 6.80558 7.02944 3 12 3C16.9706 3 21 6.80558 21 11.5Z" fill={color} />
  </Svg>
);

export default Chatfill;
