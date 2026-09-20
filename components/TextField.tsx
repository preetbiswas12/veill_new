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
      className="relative px-4 flex-row bg-white items-center justify-between rounded-xl py-3 android:py-0 border border-white"
    >
      {label && (
        <View>
          <Text className="w-[108px] font-medium">{label}</Text>
        </View>
      )}
      <TextInput
        className={clsx(
          'flex-1 placeholder:text-gray-400 text-black',
          className
        )}
        {...otherProps}
      />
    </View>
  );
};

export default TextField;
