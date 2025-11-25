import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaVerificationRepo } from "./PrismaVerificationRepo";
import { VerificationRequest } from "@core/domain/VerificationRequest";
import { DocumentType, VerificationStatus } from "@core/dtos/verification.dto";
import { prisma } from "@infra/config/prisma/prisma";

describe("PrismaVerificationRepo (Integration)", () => {
  let repo: PrismaVerificationRepo;

  beforeAll(async () => {
    repo = new PrismaVerificationRepo();
    // Garante conexão
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Limpa a tabela antes de cada teste para isolamento
    await prisma.verificationRequest.deleteMany();
  });

  it("deve salvar e recuperar uma solicitação corretamente", async () => {
    // ARRANGE
    const request = VerificationRequest.create(
      DocumentType.CNH,
      "uploads/cnh-test.jpg",
      "user-uuid-123" // External Reference
    );

    // ACT
    await repo.save(request);
    const retrieved = await repo.findById(request.id);

    // ASSERT
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(request.id);
    expect(retrieved?.documentType).toBe(DocumentType.CNH);
    expect(retrieved?.fileKey).toBe("uploads/cnh-test.jpg");
    expect(retrieved?.externalReference).toBe("user-uuid-123");
    expect(retrieved?.status).toBe(VerificationStatus.PENDING);
    // Dados sensíveis NÃO devem existir na entidade recuperada (nem no banco)
    expect((retrieved as any).expectedData).toBeUndefined();
  });

  it("deve atualizar o status e o score da solicitação", async () => {
    // ARRANGE
    const request = VerificationRequest.create(
      DocumentType.RG_FRENTE,
      "uploads/rg.jpg"
    );
    await repo.save(request);

    // ACT - Simula o processamento
    request.markAsProcessing();
    await repo.update(request);

    request.complete(95); // Score 95
    await repo.update(request);

    const updatedRequest = await repo.findById(request.id);

    // ASSERT
    expect(updatedRequest?.status).toBe(VerificationStatus.COMPLETED);
    expect(updatedRequest?.confidenceScore).toBe(95);
  });
});
