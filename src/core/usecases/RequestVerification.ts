import { VerificationRequest } from "../domain/VerificationRequest";
import { DocumentType, ExpectedData } from "../dtos/verification.dto";
import { IQueueProvider } from "../ports/IQueueProvider";
import { IStorageProvider } from "../ports/IStorageProvider";
import { IVerificationRepository } from "../ports/IVerificationRepository";

interface RequestVerificationInput {
  file: {
    buffer: Buffer;
    filename: string;
    mimetype: string;
  };
  metadata: {
    userId: string;
    documentType: DocumentType;
    expectedData: ExpectedData;
  };
}

interface RequestVerificationOutput {
  verificationId: string;
  status: string;
}

export class RequestVerification {
  constructor(
    private storageProvider: IStorageProvider,
    private verificationRepo: IVerificationRepository,
    private queueProvider: IQueueProvider,
    private bucketName: string
  ) {}

  async execute(
    input: RequestVerificationInput
  ): Promise<RequestVerificationOutput> {
    const { file, metadata } = input;

    const safeFileName = `${Date.now()}-${file.filename.replace(/\s+/g, "_")}`;

    const fileKey = await this.storageProvider.saveFile(
      this.bucketName,
      safeFileName,
      file.buffer,
      file.mimetype
    );

    const verificationRequest = VerificationRequest.create(
      metadata.userId,
      metadata.documentType,
      fileKey,
      metadata.expectedData
    );

    await this.verificationRepo.save(verificationRequest);

    await this.queueProvider.addJob("ocr-processing-queue", {
      verificationId: verificationRequest.id,
      fileKey: verificationRequest.fileKey,
    });

    return {
      verificationId: verificationRequest.id,
      status: verificationRequest.status,
    };
  }
}
