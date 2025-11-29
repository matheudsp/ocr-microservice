export enum DocumentType {
  RG = "RG",
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
export interface VerificationThresholds {
  minScoreIdentity: number; // Para RG/CNH
  minScoreIncomeName: number; // Para Holerite (Nome)
  minScoreCpfName: number; // Para CPF (Nome)
  maxToleranceIncomeValue: number; // Para Holerite (Valor)
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
  thresholds: VerificationThresholds;
}
