import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import dashboardRoutes from './routes/dashboard.js';
import { runSync, loadLastSnapshot } from './jobs/syncJob.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: config.corsOrigin, methods: ['GET', 'POST'] },
});

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);

const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);
  socket.on('disconnect', () => console.log(`Cliente desconectado: ${socket.id}`));
});

async function syncAndBroadcast(includeDre = false) {
  try {
    const data = await runSync(includeDre);
    io.emit('dashboard:update', data);
  } catch (err) {
    io.emit('dashboard:error', { message: err.message, timestamp: new Date().toISOString() });
  }
}

async function start() {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB conectado');

  await loadLastSnapshot();

  await syncAndBroadcast(true);

  setInterval(() => syncAndBroadcast(false), config.syncIntervalSeconds * 1000);

  cron.schedule(`*/${config.dreSyncIntervalMinutes} * * * *`, () => {
    syncAndBroadcast(true);
  });

  httpServer.listen(config.port, () => {
    console.log(`Servidor rodando em http://localhost:${config.port}`);
    console.log(`Sync a cada ${config.syncIntervalSeconds}s | DRE a cada ${config.dreSyncIntervalMinutes}min`);
  });
}

start().catch((err) => {
  console.error('Falha ao iniciar:', err);
  process.exit(1);
});
