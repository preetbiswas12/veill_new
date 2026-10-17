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

/** The design's date pill: white, 8pt radius, a 0.66pt rgba(0,0,0,0.06) hairline. */
const DateDivider = ({ timestamp }: { timestamp: number }) => (
  <View className="items-center pt-[23px] pb-px">
    <View className="min-w-[100px] px-[14px] py-[3px] rounded-[8px] bg-white border-bubble border-bubble-shadow">
      <Text className="text-body-3 font-semibold text-text-strong text-center">
        {formatDateDivider(timestamp)}
      </Text>
    </View>
  </View>
);

export default DateDivider;
