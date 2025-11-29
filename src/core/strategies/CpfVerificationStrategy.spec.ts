import { describe, it, expect, beforeEach } from "vitest";
import { CpfVerificationStrategy } from "../../core/strategies/CpfVerificationStrategy";
import { ExpectedData } from "../../core/dtos/verification.dto";

describe("Unit - CpfVerificationStrategy", () => {
  let strategy: CpfVerificationStrategy;
  const MIN_SCORE_NAME = 0.8;

  beforeEach(() => {
    strategy = new CpfVerificationStrategy(MIN_SCORE_NAME);
  });

  it("deve APROVAR um documento de CPF válido com formatação (pontos e traço)", () => {
    const extractedText = `
      MINISTERIO DA FAZENDA
      RECEITA FEDERAL
      CPF: 123.456.789-00
      NOME: FULANO DE TAL
    `;
    const expectedData: ExpectedData = {
      name: "Fulano de Tal",
      cpf: "12345678900", // Input sem formatação
    };

    const result = strategy.calculateConfidence(extractedText, expectedData);

    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("deve APROVAR mesmo se o OCR trouxer o CPF sem formatação no meio do texto", () => {
    const extractedText = `
      REPÚBLICA FEDERATIVA
      CADASTRO DE PESSOAS FÍSICAS
      12345678900
      BELTRANO DA SILVA
    `;
    const expectedData: ExpectedData = {
      name: "Beltrano da Silva",
      cpf: "123.456.789-00",
    };

    const result = strategy.calculateConfidence(extractedText, expectedData);

    expect(result.passed).toBe(true);
  });

  it("deve REPROVAR se o contexto do documento não parecer um CPF (falta de keywords)", () => {
    const extractedText = `
      CARTÃO DE VISITAS
      Designer Gráfico
      Tel: 123.456.789-00
    `;
    const expectedData: ExpectedData = {
      name: "Designer",
      cpf: "12345678900",
    };

    const result = strategy.calculateConfidence(extractedText, expectedData);

    expect(result.passed).toBe(false);
    expect(result.reason).toContain(
      "Imagem não reconhecida como um documento oficial"
    );
  });

  it("deve REPROVAR se o CPF encontrado não for o esperado", () => {
    const extractedText = `
      RECEITA FEDERAL CPF
      NOME: CICLANO
      NUMERO: 999.999.999-99
    `;
    const expectedData: ExpectedData = {
      name: "Ciclano",
      cpf: "111.111.111-11", // Esperado diferente do encontrado
    };

    const result = strategy.calculateConfidence(extractedText, expectedData);

    expect(result.passed).toBe(false);
    expect(result.reason).toContain("não foi localizado no documento");
  });
});
