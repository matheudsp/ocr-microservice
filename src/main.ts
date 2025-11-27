import { env } from "@infra/config/env";
import { buildApp } from "@infra/http/app";
import { createWorker } from "./worker";
import { VerificationRepository } from "@infra/database/VerificationRepository";
import { MinioStorageProvider } from "@infra/storage/MinioStorageProvider";

const startApi = async () => {
  const app = buildApp();

  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    app.log.info(` Microservice running at port ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

const startWorker = () => {
  const repository = new VerificationRepository();
  const storage = new MinioStorageProvider();
  createWorker(repository, storage);
};

startApi();
startWorker();
