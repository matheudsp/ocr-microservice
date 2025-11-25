import { randomUUID } from "crypto";
import { DocumentType, VerificationStatus } from "../dtos/verification.dto";

export interface VerificationRequestProps {
  id: string;
  externalReference?: string;
  documentType: DocumentType;
  fileKey: string;
  status: VerificationStatus;
  confidenceScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class VerificationRequest {
  public readonly id: string;
  public readonly externalReference?: string;
  public readonly documentType: DocumentType;
  public readonly fileKey: string;
  public status: VerificationStatus;
  public confidenceScore?: number;
  public readonly createdAt: Date;
  public updatedAt: Date;

  private constructor(props: VerificationRequestProps) {
    this.id = props.id;
    this.externalReference = props.externalReference;
    this.documentType = props.documentType;
    this.fileKey = props.fileKey;
    this.status = props.status;
    this.confidenceScore = props.confidenceScore;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    documentType: DocumentType,
    fileKey: string,
    externalReference?: string
  ): VerificationRequest {
    return new VerificationRequest({
      id: randomUUID(),
      externalReference,
      documentType,
      fileKey,
      status: VerificationStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static restore(props: VerificationRequestProps): VerificationRequest {
    return new VerificationRequest(props);
  }

  markAsProcessing(): void {
    if (this.status !== VerificationStatus.PENDING) {
      throw new Error("Documento já está sendo processado ou finalizado.");
    }
    this.status = VerificationStatus.PROCESSING;
    this.updatedAt = new Date();
  }

  complete(score: number): void {
    this.confidenceScore = score;
    this.status = VerificationStatus.COMPLETED;
    this.updatedAt = new Date();
  }

  fail(): void {
    this.status = VerificationStatus.FAILED;
    this.updatedAt = new Date();
  }
}
