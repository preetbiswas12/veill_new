import { Feather } from '@expo/vector-icons';
import clsx from 'clsx';
import Button from './Button';

interface SendButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
}

const SendButton = ({ onPress, disabled = false, className }: SendButtonProps) => {
  if (disabled) return null;

  return (
    <Button
      variant="plain"
      onPress={onPress}
      className={clsx('p-0.5 bg-primary rounded-full', className)}
    >
      <Feather name="arrow-up" size={24} color="white" />
    </Button>
  );
};

export default SendButton;
