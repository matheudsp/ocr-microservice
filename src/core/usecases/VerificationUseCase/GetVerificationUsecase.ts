import { IVerificationRepository } from "../../ports/IVerificationRepository";

interface GetVerificationOutput {
  id: string;
  externalReference?: string;
  documentType: string;
  status: string;
  confidenceScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class GetVerificationUsecase {
  constructor(private verificationRepo: IVerificationRepository) {}

  async execute(id: string): Promise<GetVerificationOutput | null> {
    const verification = await this.verificationRepo.findByIdOrExternalId(id);

    if (!verification) {
      return null;
    }

    return {
      id: verification.id,
      externalReference: verification.externalReference,
      documentType: verification.documentType,
      status: verification.status,
      confidenceScore: verification.confidenceScore,
      createdAt: verification.createdAt,
      updatedAt: verification.updatedAt,
    };
  }
}
