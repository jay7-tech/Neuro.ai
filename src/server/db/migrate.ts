import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { closeDb, getDb } from './client';
import { logger } from '../logger';

/** Applies pending SQL migrations from ./drizzle. Safe to run on every deploy. */
export async function runMigrations(): Promise<void> {
  await migrate(getDb(), { migrationsFolder: './drizzle' });
}

if (require.main === module) {
  runMigrations()
    .then(() => logger.info('migrations applied'))
    .catch((err) => {
      logger.fatal({ err }, 'migration failed');
      process.exitCode = 1;
    })
    .finally(() => closeDb());
}
