import { db } from "@infra/config/drizzle/database";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  // console.info("[Migration] Iniciando migração do banco de dados...");

  try {
    const migrationsFolder = path.join(
      __dirname,
      "../infra/config/drizzle/migrations"
    );

    await migrate(db, { migrationsFolder });

    // console.info("[Migration] Migração concluída com sucesso!");
    process.exit(0);
  } catch (err) {
    console.error({ err }, "[Migration] Falha crítica ao rodar migrações");
    process.exit(1);
  }
}

main();
