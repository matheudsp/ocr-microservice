export enum DocumentType {
  RG_FRENTE = "RG_FRENTE",
  RG_VERSO = "RG_VERSO",
  CNH = "CNH",
  CPF = "CPF",
  COMPROVANTE_RENDA = "COMPROVANTE_RENDA",
}

export enum VerificationStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface ExpectedData {
  name: string;
  cpf: string;
  declaredIncome?: number;
}

export interface VerificationResult {
  confidenceScore: number; // 0 ~ 100
}

export interface VerificationConfig {
  bucketName: string;
  similarityThreshold: number; // 0.1 ~ 1.0
}
