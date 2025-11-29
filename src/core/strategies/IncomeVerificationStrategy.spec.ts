import { describe, it, expect, beforeEach } from "vitest";
import { IncomeVerificationStrategy } from "../../core/strategies/IncomeVerificationStrategy";
import { ExpectedData } from "../../core/dtos/verification.dto";

describe("Unit - IncomeVerificationStrategy", () => {
  let strategy: IncomeVerificationStrategy;

  // Configuração conforme definido no .env
  const MIN_SCORE_NAME = 0.85;
  const MAX_TOLERANCE_VALUE = 0.2; // 20%

  beforeEach(() => {
    strategy = new IncomeVerificationStrategy(
      MIN_SCORE_NAME,
      MAX_TOLERANCE_VALUE
    );
  });

  it("deve APROVAR se o texto contiver palavras-chave, nome correto e renda dentro da tolerância", () => {
    const extractedText = `
      DEMONSTRATIVO DE PAGAMENTO
      Empresa XYZ
      Funcionario: MARIA DA SILVA
      Salário Líquido: R$ 5.000,00
    `;
    const expectedData: ExpectedData = {
      name: "Maria da Silva",
      cpf: "123",
      declaredIncome: 5000.0,
    };

    const result = strategy.calculateConfidence(extractedText, expectedData);

    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("deve APROVAR com renda ligeiramente diferente mas DENTRO da tolerância (ex: +10%)", () => {
    const extractedText = `
      HOLERITE MENSAL
      NOME: JOAO SANTOS
      TOTAL LIQUIDO: 2.200,00
    `;
    // Declarou 2000, documento tem 2200 (10% de diferença, aceitável pois < 20%)
    const expectedData: ExpectedData = {
      name: "Joao Santos",
      cpf: "123",
      declaredIncome: 2000.0,
    };

    const result = strategy.calculateConfidence(extractedText, expectedData);

    expect(result.passed).toBe(true);
  });

  it("deve REPROVAR se a renda estiver FORA da tolerância (> 20%)", () => {
    const extractedText = `
      EXTRATO BANCARIO
      CLIENTE: ANA PEREIRA
      SALDO FINAL: 10.000,00
    `;
    // Declarou 5000, documento tem 10000 (100% de diferença)
    const expectedData: ExpectedData = {
      name: "Ana Pereira",
      cpf: "123",
      declaredIncome: 5000.0,
    };

    const result = strategy.calculateConfidence(extractedText, expectedData);

    expect(result.passed).toBe(false);
    expect(result.reason).toContain("diverge muito da renda declarada");
  });

  it("deve REPROVAR se não encontrar palavras-chave financeiras (Contexto inválido)", () => {
    const extractedText = `
      RECEITA DE BOLO
      Ingredientes: Farinha, Ovos...
      Valor calórico: 2000
    `;
    const expectedData: ExpectedData = {
      name: "Qualquer Um",
      cpf: "123",
      declaredIncome: 2000,
    };

    const result = strategy.calculateConfidence(extractedText, expectedData);

    expect(result.passed).toBe(false);
    expect(result.reason).toContain(
      "Não reconhecemos este arquivo como um comprovante de renda válido"
    );
  });

  it("deve REPROVAR se o nome no documento for totalmente diferente", () => {
    const extractedText = `
      HOLERITE
      Funcionario: CARLOS DRUMMOND
      Liquido: 3000,00
    `;
    const expectedData: ExpectedData = {
      name: "Vinicius de Moraes", // Nome diferente
      cpf: "123",
      declaredIncome: 3000,
    };

    const result = strategy.calculateConfidence(extractedText, expectedData);

    expect(result.passed).toBe(false);
    expect(result.reason).toContain(
      "A titularidade do comprovante não foi confirmada"
    );
  });
});
