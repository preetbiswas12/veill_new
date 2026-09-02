import React from 'react';
import Svg, { Path } from 'react-native-svg';

const Call: React.FC<{ width?: number; height?: number; color?: string }> = ({ width = 24, height = 24, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path d="M22 16.92V19.92C22 20.4704 21.7893 20.9992 21.4142 21.3742C21.0391 21.7493 20.5104 21.96 19.96 21.96C16.4 21.66 12.97 20.36 10.07 18.18C7.35 16.18 5.13 13.51 3.66 10.4C1.5 7.45 0.6 4 0.95 0.45C0.95 0.39 0.95 0.33 0.95 0.27C0.95 -0.16 1.32 -0.54 1.78 -0.5L5.05 -0.5C5.55 -0.49 5.95 -0.1 6.04 0.39C6.21 1.5 6.51 2.6 6.92 3.65C7.07 4.04 6.96 4.49 6.66 4.78L5.06 6.38C6.66 9.39 8.94 11.66 11.95 13.27L13.55 11.67C13.85 11.37 14.29 11.26 14.69 11.41C15.74 11.82 16.84 12.12 17.95 12.29C18.45 12.37 18.84 12.79 18.83 13.29L22 16.92Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default Call;
