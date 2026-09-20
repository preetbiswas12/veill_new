import clsx from 'clsx';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  children: React.ReactNode;
  className?: string;
  viewClassName?: string;
  loadingOverlay?: boolean;
}

const Screen = ({
  children,
  className,
  viewClassName,
  loadingOverlay = false,
}: ScreenProps) => {
  return (
    <>
      <SafeAreaView className={clsx('flex-1 android:pt-3', className)}>
        <View className={clsx('flex-1', viewClassName)}>{children}</View>
      </SafeAreaView>
      {loadingOverlay && (
        <View className="absolute inset-0 bg-black/40 items-center justify-center z-50">
          <ActivityIndicator color="white" />
        </View>
      )}
    </>
  );
};

export default Screen;
