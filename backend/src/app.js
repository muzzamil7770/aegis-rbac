import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load Env
dotenv.config();

import db from './db/index.js';
import authRoutes from './routes/authRoutes.js';
import usersRoutes from './routes/usersRoutes.js';
import rolesRoutes from './routes/rolesRoutes.js';
import auditRoutes from './routes/auditRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: '*', // For demo; replace with specific domains in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsers
app.use(express.json());

// Request logging (Simple dev logger)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[HTTP] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  }
  next();
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/audit', auditRoutes);

// Health Check / Diagnostics
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    database: process.env.DB_CLIENT || 'sqlite3',
    env: process.env.NODE_ENV || 'development'
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('[UNHANDLED EXCEPTION]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong on our end.'
  });
});

// Startup Routine
function startServer() {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`   RBAC SYSTEM BACKEND RUNNING ON PORT ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   DB Client: ${process.env.DB_CLIENT || 'sqlite3'}`);
    console.log(`===============================================`);
  });
}

// Auto-run Migrations & Seeds for SQLite (Zero configuration developer setup)
if (process.env.DB_CLIENT === 'sqlite3') {
  console.log('Database: Running migrations and seeds...');
  db.migrate.latest()
    .then(() => db.seed.run())
    .then(() => {
      console.log('Database: Schema updated and permissions seeded successfully.');
      startServer();
    })
    .catch((err) => {
      console.error('Database: Migration/Seed startup failed:', err);
      // Fallback: start server anyway
      startServer();
    });
} else {
  // For MySQL / PostgreSQL, let the user trigger migrations manually or run it.
  startServer();
}
