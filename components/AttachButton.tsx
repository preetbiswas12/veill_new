import { Feather } from '@expo/vector-icons';
import clsx from 'clsx';
import Button from './Button';

interface AttachButtonProps {
  disabled?: boolean;
  onPress?: () => void;
}

const AttachButton = ({ disabled = false, onPress }: AttachButtonProps) => {
  return (
    <Button
      variant="plain"
      disabled={disabled}
      onPress={onPress}
      className={clsx('p-0.5 rotate-[0deg]')}
    >
      <Feather name="plus" size={24} color="black" />
    </Button>
  );
};

export default AttachButton;
