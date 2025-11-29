import {
  IVerificationStrategy,
  StrategyResult,
} from "../ports/IVerificationStrategy";
import { ExpectedData } from "../dtos/verification.dto";
import { TextHelper } from "../../shared/helpers/TextHelper";

export class IncomeVerificationStrategy implements IVerificationStrategy {
  private static readonly FINANCIAL_KEYWORDS = [
    "SALARIO",
    "VENCIMENTOS",
    "PROVENTOS",
    "LIQUIDO",
    "FOLHA",
    "PAGAMENTO",
    "HOLERITE",
    "EXTRATO",
    "DEMONSTRATIVO",
    "RENDIMENTOS",
  ];

  constructor(
    private readonly minScoreName: number,
    private readonly maxToleranceValue: number
  ) {}

  calculateConfidence(
    extractedText: string,
    expectedData: ExpectedData
  ): StrategyResult {
    if (!expectedData.declaredIncome) {
      return {
        passed: false,
        score: 0,
        reason: "O valor da renda não foi informado para comparação.",
      };
    }

    const cleanText = TextHelper.normalize(extractedText);

    const hasContext = IncomeVerificationStrategy.FINANCIAL_KEYWORDS.some(
      (kw) => cleanText.includes(kw)
    );
    if (!hasContext) {
      return {
        passed: false,
        score: 0,
        reason:
          "Não reconhecemos este arquivo como um comprovante de renda válido. Aceitamos Holerites, Extratos Bancários ou Declaração de IR.",
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
          "A titularidade do comprovante não foi confirmada. O documento deve estar no seu nome.",
      };
    }

    const moneyMatches = extractedText.match(/[\d\.]+,?\d{0,2}/g);

    if (!moneyMatches || moneyMatches.length === 0) {
      return {
        passed: false,
        score: 0,
        reason:
          "Não foi possível identificar valores monetários no documento. Tente enviar uma imagem com melhor resolução.",
      };
    }

    const targetIncome = expectedData.declaredIncome;
    const compatibleValue = moneyMatches.find((valStr) => {
      // Normaliza "1.200,50" -> 1200.50
      const normalized = valStr.replace(/\./g, "").replace(",", ".");
      const value = parseFloat(normalized);

      if (isNaN(value)) return false;

      const diff = Math.abs(value - targetIncome);
      return diff / targetIncome <= this.maxToleranceValue;
    });

    if (!compatibleValue) {
      return {
        passed: false,
        score: 0,
        reason: `O valor encontrado no documento diverge muito da renda declarada (R$ ${targetIncome}). Verifique se o valor declarado corresponde ao 'Líquido' ou 'Bruto' do comprovante.`,
      };
    }

    return { passed: true, score: 100 };
  }
}
