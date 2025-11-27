import { db } from "@infra/config/drizzle/database";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { logger } from "@infra/logger";
import path from "path";

async function main() {
  logger.info("[Migration] Iniciando migração do banco de dados...");

  try {
    const migrationsFolder = path.join(
      __dirname,
      "../infra/config/drizzle/migrations"
    );

    await migrate(db, { migrationsFolder });

    logger.info("[Migration] Migração concluída com sucesso!");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "[Migration] Falha crítica ao rodar migrações");
    process.exit(1);
  }
}

main();
