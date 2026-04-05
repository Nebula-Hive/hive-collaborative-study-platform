/**
 * Service Registry
 * Maps URL prefixes (as seen by the API Gateway) to upstream service base URLs.
 * Uses env vars with localhost fallbacks for local development.
 */
const serviceRegistry = {
  '/auth':      process.env.AUTH_SERVICE_URL      || 'http://localhost:3000',
  '/users':     process.env.USER_SERVICE_URL      || 'http://localhost:3001',
  '/resources': process.env.RESOURCE_SERVICE_URL  || 'http://localhost:3002',
  '/chat':      process.env.CHAT_SERVICE_URL      || 'http://localhost:3003',
  '/notes':     process.env.NOTE_SERVICE_URL      || 'http://localhost:3004',
  '/progress':  process.env.PROGRESS_SERVICE_URL  || 'http://localhost:3005',
  '/sessions':  process.env.SESSION_SERVICE_URL   || 'http://localhost:3006',
  '/notifications': process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
  '/rag':       process.env.RAG_SERVICE_URL       || 'http://localhost:8000',
};

module.exports = serviceRegistry;
