import { RUN_STATUS, TRIGGER_MODE } from '@ragingester/shared';
import { computeNextRun } from './cron.js';
import { resolveCollector } from '../collectors/index.js';

async function withTimeout(promise, timeoutMs) {
  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(`run timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function resolveRunPolicy(card, { defaultTimeoutMs, defaultMaxRetries }) {
  return {
    effectiveTimeoutMs: card.run_timeout_ms ?? defaultTimeoutMs,
    effectiveMaxRetries: card.run_max_retries ?? defaultMaxRetries
  };
}

function serializeError(error) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(error.code ? { code: String(error.code) } : {})
    };
  }

  return {
    name: 'Error',
    message: String(error)
  };
}

export async function executeRun({ repository, card, triggerMode, timeoutMs, maxRetries }) {
  const { effectiveTimeoutMs, effectiveMaxRetries } = resolveRunPolicy(card, {
    defaultTimeoutMs: timeoutMs,
    defaultMaxRetries: maxRetries
  });
  const logs = [];

  const run = await repository.createRun({
    card_id: card.id,
    owner_id: card.owner_id,
    status: RUN_STATUS.PENDING,
    trigger_mode: triggerMode || TRIGGER_MODE.MANUAL,
    attempts: 0,
    started_at: null,
    ended_at: null,
    error: null,
    error_payload: null,
    logs: []
  });

  let attempts = 0;
  while (attempts <= effectiveMaxRetries) {
    attempts += 1;
    logs.push({
      level: 'info',
      event: 'attempt_started',
      attempt: attempts,
      trigger_mode: triggerMode || TRIGGER_MODE.MANUAL,
      timeout_ms: effectiveTimeoutMs,
      max_retries: effectiveMaxRetries
    });

    await repository.updateRun(run.id, {
      status: RUN_STATUS.RUNNING,
      attempts,
      started_at: new Date().toISOString(),
      logs
    });

    try {
      const collector = resolveCollector(card.source_type);
      const collected = await withTimeout(
        collector.collect({ source_input: card.source_input, params: card.params, context: { card, runId: run.id } }),
        effectiveTimeoutMs
      );

      await repository.createCollectedData({
        run_id: run.id,
        owner_id: card.owner_id,
        raw_data: collected.raw,
        normalized_data: collected.normalized,
        metadata: { metrics: collected.metrics || {}, source_type: card.source_type }
      });

      const updates = {
        status: RUN_STATUS.SUCCESS,
        ended_at: new Date().toISOString(),
        error: null,
        error_payload: null,
        logs: [...logs, { level: 'info', event: 'run_completed', message: 'run completed', attempt: attempts }]
      };
      await repository.updateRun(run.id, updates);

      const nextRunAt = card.schedule_enabled && card.cron_expression
        ? computeNextRun(card.cron_expression, card.timezone, new Date())
        : null;

      await repository.updateCard(card.id, {
        last_run_at: updates.ended_at,
        next_run_at: nextRunAt
      });

      return repository.getRunById(run.id, card.owner_id);
    } catch (error) {
      const errorPayload = serializeError(error);
      logs.push({
        level: 'error',
        event: 'attempt_failed',
        attempt: attempts,
        error: errorPayload
      });

      const failedState = {
        status: RUN_STATUS.FAILED,
        ended_at: new Date().toISOString(),
        error: errorPayload.message,
        error_payload: errorPayload,
        logs
      };
      await repository.updateRun(run.id, failedState);

      if (attempts > effectiveMaxRetries) {
        return repository.getRunById(run.id, card.owner_id);
      }
    }
  }

  return repository.getRunById(run.id, card.owner_id);
}
