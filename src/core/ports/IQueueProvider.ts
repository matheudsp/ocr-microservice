import { ExpectedData } from "@core/dtos/verification.dto";

export interface VerificationJobData {
  verificationId: string;
  fileKey: string;
  expectedData: ExpectedData;
  webhookUrl?: string;
  externalReference?: string;
}

export interface IQueueProvider {
  addJob(queueName: string, data: VerificationJobData): Promise<void>;
}
