export const normalizeCometChatUserId = (userId: string) => {
  const normalized = userId
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
  return normalized || 'user';
};

/**
 * CometChat has no first-class "stories" product, so stories are backed by
 * this public group. Every client joins it after login, stories are image or
 * video media messages sent to it within the last 24 hours, and the resulting
 * conversation is filtered out of the chats list.
 */
export const STORIES_GUID = 'signal-stories';
