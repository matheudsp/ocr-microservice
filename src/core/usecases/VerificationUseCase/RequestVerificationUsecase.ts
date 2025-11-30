import { VerificationRequest } from "../../domain/VerificationRequest";
import { DocumentType, ExpectedData } from "../../dtos/verification.dto";
import { IQueueProvider } from "../../ports/IQueueProvider";
import { IStorageProvider } from "../../ports/IStorageProvider";
import { IVerificationRepository } from "../../ports/IVerificationRepository";

interface RequestVerificationInput {
  file: {
    buffer: Buffer;
    filename: string;
    mimetype: string;
  };
  metadata: {
    externalReference?: string;
    documentType: DocumentType;
    expectedData: ExpectedData;
  };
  webhookUrl?: string;
  webhookSecret?: string;
}

interface RequestVerificationOutput {
  verificationId: string;
  status: string;
}

export class RequestVerificationUsecase {
  // private readonly serviceName: string = RequestVerificationUsecase.name;
  constructor(
    private storageProvider: IStorageProvider,
    private verificationRepo: IVerificationRepository,
    private queueProvider: IQueueProvider,
    private bucketName: string
  ) {}

  async execute(
    input: RequestVerificationInput
  ): Promise<RequestVerificationOutput> {
    const { file, metadata, webhookUrl, webhookSecret } = input;

    const safeFileName = `${Date.now()}-${file.filename.replace(/\s+/g, "_")}`;

    const fileKey = await this.storageProvider.saveFile(
      this.bucketName,
      safeFileName,
      file.buffer,
      file.mimetype
    );

    const verificationRequest = VerificationRequest.create(
      metadata.documentType,
      fileKey,
      metadata.externalReference
    );

    await this.verificationRepo.save(verificationRequest);

    await this.queueProvider.addJob("ocr-processing-queue", {
      verificationId: verificationRequest.id,
      fileKey: verificationRequest.fileKey,
      expectedData: metadata.expectedData,
      webhookUrl: webhookUrl,
      webhookSecret: webhookSecret,
      externalReference: metadata.externalReference,
    });

    return {
      verificationId: verificationRequest.id,
      status: verificationRequest.status,
    };
  }
}
