import { TRIGGER_MODE } from '@ragingester/shared';
import { config } from '../config.js';
import { getRepository } from '../repository/index.js';
import { executeRun } from '../lib/run-engine.js';

async function runTick() {
  const repository = getRepository();
  const dueCards = await repository.listDueCards(new Date().toISOString());

  for (const card of dueCards) {
    const activeRun = await repository.getActiveRunForCard(card.id);
    if (activeRun) continue;

    await executeRun({
      repository,
      card,
      triggerMode: TRIGGER_MODE.SCHEDULED,
      timeoutMs: config.runTimeoutMs,
      maxRetries: config.runMaxRetries
    });
  }
}

setInterval(() => {
  runTick().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('scheduler tick failed', error);
  });
}, config.schedulerPollMs);

// eslint-disable-next-line no-console
console.log(`Scheduler running every ${config.schedulerPollMs}ms`);