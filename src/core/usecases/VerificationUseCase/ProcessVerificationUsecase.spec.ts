import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProcessVerificationUsecase } from "../../../core/usecases/VerificationUseCase/ProcessVerificationUsecase";
import { VerificationRequest } from "../../../core/domain/VerificationRequest";
import {
  DocumentType,
  VerificationStatus,
} from "../../../core/dtos/verification.dto";

// Mocks das interfaces (Ports)
const mockRepo = {
  findById: vi.fn(),
  update: vi.fn(),
  save: vi.fn(),
  findByIdOrExternalId: vi.fn(),
};

const mockStorage = {
  getFile: vi.fn(),
  saveFile: vi.fn(),
};

const mockOcr = {
  extractText: vi.fn(),
};

const mockWebhook = {
  send: vi.fn(),
};

describe("Unit - ProcessVerificationUsecase", () => {
  let useCase: ProcessVerificationUsecase;

  // Configuração padrão para os testes
  const config = {
    bucketName: "test-bucket",
    thresholds: {
      minScoreIdentity: 0.75,
      minScoreIncomeName: 0.85,
      minScoreCpfName: 0.8,
      maxToleranceIncomeValue: 0.2,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ProcessVerificationUsecase(
      mockRepo,
      mockStorage,
      mockOcr,
      mockWebhook,
      config
    );
  });

  it("deve processar um RG com sucesso e atualizar o status para COMPLETED", async () => {
    // ARRANGE
    const verificationId = "123";
    const fileKey = "docs/rg.jpg";
    const expectedData = { name: "JOAO DA SILVA", cpf: "123.456.789-00" };

    // Criamos uma entidade de domínio real para simular o banco
    const mockRequest = VerificationRequest.create(DocumentType.RG, fileKey);
    // Forçamos o ID para bater com o teste
    Object.assign(mockRequest, { id: verificationId });

    mockRepo.findById.mockResolvedValue(mockRequest);
    mockStorage.getFile.mockResolvedValue(Buffer.from("fake-image-buffer"));

    // Simulamos um OCR que retorna texto contendo as palavras chaves do RG e o nome correto
    mockOcr.extractText.mockResolvedValue(
      "REPUBLICA FEDERATIVA DO BRASIL IDENTIDADE JOAO DA SILVA 12345678900 SSP"
    );

    // ACT
    await useCase.execute({
      verificationId,
      fileKey,
      expectedData,
      webhookUrl: "http://webhook.site",
    });

    // ASSERT
    //  Deve ter marcado como Processing
    expect(mockRepo.update).toHaveBeenCalledTimes(2);

    // O OCR deve ter sido chamado
    expect(mockOcr.extractText).toHaveBeenCalled();

    //  O resultado final deve ser COMPLETED com Score alto
    expect(mockRequest.status).toBe(VerificationStatus.COMPLETED);
    expect(mockRequest.confidenceScore).toBeGreaterThanOrEqual(90);

    //  Webhook deve ser disparado
    expect(mockWebhook.send).toHaveBeenCalledWith(
      "http://webhook.site",
      expect.objectContaining({
        status: VerificationStatus.COMPLETED,
        verificationId: verificationId,
      })
    );
  });

  it("deve falhar (FAILED) se o OCR retornar erro e notificar webhook", async () => {
    // ARRANGE
    const verificationId = "error-id";
    const mockRequest = VerificationRequest.create(
      DocumentType.CNH,
      "docs/error.jpg"
    );
    Object.assign(mockRequest, { id: verificationId });

    mockRepo.findById.mockResolvedValue(mockRequest);
    mockStorage.getFile.mockResolvedValue(Buffer.from("img"));
    mockOcr.extractText.mockRejectedValue(new Error("OCR Service Down"));

    // ACT
    await useCase.execute({
      verificationId,
      fileKey: "docs/error.jpg",
      expectedData: { name: "Teste", cpf: "000" },
      webhookUrl: "http://webhook.site",
    });

    // ASSERT
    expect(mockRequest.status).toBe(VerificationStatus.FAILED);
    expect(mockRequest.failReason).toBe("OCR Service Down");
    expect(mockWebhook.send).toHaveBeenCalledWith(
      "http://webhook.site",
      expect.objectContaining({
        status: VerificationStatus.FAILED,
        failReason: "OCR Service Down",
      })
    );
  });

  it("deve lançar erro se a solicitação não for encontrada no banco", async () => {
    // ARRANGE
    mockRepo.findById.mockResolvedValue(null);

    // ACT & ASSERT
    await expect(
      useCase.execute({
        verificationId: "inexistente",
        fileKey: "key",
        expectedData: { name: "", cpf: "" },
      })
    ).rejects.toThrow("Solicitação não encontrada");
  });
});
