require('dotenv').config();

const express           = require('express');
const cors              = require('cors');
const helmet            = require('helmet');
const authMiddleware    = require('./src/middleware/authMiddleware');
const rateLimitMiddleware = require('./src/middleware/rateLimitMiddleware');
const loggerMiddleware  = require('./src/middleware/loggerMiddleware');
const registerProxyRoutes = require('./src/routes/gatewayRoutes');
const serviceRegistry   = require('./src/config/serviceRegistry');

const PORT = process.env.PORT || 4000;
const app  = express();

// ─── Core middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(helmet());
app.use(express.json());

// ─── Rate limiting (applied to ALL routes) ─────────────────────────────────
app.use(rateLimitMiddleware);

// ─── Request logger ─────────────────────────────────────────────────────────
app.use(loggerMiddleware);

// ─── Health check (public – before auth middleware) ─────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    services: serviceRegistry,
  });
});

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    service: 'api-gateway',
    version: '1.0.0',
    documentation: 'Use /health to see all registered services',
    services: serviceRegistry,
  });
});

// ─── Auth middleware (protects everything below) ────────────────────────────
app.use(authMiddleware);

// ─── Proxy routes ────────────────────────────────────────────────────────────
registerProxyRoutes(app);

// ─── 404 handler (no proxy matched) ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found on this gateway`,
    availableServices: Object.keys(serviceRegistry),
  });
});

// ─── Unhandled error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Gateway Error]', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔════════════════════════════════════════════════╗');
  console.log('  ║   🐝  HIVE API Gateway running on port ' + PORT + '   ║');
  console.log('  ╚════════════════════════════════════════════════╝');
  console.log('');
  Object.entries(serviceRegistry).forEach(([prefix, url]) => {
    console.log(`  ${prefix.padEnd(12)} →  ${url}`);
  });
  console.log('');
  console.log('  Health:  http://localhost:' + PORT + '/health');
  console.log('');
});
