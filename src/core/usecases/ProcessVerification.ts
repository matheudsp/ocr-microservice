import levenshtein from "fast-levenshtein";
import { IVerificationRepository } from "../ports/IVerificationRepository";
import { IStorageProvider } from "../ports/IStorageProvider";
import { IOcrProvider } from "../ports/IOcrProvider";
import {
  VerificationResult,
  VerificationConfig,
} from "../dtos/verification.dto";
import { logger } from "@infra/logger";

interface ProcessVerificationInput {
  verificationId: string;
  fileKey: string;
}

export class ProcessVerification {
  private readonly serviceName: string = "ProcessVerification";
  constructor(
    private verificationRepo: IVerificationRepository,
    private storageProvider: IStorageProvider,
    private ocrProvider: IOcrProvider,
    private config: VerificationConfig
  ) {}

  async execute(input: ProcessVerificationInput): Promise<void> {
    const { verificationId, fileKey } = input;

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

      const result = this.calculateConfidence(
        extractedText,
        request.expectedData
      );

      request.complete(result);
      await this.verificationRepo.save(request);

      logger.info(
        `Verificacao ${verificationId} concluida. Score: ${result.confidenceScore}`
      );
    } catch (error) {
      logger.error(
        { service: this.serviceName, err: error },
        `Falha na verificacao ${verificationId}`
      );
      request.fail();
      await this.verificationRepo.update(request);
    }
  }

  private calculateConfidence(
    rawText: string,
    expected: { name: string; cpf: string }
  ): VerificationResult {
    const cleanRawText = rawText.toUpperCase();
    const cleanExpectedName = expected.name.toUpperCase();

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
      extractedText: rawText.slice(0, 200) + "...",
      matchedName: isNameValid,
      matchedCpf: cpfFound,
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
