import {
  IVerificationStrategy,
  StrategyResult,
} from "../ports/IVerificationStrategy";
import { ExpectedData } from "../dtos/verification.dto";
import { TextHelper } from "../../shared/helpers/TextHelper";

export class IdentityVerificationStrategy implements IVerificationStrategy {
  constructor(private readonly minScoreIdentity: number) {}

  private static readonly RG_KEYWORDS = [
    "REPUBLICA",
    "FEDERATIVA",
    "BRASIL",
    "SEGURANCA",
    "INSTITUTO",
    "IDENTIFICACAO",
    "TERRITORIO",
    "NACIONAL",
    "LEI",
    "REGISTRO",
    "GERAL",
    "SSP",
    "NATURALIDADE",
    "FILIACAO",
    "ASSINATURA",
  ];

  calculateConfidence(
    extractedText: string,
    expectedData: ExpectedData
  ): StrategyResult {
    const cleanText = TextHelper.normalize(extractedText);
    const cleanExpectedName = TextHelper.normalize(expectedData.name);

    const contextCheck = this.validateDocumentContext(cleanText);
    if (!contextCheck.passed) {
      return { passed: false, score: 0, reason: contextCheck.reason };
    }

    const textDigits = TextHelper.extractNumbers(extractedText);
    const cpfDigits = TextHelper.extractNumbers(expectedData.cpf);
    const cpfFound = textDigits.includes(cpfDigits);

    if (!cpfFound) {
      return {
        passed: false,
        score: 0,
        reason:
          "Não conseguimos ler o número do CPF no documento. Verifique se a imagem está nítida e sem cortes.",
      };
    }

    const nameSimilarity = TextHelper.calculateSimilarity(
      cleanExpectedName,
      cleanText
    );

    if (nameSimilarity < this.minScoreIdentity) {
      return {
        passed: false,

        score: Math.round(nameSimilarity * 100),
        reason: `O nome identificado no documento não confere com o nome do cadastro (${expectedData.name}). Por favor, envie um documento de sua titularidade.`,
      };
    }

    return { passed: true, score: Math.round(nameSimilarity * 100) };
  }

  private validateDocumentContext(text: string): {
    passed: boolean;
    reason?: string;
  } {
    let matches = 0;
    const MIN_KEYWORDS_MATCH = 3;

    for (const keyword of IdentityVerificationStrategy.RG_KEYWORDS) {
      if (text.includes(keyword)) {
        matches++;
      }
    }

    if (matches < MIN_KEYWORDS_MATCH) {
      return {
        passed: false,
        reason:
          "Não identificamos este documento como um RG válido. Certifique-se de enviar o lado do documento com os dados de forma legível.",
      };
    }

    return { passed: true };
  }
}
