'use strict';

/**
 * Maps CometChat webhook events to the payload the app expects.
 *
 * Shape assumption (CometChat webhook v3):
 *   { appId, event: "message.delivered", data: { message, sender, receiver }, createdAt }
 *
 * Everything here is defensive: an unrecognised event is logged and skipped
 * rather than crashing the webhook handler, because a 5xx makes CometChat retry
 * and a malformed event would otherwise retry forever.
 */

const text = (message) => {
  if (!message) return '';
  if (typeof message.text === 'string' && message.text) return message.text;
  if (Array.isArray(message.attachments) && message.attachments.length) {
    const type = message.attachments[0]?.type;
    if (type === 'image') return 'Sent a photo';
    if (type === 'video') return 'Sent a video';
    if (type === 'audio') return 'Sent an audio file';
    return 'Sent a file';
  }
  if (message.type === 'call') return 'Call';
  return 'New message';
};

const senderName = (sender) => sender?.name || sender?.uid || 'Someone';

/** message.delivered → a chat notification for the receiver. */
const messagePush = (data) => {
  const message = data?.message || {};
  const sender = data?.sender || message.sender || {};
  const receiver = data?.receiver || {};

  return {
    targetUid: receiver.uid || receiver.UID || '',
    targetType: receiver.type || 'user',
    payload: {
      type: 'message',
      title: senderName(sender),
      body: text(message),
      pushNotification: {
        id: String(message.id || ''),
        type: 'message',
        sender: { uid: sender.uid, name: sender.name, avatar: sender.avatar },
        receiver: {
          uid: receiver.uid || receiver.UID,
          type: receiver.type || 'user',
          guid: receiver.guid,
        },
        messageId: message.id,
        conversationId:
          receiver.type === 'group' ? receiver.guid : receiver.uid || receiver.UID,
        conversationType: receiver.type === 'group' ? 'group' : 'user',
      },
    },
  };
};

/** call.* → the ringing screen for the receiver. */
const callPush = (data, event) => {
  const call = data?.call || data?.message || {};
  const sender = data?.sender || call.sender || {};
  const receiver = data?.receiver || {};
  const isVideo = String(call.type || '').toLowerCase() === 'video';

  // For accept/reject/cancel/ended the *other* party needs the update; the
  // webhook still names the original receiver, so the sender is targeted when
  // the event is not an incoming ring.
  const isIncomingRing = event === 'call.initiated';
  const targetUid = isIncomingRing
    ? receiver.uid || receiver.UID || ''
    : sender.uid || '';

  const verb =
    event === 'call.accepted'
      ? 'answered'
      : event === 'call.rejected'
        ? 'declined'
        : event === 'call.cancelled'
          ? 'cancelled the call'
          : event === 'call.ended'
            ? 'call ended'
            : 'is calling';

  return {
    targetUid,
    targetType: receiver.type === 'group' ? 'group' : 'user',
    payload: {
      type: 'call',
      title: isIncomingRing ? `${isVideo ? 'Video' : 'Voice'} call` : 'Call update',
      body:
        isIncomingRing
          ? `${senderName(sender)} is calling`
          : `${senderName(sender)} ${verb}`,
      pushNotification: {
        id: String(call.sessionId || call.id || ''),
        type: 'call',
        sessionId: String(call.sessionId || ''),
        callType: isVideo ? 'video' : 'audio',
        event,
        sender: { uid: sender.uid, name: sender.name, avatar: sender.avatar },
        receiver: {
          uid: receiver.uid || receiver.UID,
          type: receiver.type || 'user',
        },
        conversationId:
          receiver.type === 'group' ? receiver.guid : receiver.uid || receiver.UID,
        conversationType: receiver.type === 'group' ? 'group' : 'user',
      },
    },
  };
};

const buildPush = (event, data) => {
  switch (event) {
    case 'message.delivered':
    case 'message.read':
      return messagePush(data);
    case 'call.initiated':
    case 'call.accepted':
    case 'call.rejected':
    case 'call.cancelled':
    case 'call.ended':
    case 'call.unanswered':
      return callPush(data, event);
    default:
      return null;
  }
};

module.exports = { buildPush };
