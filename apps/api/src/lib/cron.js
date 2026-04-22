import { CronExpressionParser } from 'cron-parser';

export function computeNextRuns(cronExpression, timezone, count = 5, fromDate = new Date()) {
  const interval = CronExpressionParser.parse(cronExpression, {
    currentDate: fromDate,
    tz: timezone
  });

  const dates = [];
  for (let i = 0; i < count; i += 1) {
    dates.push(interval.next().toDate().toISOString());
  }
  return dates;
}

export function computeNextRun(cronExpression, timezone, fromDate = new Date()) {
  return computeNextRuns(cronExpression, timezone, 1, fromDate)[0] ?? null;
}
