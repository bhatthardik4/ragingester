import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { authMiddleware } from './lib/auth.js';
import { createCardsRouter } from './routes/cards.js';
import { createRunsRouter } from './routes/runs.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'ragingester-api' });
  });

  app.use(authMiddleware);
  app.use('/cards', createCardsRouter());
  app.use('/runs', createRunsRouter());

  app.use((error, _req, res, _next) => {
    res.status(400).json({ error: error.message || 'unexpected error' });
  });

  return app;
}