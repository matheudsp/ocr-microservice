import {
  IVerificationStrategy,
  StrategyResult,
} from "../ports/IVerificationStrategy";
import { ExpectedData } from "../dtos/verification.dto";
import { TextHelper } from "../../shared/helpers/TextHelper";

export class CpfVerificationStrategy implements IVerificationStrategy {
  private static readonly CPF_KEYWORDS = [
    "CPF",
    "CIC",
    "CADASTRO",
    "PESSOA",
    "FISICA",
    "MINISTERIO",
    "FAZENDA",
    "RECEITA",
    "FEDERAL",
  ];

  constructor(private readonly minScoreName: number) {}

  calculateConfidence(
    extractedText: string,
    expectedData: ExpectedData
  ): StrategyResult {
    const cleanText = TextHelper.normalize(extractedText);

    const matches = CpfVerificationStrategy.CPF_KEYWORDS.filter((kw) =>
      cleanText.includes(kw)
    ).length;

    if (matches < 2) {
      return {
        passed: false,
        score: 0,
        reason:
          "Imagem não reconhecida como um documento oficial de CPF. Por favor, envie uma foto do cartão físico ou do comprovante da Receita Federal.",
      };
    }

    const cpfPattern = /\b\d{3}[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{2}\b/g;
    const candidates = extractedText.match(cpfPattern);

    if (!candidates || candidates.length === 0) {
      return {
        passed: false,
        score: 0,
        reason: `O CPF informado (${expectedData.cpf}) não foi localizado na imagem. Verifique se o documento está legível e iluminado.`,
      };
    }

    const targetCpf = TextHelper.extractNumbers(expectedData.cpf);

    const cpfFound = candidates.some((candidate) => {
      return TextHelper.extractNumbers(candidate) === targetCpf;
    });

    if (!cpfFound) {
      return {
        passed: false,
        score: 0,
        reason: `CPF informado (${expectedData.cpf}) não foi localizado no documento.`,
      };
    }

    const nameSimilarity = TextHelper.calculateSimilarity(
      expectedData.name,
      extractedText
    );

    if (nameSimilarity < this.minScoreName) {
      return {
        passed: false,
        score: Math.round(nameSimilarity * 100),
        reason:
          "O nome presente no documento de CPF é diferente do nome cadastrado. O documento deve pertencer ao titular da conta.",
      };
    }

    return { passed: true, score: 100 };
  }
}
