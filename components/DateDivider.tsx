import { Text, View } from 'react-native';

/** Local calendar day key, used to group messages under one divider. */
export const getDateKey = (timestamp: number): string => {
  if (!timestamp) return 'unknown';
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

export const formatDateDivider = (timestamp: number): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

  if (timestamp >= startOfToday) return 'Today';
  if (timestamp >= startOfYesterday) return 'Yesterday';
  if (timestamp >= startOfToday - 6 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString([], { weekday: 'long' });
  }
  return date.toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' as const }),
  });
};

const DateDivider = ({ timestamp }: { timestamp: number }) => (
  <View className="items-center my-3">
    <View className="px-3 py-1 rounded-full bg-gray-200/70">
      <Text className="text-[11px] font-semibold text-gray-600">
        {formatDateDivider(timestamp)}
      </Text>
    </View>
  </View>
);

export default DateDivider;
