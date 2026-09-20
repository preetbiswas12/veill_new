import { ActivityIndicator } from 'react-native';

interface SpinnerProps {
  color?: string;
}

const Spinner = ({ color = '#2c6bed' }: SpinnerProps) => {
  return <ActivityIndicator color={color} />;
};

export default Spinner;
