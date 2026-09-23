/**
 * Background worker process: `npm run worker`.
 *
 * Runs separately from the web server so slow jobs never compete with request
 * latency, and so it can be scaled (or paused) independently. Safe to run as many
 * replicas as you like — see advisory locking in jobs/runner.ts.
 */
import './bootstrap'; // must stay first: sets SERVICE_NAME before the logger is created
import { closeDb, getDb } from '../server/db/client';
import { env } from '../server/env';
import { logger } from '../server/logger';
import { missedDoseJob, moodDeclineJob, sessionCleanupJob } from '../server/jobs/jobs';
import { schedule } from '../server/jobs/runner';

async function main() {
  const config = env();
  const stop = schedule(getDb(), [missedDoseJob(config.DOSE_GRACE_MINUTES), moodDeclineJob(), sessionCleanupJob()]);
  logger.info('worker started');

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'worker shutting down');
    await stop();
    await closeDb();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  logger.fatal({ err }, 'worker failed to start');
  process.exit(1);
});
