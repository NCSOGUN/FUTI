const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { startInventoryAlerts } = require('./jobs/inventoryAlerts');
 
dotenv.config();
 
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
 
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',').map(value => value.trim()).filter(Boolean);
 
app.use(helmet({ contentSecurityPolicy: false }));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../Frontend')));
 
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT || 300),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' }
});
app.use('/api', apiLimiter);
 
app.use('/api/auth', require('./routes/auth'));
app.use('/api/me', require('./routes/me'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/portal', require('./routes/portal'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/ai', require('./routes/admin-ai'));
app.use('/api/clinic', require('./routes/clinic'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/ai', require('./routes/ai'));
 
app.get('/api/health', (req, res) => res.json({
  ok: true, service: 'HealthPass API', timestamp: new Date().toISOString()
}));
 
app.use((req, res) => res.status(404).json({ message: 'API endpoint not found.' }));
app.use((err, req, res, next) => {
  console.error('API error:', err.message);
  const status = Number(err.status) >= 400 && Number(err.status) < 600 ? Number(err.status) : 500;
  res.status(status).json({
    message: status === 500 ? 'Internal server error.' : err.message
  });
});
 
async function start() {
  await connectDB();
  const port = Number(process.env.PORT || 5000);
  const server = app.listen(port, () => {
    console.log(`HealthPass API listening on port ${port}`);
    startInventoryAlerts();
  });
 
  const shutdown = signal => {
    console.log(`${signal} received; closing HealthPass API.`);
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
 
if (require.main === module) {
  start().catch(error => {
    console.error('Could not start HealthPass:', error);
    process.exit(1);
  });
}
 
module.exports = { app, start };