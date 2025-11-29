import { IVerificationRepository } from "../../ports/IVerificationRepository";
import { IStorageProvider } from "../../ports/IStorageProvider";
import { IOcrProvider } from "../../ports/IOcrProvider";
import { IWebhookProvider } from "../../ports/IWebhookProvider";
import {
  VerificationConfig,
  VerificationStatus,
} from "../../dtos/verification.dto";
import { VerificationStrategyFactory } from "../../factories/VerificationStrategyFactory";

import { ExpectedData } from "../../dtos/verification.dto";

interface ProcessVerificationInput {
  verificationId: string;
  fileKey: string;
  expectedData: ExpectedData;
  webhookUrl?: string;
}

export class ProcessVerificationUsecase {
  private readonly serviceName: string = ProcessVerificationUsecase.name;

  constructor(
    private verificationRepo: IVerificationRepository,
    private storageProvider: IStorageProvider,
    private ocrProvider: IOcrProvider,
    private webhookProvider: IWebhookProvider,
    private config: VerificationConfig
  ) {}

  async execute(input: ProcessVerificationInput): Promise<void> {
    const { verificationId, fileKey, expectedData, webhookUrl } = input;

    const request = await this.verificationRepo.findById(verificationId);
    if (!request) {
      throw new Error("Solicitação não encontrada");
    }

    request.markAsProcessing();
    await this.verificationRepo.update(request);

    try {
      const fileBuffer = await this.storageProvider.getFile(
        this.config.bucketName,
        fileKey
      );

      const extractedText = await this.ocrProvider.extractText(fileBuffer);

      const strategy = VerificationStrategyFactory.create(
        request.documentType,
        this.config.thresholds
      );

      const { score, reason, passed } = strategy.calculateConfidence(
        extractedText,
        expectedData
      );

      request.complete(score, passed, reason);
      await this.verificationRepo.update(request);

      console.info(
        `Verificação ${verificationId} concluída. Score: ${score}. Motivo: ${
          reason ?? "N/A"
        }`
      );

      if (webhookUrl) {
        await this.webhookProvider.send(webhookUrl, {
          verificationId: request.id,
          externalReference: request.externalReference,
          status: request.status,
          passed: request.passed ?? false,
          failReason: request.failReason,
          confidenceScore: request.confidenceScore,
          processedAt: request.updatedAt,
        });
      }
    } catch (error: any) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao processar documento";

      console.error(
        { usecase: this.serviceName, err: error },
        `Falha na verificação ${verificationId}`
      );

      request.fail(errorMessage);

      await this.verificationRepo.update(request);

      if (webhookUrl) {
        await this.webhookProvider.send(webhookUrl, {
          verificationId: request.id,
          externalReference: request.externalReference,
          status: VerificationStatus.FAILED,
          passed: false,
          failReason: errorMessage,
          confidenceScore: 0,
          processedAt: new Date(),
        });
      }
    }
  }
}
