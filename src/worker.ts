import { Worker } from "bullmq";
import { MinioStorageProvider } from "@infra/storage/MinioStorageProvider";
import { TesseractOcrProvider } from "@infra/ocr/TesseractOcrProvider";
import { GoogleVisionOcrProvider } from "@infra/ocr/GoogleVisionOcrProvider";
import { InMemoryVerificationRepo } from "@infra/database/InMemoryVerificationRepo";
import { ProcessVerification } from "@core/usecases/ProcessVerification";
import { logger } from "@infra/logger";

export const createWorker = (
  repo: InMemoryVerificationRepo,
  storage: MinioStorageProvider
) => {
  const useGoogle = process.env.USE_GOOGLE_VISION === "true";

  const ocrProvider = useGoogle
    ? new GoogleVisionOcrProvider()
    : new TesseractOcrProvider();

  logger.info(
    { provider: useGoogle ? "GoogleVision" : "Tesseract" },
    "Worker iniciado"
  );

  const config = {
    bucketName: process.env.MINIO_BUCKET || "docs",
    similarityThreshold: Number(process.env.OCR_THRESHOLD) || 0.7,
  };

  const processVerification = new ProcessVerification(
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
      });
    },
    {
      connection: {
        host: process.env.REDIS_HOST || "localhost",
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
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
