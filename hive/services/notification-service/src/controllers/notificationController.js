const { validationResult } = require('express-validator');
const axios = require('axios');
const notificationService = require('../services/notificationService');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const SERVICE_SECRET_KEY = process.env.SERVICE_SECRET_KEY || 'hive_internal_service_key_2025';

const fetchAllStudentUserIds = async () => {
  const response = await axios.get(`${USER_SERVICE_URL}/api/internal/users/students`, {
    headers: { 'x-service-key': SERVICE_SECRET_KEY },
    timeout: 10000,
  });

  return (response.data?.users || [])
    .map((user) => user.userId)
    .filter(Boolean);
};

const fetchBatchStudentUserIds = async (batch) => {
  const response = await axios.get(`${USER_SERVICE_URL}/api/internal/users/students/batch/${encodeURIComponent(batch)}`, {
    headers: { 'x-service-key': SERVICE_SECRET_KEY },
    timeout: 10000,
  });

  return (response.data?.users || [])
    .map((user) => user.userId)
    .filter(Boolean);
};

const getMyNotifications = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const data = await notificationService.getUserNotifications(req.user.uid, page, limit);

    return res.json({
      notifications: data.notifications,
      unreadCount: data.unreadCount,
      total: data.total,
      page: data.page,
      limit: data.limit,
    });
  } catch (err) {
    console.error('getMyNotifications error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.uid);
    return res.json({ count });
  } catch (err) {
    console.error('getUnreadCount error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const markOneAsRead = async (req, res) => {
  try {
    const updated = await notificationService.markAsRead(req.params.id, req.user.uid);
    if (!updated) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    return res.json({ message: 'Notification marked as read', notification: updated });
  } catch (err) {
    console.error('markOneAsRead error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.uid);
    return res.json({ message: 'All notifications marked as read', modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error('markAllAsRead error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteOne = async (req, res) => {
  try {
    const deleted = await notificationService.deleteNotification(req.params.id, req.user.uid);
    if (!deleted) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    return res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('deleteOne error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const clearRead = async (req, res) => {
  try {
    const result = await notificationService.clearReadNotifications(req.user.uid);
    return res.json({ message: 'Read notifications cleared', deletedCount: result.deletedCount });
  } catch (err) {
    console.error('clearRead error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const sendNotification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { userIds, title, message, type, data } = req.body;

    if (Array.isArray(userIds)) {
      const result = await notificationService.createBulkNotifications(userIds, title, message, type, data || {});
      return res.status(201).json({ message: 'Notifications created', created: result.created });
    }

    if (userIds === 'all_students') {
      const allStudentUserIds = await fetchAllStudentUserIds();
      const dbResult = await notificationService.createBulkNotifications(
        allStudentUserIds,
        title,
        message,
        type,
        data || {}
      );
      return res.status(201).json({ message: 'Notifications created for all students', created: dbResult.created });
    }

    if (typeof userIds === 'string' && userIds.startsWith('batch:')) {
      const batch = userIds.split(':')[1];
      const batchUserIds = await fetchBatchStudentUserIds(batch);
      const dbResult = await notificationService.createBulkNotifications(
        batchUserIds,
        title,
        message,
        type,
        data || {}
      );
      return res.status(201).json({ message: `Notifications created for batch ${batch}`, created: dbResult.created });
    }

    return res.status(400).json({ message: 'userIds must be an array, all_students, or batch:<batch>' });
  } catch (err) {
    console.error('sendNotification error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markOneAsRead,
  markAllAsRead,
  deleteOne,
  clearRead,
  sendNotification,
};
