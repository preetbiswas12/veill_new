import clsx from 'clsx';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

interface ScreenProps {
  children: React.ReactNode;
  className?: string;
  viewClassName?: string;
  loadingOverlay?: boolean;
  /**
   * Which safe-area edges this screen handles itself.
   *
   * Screens that draw a `ScreenHeader` pass `['left','right','bottom']` so the
   * header owns the top inset. Leaving the default pads the top *and* adds the
   * old `android:pt-3`, which stacks with the header and pushes it ~54pt too
   * far down the screen.
   */
  edges?: readonly Edge[];
}

const Screen = ({
  children,
  className,
  viewClassName,
  loadingOverlay = false,
  edges = ['top', 'left', 'right', 'bottom'],
}: ScreenProps) => {
  return (
    <>
      <SafeAreaView edges={edges} className={clsx('flex-1', className)}>
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