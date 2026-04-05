const cron = require('node-cron');
const axios = require('axios');
const SessionReminder = require('../models/SessionReminder');

const SESSION_SERVICE_URL = process.env.SESSION_SERVICE_URL || 'http://localhost:3006';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007';
const SERVICE_SECRET_KEY = process.env.SERVICE_SECRET_KEY || 'hive_internal_service_key_2025';

const formatDate = (value) => {
  const date = new Date(value);
  return date.toLocaleDateString('en-GB');
};

const fetchUpcomingSessions = async () => {
  const response = await axios.get(`${SESSION_SERVICE_URL}/api/sessions/internal/upcoming`, {
    headers: {
      'x-service-key': SERVICE_SECRET_KEY,
    },
    params: {
      minutesAhead: 60,
      windowMinutes: 1,
    },
    timeout: 10000,
  });

  return Array.isArray(response.data?.sessions) ? response.data.sessions : [];
};

const runSessionReminderTask = async () => {
  try {
    const sessions = await fetchUpcomingSessions();
    if (sessions.length === 0) {
      return;
    }

    for (const session of sessions) {
      const sessionId = String(session._id || session.id || '');
      if (!sessionId) continue;

      const alreadyReminded = await SessionReminder.findOne({ sessionId }).lean();
      if (alreadyReminded) {
        continue;
      }

      const title = 'Study Session Reminder';
      const message = `Reminder: ${session.topic} for ${session.subjectCode} starts in 1 hour at ${session.time}`;
      const data = {
        sessionId,
        subjectCode: session.subjectCode,
        date: formatDate(session.date),
        time: session.time,
      };

      await axios.post(
        `${NOTIFICATION_SERVICE_URL}/api/notifications/send`,
        {
          userIds: session.batch !== null && session.batch !== undefined ? `batch:${session.batch}` : 'all_students',
          title,
          message,
          type: 'session',
          data,
        },
        {
          headers: {
            'x-service-key': SERVICE_SECRET_KEY,
          },
          timeout: 10000,
        }
      );

      await SessionReminder.create({ sessionId, remindedAt: new Date() });
    }
  } catch (err) {
    console.error('runSessionReminderTask error', err.message || err);
  }
};

const startSessionReminderScheduler = () => {
  cron.schedule('* * * * *', runSessionReminderTask);
  console.log('Session reminder scheduler started');
};

module.exports = {
  startSessionReminderScheduler,
  runSessionReminderTask,
};
