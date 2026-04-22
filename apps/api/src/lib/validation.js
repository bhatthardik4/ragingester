import { z } from 'zod';
import { SOURCE_TYPES } from '@ragingester/shared';
import { computeNextRun, computeNextRuns } from './cron.js';

const timezoneSchema = z.string().min(3);

const cardInputSchema = z.object({
  source_type: z.enum([
    SOURCE_TYPES.HTTP_API,
    SOURCE_TYPES.WEBSITE_URL,
    SOURCE_TYPES.RSS_FEED,
    SOURCE_TYPES.IDENTIFIER_BASED
  ]),
  source_input: z.string().min(1),
  params: z.record(z.any()).default({}),
  schedule_enabled: z.boolean().default(false),
  cron_expression: z.string().nullable().optional(),
  timezone: timezoneSchema.optional(),
  active: z.boolean().default(true)
});

export function validateCardPayload(input, defaultTimezone) {
  const parsed = cardInputSchema.parse(input);

  const timezone = parsed.timezone || defaultTimezone;
  let nextRunAt = null;

  if (parsed.schedule_enabled) {
    if (!parsed.cron_expression) {
      throw new Error('cron_expression is required when schedule_enabled is true');
    }
    computeNextRuns(parsed.cron_expression, timezone, 1);
    nextRunAt = computeNextRun(parsed.cron_expression, timezone);
  }

  return {
    ...parsed,
    timezone,
    cron_expression: parsed.schedule_enabled ? parsed.cron_expression : null,
    next_run_at: parsed.schedule_enabled ? nextRunAt : null
  };
}

export function validateSchedulePreview(cronExpression, timezone) {
  if (!cronExpression) {
    throw new Error('cron_expression is required');
  }
  if (!timezone) {
    throw new Error('timezone is required');
  }
  return computeNextRuns(cronExpression, timezone, 5);
}