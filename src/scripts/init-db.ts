import { env } from "@infra/config/env";
import { logger } from "@infra/logger";
import { Client } from "pg";

async function main() {
  const targetDbName = env.POSTGRES_DB;

  if (!targetDbName) {
    logger.error("[InitDB] Erro: POSTGRES_DB não definido.");
    process.exit(1);
  }

  logger.info(
    `[InitDB] Verificando existência do banco de dados: ${targetDbName}...`
  );

  const connectionString = env.DATABASE_URL;

  const dbUrl = new URL(connectionString);
  dbUrl.pathname = "/postgres";

  const client = new Client({
    connectionString: dbUrl.toString(),
  });

  try {
    await client.connect();

    const checkRes = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDbName]
    );

    if (checkRes.rowCount === 0) {
      logger.info(
        `[InitDB] Banco '${targetDbName}' não encontrado. Criando...`
      );

      if (!/^[a-zA-Z0-9_]+$/.test(targetDbName)) {
        throw new Error(
          "Nome do banco de dados inválido (apenas alfanumérico e _ permitidos)"
        );
      }
      await client.query(`CREATE DATABASE "${targetDbName}"`);
      logger.info(`[InitDB] Banco '${targetDbName}' criado com sucesso!`);
    } else {
      logger.info(`[InitDB] Banco '${targetDbName}' já existe. Nada a fazer.`);
    }
  } catch (err: any) {
    logger.error({ err }, "[InitDB] Falha ao inicializar banco de dados");
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
