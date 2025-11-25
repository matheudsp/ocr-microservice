import { env } from "./infra/config/env";

import { loggerOptions } from "@infra/config/logger";
import Fastify from "fastify";
import multipart from "@fastify/multipart";

import { MinioStorageProvider } from "@infra/storage/MinioStorageProvider";
// import { InMemoryVerificationRepo } from "@infra/database/InMemoryVerificationRepo";
import { PrismaVerificationRepo } from "@infra/database/PrismaVerificationRepo";
import { BullMqProvider } from "@infra/queue/BullMqProvider";
import { UploadController } from "@infra/http/controllers/UploadController";
import { createWorker } from "./worker";
import { RequestVerificationUsecase } from "@core/usecases/RequestVerificationUsecase";

const server = Fastify({
  logger: loggerOptions,
});
server.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024 },
});

const storageProvider = new MinioStorageProvider();
// const repository = new InMemoryVerificationRepo();
const repository = new PrismaVerificationRepo();
const queueProvider = new BullMqProvider("ocr-processing-queue");

const requestVerificationUseCase = new RequestVerificationUsecase(
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
