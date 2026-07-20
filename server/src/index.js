import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import habitsRoutes from './routes/habits.js';
import checklistRoutes from './routes/checklist.js';
import summaryRoutes from './routes/summary.js';
import historyRoutes from './routes/history.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.use('/api/habits', habitsRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/history', historyRoutes);
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();

  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

async function start() {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB conectado');

  app.listen(config.port, () => {
    console.log(`Servidor rodando em http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error('Falha ao iniciar:', err);
  process.exit(1);
});
