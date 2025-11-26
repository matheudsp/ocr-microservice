import { RequestVerificationUsecase } from "@core/usecases/VerificationUseCase/RequestVerificationUsecase";
import { GetVerificationUsecase } from "@core/usecases/VerificationUseCase/GetVerificationUsecase";
import { UploadController } from "@infra/http/controllers/UploadController";
import { GetVerificationController } from "@infra/http/controllers/GetVerificationController";
import { PrismaVerificationRepo } from "@infra/database/PrismaVerificationRepo";
import { MinioStorageProvider } from "@infra/storage/MinioStorageProvider";
import { BullMqProvider } from "@infra/queue/BullMqProvider";
import { env } from "@infra/config/env";
import { PrismaAuthRepo } from "@infra/database/PrismaAuthRepo";
import { ValidateApiKeyUsecase } from "@core/usecases/ApiKeyUseCase/ValidateApiKeyUsecase";
import { apiKeyMiddleware } from "../middlewares/ApiKeyMiddleware";

export const VerificationModule = () => {
  const authRepo = new PrismaAuthRepo();
  const verificationRepo = new PrismaVerificationRepo();
  const storageProvider = new MinioStorageProvider();
  const queueProvider = new BullMqProvider("ocr-processing-queue");

  const requestVerificationUseCase = new RequestVerificationUsecase(
    storageProvider,
    verificationRepo,
    queueProvider,
    env.MINIO_BUCKET
  );
  const validateApiKeyUsecase = new ValidateApiKeyUsecase(authRepo);
  const getVerificationUseCase = new GetVerificationUsecase(verificationRepo);

  const uploadController = new UploadController(requestVerificationUseCase);
  const getVerificationController = new GetVerificationController(
    getVerificationUseCase
  );
  const verifyApiKey = apiKeyMiddleware(validateApiKeyUsecase);
  return {
    uploadController,
    getVerificationController,
    verifyApiKey,
  };
};
