import { Worker } from "bullmq";
import { MinioStorageProvider } from "@infra/storage/MinioStorageProvider";
import { TesseractOcrProvider } from "@infra/ocr/TesseractOcrProvider";
import { GoogleVisionOcrProvider } from "@infra/ocr/GoogleVisionOcrProvider";
// import { InMemoryVerificationRepo } from "@infra/database/InMemoryVerificationRepo";
import { ProcessVerificationUsecase } from "@core/usecases/ProcessVerificationUsecase";
import { logger } from "@infra/logger";
import { IVerificationRepository } from "@core/ports/IVerificationRepository";
import { env } from "@infra/config/env";

export const createWorker = (
  repo: IVerificationRepository,
  storage: MinioStorageProvider
) => {
  const useGoogle = env.USE_GOOGLE_VISION;

  const ocrProvider = useGoogle
    ? new GoogleVisionOcrProvider()
    : new TesseractOcrProvider();

  logger.info(
    {
      provider: useGoogle
        ? GoogleVisionOcrProvider.name
        : TesseractOcrProvider.name,
    },
    "Worker iniciado"
  );

  const config = {
    bucketName: env.MINIO_BUCKET,
    similarityThreshold: env.OCR_THRESHOLD,
  };

  const processVerification = new ProcessVerificationUsecase(
    repo,
    storage,
    ocrProvider,
    config
  );

  const worker = new Worker(
    "ocr-processing-queue",
    async (job) => {
      logger.info(
        { jobId: job.id, verificationId: job.data.verificationId },
        "Processando job"
      );

      await processVerification.execute({
        verificationId: job.data.verificationId,
        fileKey: job.data.fileKey,
        expectedData: job.data.expectedData,
      });
    },
    {
      connection: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
      },
      concurrency: 1,
    }
  );

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "Job finalizado com sucesso");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "Job falhou");
  });

  return worker;
};
