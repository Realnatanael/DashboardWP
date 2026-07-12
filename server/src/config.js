import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/dashboard-posto',
  apiBaseUrl: process.env.API_BASE_URL || 'http://web.qualityautomacao.com.br',
  apiToken: process.env.API_TOKEN || '',
  apiUser: process.env.API_USER || '',
  apiPassword: process.env.API_PASSWORD || '',
  syncIntervalSeconds: parseInt(process.env.SYNC_INTERVAL_SECONDS || '30', 10),
  dreSyncIntervalMinutes: parseInt(process.env.DRE_SYNC_INTERVAL_MINUTES || '5', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
