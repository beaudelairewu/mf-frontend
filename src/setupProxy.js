// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/model-proxy',
    createProxyMiddleware({
      target: 'https://assets.meshy.ai',
      changeOrigin: true,
      pathRewrite: {
        '^/model-proxy': '', // Remove the '/model-proxy' prefix when forwarding
      },
      onProxyRes: function(proxyRes, req, res) {
        // Add CORS headers
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      },
    })
  );
};