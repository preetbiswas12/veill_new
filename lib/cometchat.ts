export const normalizeCometChatUserId = (userId: string) => {
  const normalized = userId
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
  return normalized || 'user';
};

export const getCallChannelId = (peerUserId: string) => {
  const normalizedUserId = normalizeCometChatUserId(peerUserId);
  return `call-${normalizedUserId}`.slice(0, 64);
};

export const getCallMessageEvent = () => 'cometchat_call_invite';
