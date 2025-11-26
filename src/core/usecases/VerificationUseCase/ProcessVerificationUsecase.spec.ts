import { describe, it, expect, vi, beforeEach } from "vitest";
import { env } from "../../config/env";
import { ProcessVerificationUsecase } from "./ProcessVerificationUsecase";
import { IVerificationRepository } from "../../ports/IVerificationRepository";
import { IStorageProvider } from "../../ports/IStorageProvider";
import { IOcrProvider } from "../../ports/IOcrProvider";
import { VerificationRequest } from "../../domain/VerificationRequest";
import {
  DocumentType,
  VerificationStatus,
  VerificationConfig,
} from "../../dtos/verification.dto";

vi.mock("@infra/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mocks das dependências
const mockRepo = {
  findById: vi.fn(),
  update: vi.fn(),
  save: vi.fn(),
} as unknown as IVerificationRepository;

const mockStorage = {
  getFile: vi.fn(),
  saveFile: vi.fn(),
} as unknown as IStorageProvider;

const mockOcr = {
  extractText: vi.fn(),
} as unknown as IOcrProvider;

const config: VerificationConfig = {
  bucketName: "test-bucket",
  similarityThreshold: env.OCR_THRESHOLD, // 70% de similaridade mínima
};

// Dados de teste "seguros" (apenas em memória no teste)
const safeVerificationId = "uuid-123";
const safeFileKey = "docs/rg-frente.jpg";
const sensitiveData = {
  name: "João da Silva",
  cpf: "123.456.789-00",
};

describe("ProcessVerificationUsecase", () => {
  let usecase: ProcessVerificationUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new ProcessVerificationUsecase(
      mockRepo,
      mockStorage,
      mockOcr,
      config
    );
  });

  it("deve processar com sucesso e aprovar quando o OCR corresponde aos dados", async () => {
    // ARRANGE
    // 1. O registro existe no banco (estado inicial PENDING)
    const existingRequest = VerificationRequest.create(
      DocumentType.RG_FRENTE,
      safeFileKey
    );
    // Forçamos o ID para bater com o mock
    Object.defineProperty(existingRequest, "id", { value: safeVerificationId });

    vi.spyOn(mockRepo, "findById").mockResolvedValue(existingRequest);

    // 2. O Storage retorna um buffer fake
    vi.spyOn(mockStorage, "getFile").mockResolvedValue(
      Buffer.from("fake-image")
    );

    // 3. O OCR retorna o texto correto (simulando leitura perfeita)
    vi.spyOn(mockOcr, "extractText").mockResolvedValue(
      "NOME: JOAO DA SILVA CPF: 12345678900"
    );

    // ACT
    await usecase.execute({
      verificationId: safeVerificationId,
      fileKey: safeFileKey,
      expectedData: sensitiveData,
    });

    // ASSERT
    // Verifica se mudou para PROCESSING
    expect(mockRepo.update).toHaveBeenCalledTimes(2);

    // Verifica o estado final da entidade
    expect(existingRequest.status).toBe(VerificationStatus.COMPLETED);
    // Como o texto do OCR foi "perfeito", o score deve ser 100
    expect(existingRequest.confidenceScore).toBe(100);
  });

  it("deve reprovar (score 0) quando o nome não tem similaridade suficiente", async () => {
    // ARRANGE
    const existingRequest = VerificationRequest.create(
      DocumentType.RG_FRENTE,
      safeFileKey
    );
    vi.spyOn(mockRepo, "findById").mockResolvedValue(existingRequest);
    vi.spyOn(mockStorage, "getFile").mockResolvedValue(
      Buffer.from("fake-image")
    );

    // OCR retorna nome totalmente diferente
    vi.spyOn(mockOcr, "extractText").mockResolvedValue(
      "NOME: MARIA OLIVEIRA CPF: 12345678900"
    );

    // ACT
    await usecase.execute({
      verificationId: safeVerificationId,
      fileKey: safeFileKey,
      expectedData: sensitiveData,
    });

    // ASSERT
    expect(existingRequest.status).toBe(VerificationStatus.COMPLETED);
    expect(existingRequest.confidenceScore).toBe(0);
  });

  it("deve reprovar (score 0) quando o CPF não é encontrado no texto", async () => {
    // ARRANGE
    const existingRequest = VerificationRequest.create(
      DocumentType.RG_FRENTE,
      safeFileKey
    );
    vi.spyOn(mockRepo, "findById").mockResolvedValue(existingRequest);
    vi.spyOn(mockStorage, "getFile").mockResolvedValue(
      Buffer.from("fake-image")
    );

    // OCR retorna nome certo, mas CPF errado
    vi.spyOn(mockOcr, "extractText").mockResolvedValue(
      "NOME: JOAO DA SILVA CPF: 99999999999"
    );

    // ACT
    await usecase.execute({
      verificationId: safeVerificationId,
      fileKey: safeFileKey,
      expectedData: sensitiveData,
    });

    // ASSERT
    expect(existingRequest.confidenceScore).toBe(0);
  });

  it("deve lidar com falhas no OCR marcando o registro como FAILED", async () => {
    // ARRANGE
    const existingRequest = VerificationRequest.create(
      DocumentType.RG_FRENTE,
      safeFileKey
    );
    vi.spyOn(mockRepo, "findById").mockResolvedValue(existingRequest);
    vi.spyOn(mockStorage, "getFile").mockResolvedValue(
      Buffer.from("fake-image")
    );

    // Simula erro no OCR (ex: API do Google fora do ar)
    vi.spyOn(mockOcr, "extractText").mockRejectedValue(new Error("OCR Failed"));

    // ACT
    await usecase.execute({
      verificationId: safeVerificationId,
      fileKey: safeFileKey,
      expectedData: sensitiveData,
    });

    // ASSERT
    expect(existingRequest.status).toBe(VerificationStatus.FAILED);
    expect(mockRepo.update).toHaveBeenCalled();
  });

  it("deve lançar erro se a solicitação não existir no repositório", async () => {
    // ARRANGE
    vi.spyOn(mockRepo, "findById").mockResolvedValue(null);

    // ACT & ASSERT
    await expect(
      usecase.execute({
        verificationId: "invalid-id",
        fileKey: safeFileKey,
        expectedData: sensitiveData,
      })
    ).rejects.toThrow("Solicitação não encontrada");
  });
});
