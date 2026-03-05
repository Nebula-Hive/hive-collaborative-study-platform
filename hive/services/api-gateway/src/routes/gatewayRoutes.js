const { createProxyMiddleware } = require('http-proxy-middleware');
const serviceRegistry = require('../config/serviceRegistry');

/**
 * Registers a proxy route for every entry in the service registry.
 *
 * Routing example:
 *   Gateway receives  → POST /users/api/users
 *   Proxy strips      → /users prefix is kept (target receives /users/api/users)
 *
 * The upstream services must mount their routes under the same prefix, e.g.
 *   user-service registers:  app.use('/api', userRoutes)
 *   and is reached via:      GET /users/api/users  → http://localhost:3001/api/users
 *
 * We strip the gateway prefix so the service only sees its own path namespace.
 * Example:  /users/api/users  →  /api/users  (pathRewrite removes leading /users)
 */
const registerProxyRoutes = (app) => {
  Object.entries(serviceRegistry).forEach(([prefix, target]) => {
    app.use(
      prefix,
      createProxyMiddleware({
        target,
        changeOrigin: true,

        // Strip the gateway prefix before forwarding
        // e.g. /users/api/users → /api/users
        pathRewrite: { [`^${prefix}`]: '' },

        // Forward the original Authorization header and user info
        on: {
          proxyReq: (proxyReq, req) => {
            // Pass decoded user info as custom headers downstream
            if (req.user) {
              proxyReq.setHeader('X-User-UID',   req.user.uid   || '');
              proxyReq.setHeader('X-User-Email', req.user.email || '');
              proxyReq.setHeader('X-User-Role',  req.user.role  || '');
            }
          },

          error: (err, req, res) => {
            console.error(`[Proxy Error] ${req.method} ${req.path} → ${target} :`, err.message);
            // Only send response if headers haven't been sent yet
            if (!res.headersSent) {
              res.status(502).json({
                error: 'Bad Gateway',
                message: `Upstream service unavailable: ${target}`,
              });
            }
          },
        },
      })
    );

    console.log(`[Gateway] Registered proxy: ${prefix} → ${target}`);
  });
};

module.exports = registerProxyRoutes;
