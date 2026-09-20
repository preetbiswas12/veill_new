import { Image, ImageProps } from 'expo-image';
import { cssInterop } from 'nativewind';

cssInterop(Image, {
  className: {
    target: 'style',
  },
});

const AppImage = (props: ImageProps) => {
  return <Image {...props} />;
};

export default AppImage;
