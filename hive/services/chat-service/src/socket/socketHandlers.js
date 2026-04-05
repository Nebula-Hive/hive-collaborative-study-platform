const Message = require('../models/messageModel');
const ChatUser = require('../models/userModel');

const buildRoomName = (batch) => `batch_${batch}`;

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007';
const SERVICE_SECRET_KEY = process.env.SERVICE_SECRET_KEY || 'hive_internal_service_key_2025';
const roomPresence = new Map();

const markOnline = (room, uid) => {
  if (!roomPresence.has(room)) {
    roomPresence.set(room, new Set());
  }
  roomPresence.get(room).add(uid);
};

const markOffline = (room, uid) => {
  const users = roomPresence.get(room);
  if (!users) return;
  users.delete(uid);
  if (users.size === 0) {
    roomPresence.delete(room);
  }
};

const sendNotificationSafely = async (payload) => {
  try {
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-key': SERVICE_SECRET_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('sendNotificationSafely failed', response.status, body);
    }
  } catch (err) {
    console.error('sendNotificationSafely error', err.message || err);
  }
};

const attachChatSocketHandlers = (io, socket) => {
  const { batch, uid, name, studentNumber } = socket.data.userProfile;
  const batchValue = String(batch);
  const room = buildRoomName(batchValue);

  socket.join(room);
  socket.data.room = room;
  socket.data.batch = batchValue;
  markOnline(room, uid);

  socket.emit('chat:ready', {
    room,
    batch: batchValue,
    groupName: `Batch ${batchValue} Group Chat`,
  });

  Message.find({ batch: batchValue })
    .sort({ timestamp: -1 })
    .limit(50)
    .lean()
    .then((recent) => {
      socket.emit('chat:history', {
        room,
        batch: batchValue,
        messages: recent.reverse(),
      });
    })
    .catch((err) => {
      console.error('chat history load error', err);
      socket.emit('chat:error', { message: 'Failed to load chat history' });
    });

  socket.on('chat:send', async ({ content }) => {
    try {
      const trimmedContent = (content || '').trim();
      if (!trimmedContent) return;

      const message = await Message.create({
        batch: batchValue,
        senderId: uid,
        senderName: name,
        senderStudentNumber: studentNumber,
        content: trimmedContent,
        timestamp: new Date(),
      });

      const payload = {
        _id: message._id,
        batch: message.batch,
        senderId: message.senderId,
        senderName: message.senderName,
        senderStudentNumber: message.senderStudentNumber,
        content: message.content,
        timestamp: message.timestamp,
      };

      io.to(room).emit('chat:message', payload);

      const onlineUsers = roomPresence.get(room) || new Set();
      // Notify offline members in the same batch regardless of role.
      // This allows admins who switch to student view to still receive chat alerts.
      const batchMembers = await ChatUser.find({
        batch: Number(batchValue),
        role: { $in: ['student', 'admin', 'superadmin'] },
        isActive: true,
      })
        .select('firebaseUid')
        .lean();

      const offlineRecipients = batchMembers
        .map((user) => user.firebaseUid)
        .filter((recipientUid) => recipientUid && recipientUid !== uid && !onlineUsers.has(recipientUid));

      if (offlineRecipients.length > 0) {
        const messagePreview = trimmedContent.length > 100
          ? `${trimmedContent.slice(0, 97)}...`
          : trimmedContent;

        await sendNotificationSafely({
          userIds: offlineRecipients,
          title: 'New Message',
          message: `${name}: ${messagePreview}`,
          type: 'chat',
          data: {
            groupId: room,
            senderId: uid,
            senderName: name,
          },
        });
      }
    } catch (err) {
      console.error('chat send error', err);
      socket.emit('chat:error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', (reason) => {
    markOffline(room, uid);
    console.log(`socket disconnected: ${socket.id} (${reason})`);
  });
};

module.exports = {
  attachChatSocketHandlers,
  buildRoomName,
};
