import levenshtein from "fast-levenshtein";
import { IVerificationRepository } from "../../ports/IVerificationRepository";
import { IStorageProvider } from "../../ports/IStorageProvider";
import { IOcrProvider } from "../../ports/IOcrProvider";
import {
  VerificationResult,
  VerificationConfig,
  ExpectedData,
  VerificationStatus,
} from "../../dtos/verification.dto";
import { logger } from "@infra/logger";
import type { IWebhookProvider } from "@core/ports/IWebhookProvider";

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

      const { confidenceScore } = this.calculateConfidence(
        extractedText,
        expectedData
      );

      request.complete(confidenceScore);
      await this.verificationRepo.update(request);

      logger.info(
        `Verificação ${verificationId} concluída. Score: ${confidenceScore}`
      );
      if (webhookUrl) {
        await this.webhookProvider.send(webhookUrl, {
          verificationId: request.id,
          externalReference: request.externalReference,
          status: request.status,
          confidenceScore: request.confidenceScore,
          processedAt: request.updatedAt,
        });
      }
    } catch (error) {
      logger.error(
        { usecase: this.serviceName, err: error },
        `Falha na verificacao ${verificationId}`
      );
      request.fail();
      await this.verificationRepo.update(request);
      if (webhookUrl) {
        await this.webhookProvider.send(webhookUrl, {
          verificationId: request.id,
          externalReference: request.externalReference,
          status: VerificationStatus.FAILED,
          confidenceScore: 0,
          processedAt: new Date(),
        });
      }
    }
  }
  private normalizeText(text: string): string {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();
  }
  private calculateConfidence(
    rawText: string,
    expected: ExpectedData
  ): VerificationResult {
    const cleanRawText = this.normalizeText(rawText);
    const cleanExpectedName = this.normalizeText(expected.name);

    const nameSimilarity = this.calculateSimilarity(
      cleanExpectedName,
      cleanRawText
    );
    const digitsOnly = rawText.replace(/\D/g, "");
    const cleanExpectedCpf = expected.cpf.replace(/\D/g, "");
    const cpfFound = digitsOnly.includes(cleanExpectedCpf);

    const isNameValid = nameSimilarity >= this.config.similarityThreshold;

    let finalScore = 0;

    if (isNameValid && cpfFound) {
      finalScore = Math.round(nameSimilarity * 100);
    } else {
      finalScore = 0;
    }

    return {
      confidenceScore: finalScore,
    };
  }

  private calculateSimilarity(needle: string, haystack: string): number {
    if (haystack.includes(needle)) return 1.0;

    const words = haystack.split(/\s+/);
    let bestDist = Infinity;
    const needleParts = needle.split(" ").length;

    for (let i = 0; i <= words.length - needleParts; i++) {
      const chunk = words.slice(i, i + needleParts).join(" ");
      const dist = levenshtein.get(needle, chunk);
      if (dist < bestDist) bestDist = dist;
    }

    const maxLength = Math.max(needle.length, 1);
    const similarity = 1 - bestDist / maxLength;

    return Math.max(0, similarity);
  }
}
