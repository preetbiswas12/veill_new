import { ActivityIndicator } from 'react-native';

interface SpinnerProps {
  color?: string;
}

const Spinner = ({ color = '#1dab61' }: SpinnerProps) => {
  return <ActivityIndicator color={color} />;
};

export default Spinner;
