import { env } from "./config/env";

import { loggerOptions } from "config/logger";
import Fastify from "fastify";
import multipart from "@fastify/multipart";

import { MinioStorageProvider } from "@infra/storage/MinioStorageProvider";
import { InMemoryVerificationRepo } from "@infra/database/InMemoryVerificationRepo";
import { BullMqProvider } from "@infra/queue/BullMqProvider";
import { RequestVerification } from "@core/usecases/RequestVerification";
import { UploadController } from "@infra/http/controllers/UploadController";
import { createWorker } from "./worker";

const server = Fastify({
  logger: loggerOptions,
});
server.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024 },
});

const storageProvider = new MinioStorageProvider();
const repository = new InMemoryVerificationRepo();
const queueProvider = new BullMqProvider("ocr-processing-queue");

const requestVerificationUseCase = new RequestVerification(
  storageProvider,
  repository,
  queueProvider,
  env.MINIO_BUCKET
);

const uploadController = new UploadController(requestVerificationUseCase);

server.post("/verify", (req, reply) => uploadController.handle(req, reply));

createWorker(repository, storageProvider);

const start = async () => {
  try {
    await server.listen({ port: env.PORT, host: "0.0.0.0" });
    server.log.info(`Microservice running at port ${env.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
