import clsx from 'clsx';
import { DimensionValue, Text, TextInput, View } from 'react-native';

interface TextFieldProps extends React.ComponentProps<typeof TextInput> {
  width?: DimensionValue;
  label?: string;
}

const TextField = ({
  label,
  width = '100%',
  className,
  ...otherProps
}: TextFieldProps) => {
  return (
    <View
      style={{ width }}
      className="relative px-4 flex-row bg-surface-input items-center justify-between rounded-bubble min-h-[44px]"
    >
      {label && (
        <View>
          <Text className="w-[108px] font-medium text-text-strong">{label}</Text>
        </View>
      )}
      <TextInput
        className={clsx(
          'flex-1 placeholder:text-text-muted text-text-strong',
          className
        )}
        {...otherProps}
      />
    </View>
  );
};

export default TextField;
