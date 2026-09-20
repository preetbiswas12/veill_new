import Screen from './Screen';
import Spinner from './Spinner';

const ScreenLoading = () => {
  return (
    <Screen className="bg-white" viewClassName="items-center justify-center">
      <Spinner />
    </Screen>
  );
};

export default ScreenLoading;
