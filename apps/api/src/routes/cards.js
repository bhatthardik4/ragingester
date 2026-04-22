import express from 'express';
import { TRIGGER_MODE } from '@ragingester/shared';
import { config } from '../config.js';
import { getRepository } from '../repository/index.js';
import { validateCardPayload, validateSchedulePreview } from '../lib/validation.js';
import { executeRun } from '../lib/run-engine.js';

export function createCardsRouter() {
  const router = express.Router();
  const repository = getRepository();

  router.get('/', async (req, res, next) => {
    try {
      const cards = await repository.listCards(req.user.id);
      res.json(cards);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const payload = validateCardPayload(req.body, config.defaultTimezone);
      const card = await repository.createCard({ ...payload, owner_id: req.user.id });
      res.status(201).json(card);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:id', async (req, res, next) => {
    try {
      const existing = await repository.getCardById(req.params.id, req.user.id);
      if (!existing) return res.status(404).json({ error: 'card not found' });

      const payload = validateCardPayload({ ...existing, ...req.body }, config.defaultTimezone);
      const updated = await repository.updateCard(req.params.id, payload);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const deleted = await repository.deleteCard(req.params.id, req.user.id);
      if (!deleted) return res.status(404).json({ error: 'card not found' });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/run', async (req, res, next) => {
    try {
      const card = await repository.getCardById(req.params.id, req.user.id);
      if (!card) return res.status(404).json({ error: 'card not found' });

      const activeRun = await repository.getActiveRunForCard(card.id);
      if (activeRun) {
        return res.status(409).json({ error: 'card already has an active run' });
      }

      const run = await executeRun({
        repository,
        card,
        triggerMode: TRIGGER_MODE.MANUAL,
        timeoutMs: config.runTimeoutMs,
        maxRetries: config.runMaxRetries
      });
      res.status(202).json(run);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id/runs', async (req, res, next) => {
    try {
      const card = await repository.getCardById(req.params.id, req.user.id);
      if (!card) return res.status(404).json({ error: 'card not found' });
      const runs = await repository.listRuns(req.params.id, req.user.id);
      res.json(runs);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id/schedule/preview', async (req, res, next) => {
    try {
      const card = await repository.getCardById(req.params.id, req.user.id);
      if (!card) return res.status(404).json({ error: 'card not found' });
      const runs = validateSchedulePreview(card.cron_expression, card.timezone);
      res.json({ next_runs: runs });
    } catch (error) {
      next(error);
    }
  });

  return router;
}