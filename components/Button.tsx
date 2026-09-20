import clsx from 'clsx';
import { Text, TouchableOpacity } from 'react-native';

interface ButtonProps extends React.ComponentProps<typeof TouchableOpacity> {
  onPress?: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: 'plain' | 'default' | 'text';
}

const Button = ({
  onPress,
  children,
  className,
  variant = 'default',
  ...otherProps
}: ButtonProps) => {
  if (variant === 'plain')
    return (
      <TouchableOpacity
        className={clsx('w-fit h-fit', className)}
        onPress={onPress}
        {...otherProps}
      >
        {children}
      </TouchableOpacity>
    );

  return (
    <TouchableOpacity
      className={clsx(
        variant === 'default' &&
          'bg-blue-600 rounded-[13px] justify-center items-center px-4 py-4 w-full',
        variant === 'text' && 'bg-transparent justify-center items-center',
        otherProps.disabled && 'opacity-50',
        variant !== 'text' && className
      )}
      onPress={onPress}
      {...otherProps}
    >
      <Text
        className={clsx(
          variant === 'default' && 'text-[17px] font-medium text-white',
          variant === 'text' && 'text-sm text-black',
          variant === 'text' && className
        )}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
};

export default Button;
