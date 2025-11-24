export interface VerificationJobData {
  verificationId: string;
  fileKey: string;
}

export interface IQueueProvider {
  addJob(queueName: string, data: VerificationJobData): Promise<void>;
}
