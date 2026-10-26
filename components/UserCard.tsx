import { Text, View } from 'react-native';

interface UserCardProps {
  onPress?: () => void;
  user: { id: string; name?: string; image?: string; username?: string };
  children?: React.ReactNode;
}

const UserCard = ({ children, onPress, user }: UserCardProps) => {
  const name = user.name || user.username || 'Unknown';

  return (
    <Button
      variant="plain"
      onPress={onPress}
      className="bg-surface flex-row items-center gap-2 py-3 px-4 rounded-bubble"
    >
      <View className="h-10 w-10">
        <Avatar name={name} imageUrl={user?.image} size={40} />
      </View>
      <View>
        <Text className="text-base leading-5">{name}</Text>
      </View>
      {children}
    </Button>
  );
};

import Avatar from './Avatar';
import Button from './Button';

export default UserCard;
