import { DocumentType, VerificationThresholds } from "../dtos/verification.dto";
import { IVerificationStrategy } from "../ports/IVerificationStrategy";
import { IdentityVerificationStrategy } from "../strategies/IdentityVerificationStrategy";
import { IncomeVerificationStrategy } from "../strategies/IncomeVerificationStrategy";
import { CpfVerificationStrategy } from "../strategies/CpfVerificationStrategy";

export class VerificationStrategyFactory {
  static create(
    type: DocumentType,
    config: VerificationThresholds
  ): IVerificationStrategy {
    switch (type) {
      case DocumentType.RG:
      case DocumentType.CNH:
        return new IdentityVerificationStrategy(config.minScoreIdentity);

      case DocumentType.COMPROVANTE_RENDA:
        return new IncomeVerificationStrategy(
          config.minScoreIncomeName,
          config.maxToleranceIncomeValue
        );

      case DocumentType.CPF:
        return new CpfVerificationStrategy(config.minScoreCpfName);

      default:
        throw new Error(`Estratégia não definida para: ${type}`);
    }
  }
}
