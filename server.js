const express = require('express');
const client = require('prom-client');

const app = express();
const PORT = process.env.PORT || 3000;

// Collect default Node.js metrics (memory, CPU, event loop lag, etc.)
client.collectDefaultMetrics();

// Custom metric: count every HTTP request, labeled by route and status code
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Custom metric: track request duration (this is what lets you catch latency spikes post-deploy)
const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    httpRequestCounter.inc({ method: req.method, route: req.path, status_code: res.statusCode });
    end({ method: req.method, route: req.path, status_code: res.statusCode });
  });
  next();
});

app.get('/', (req, res) => {
  res.json({ message: 'Hello from my-node-app', version: process.env.APP_VERSION || 'dev' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Prometheus scrapes this endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
if (require.main === module) {
  app.listen(PORT, () => console.log(`Listening on ${PORT}`));
}

module.exports = app;

