export interface ChannelHistoryPoint {
  subscriberCountDelta: number;
}

export const calculateSubscriberGain = (
  points: readonly ChannelHistoryPoint[]
): number | null => {
  if (points.length === 0) {
    return null;
  }

  let subscriberGain = 0;

  for (const point of points) {
    subscriberGain += point.subscriberCountDelta;
  }

  return subscriberGain;
};
