import { VerificationStatus } from "../dtos/verification.dto";

export interface WebhookPayload {
  verificationId: string;
  externalReference?: string;
  status: VerificationStatus;
  passed: boolean;
  failReason?: string;
  confidenceScore?: number;
  processedAt: Date;
}

export interface IWebhookProvider {
  send(url: string, payload: WebhookPayload): Promise<void>;
}
