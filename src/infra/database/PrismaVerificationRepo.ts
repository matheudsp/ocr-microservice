import { IVerificationRepository } from "@core/ports/IVerificationRepository";
import { VerificationRequest } from "@core/domain/VerificationRequest";
import { prisma } from "../config/prisma/prisma";
import { VerificationStatus, DocumentType } from "@core/dtos/verification.dto";

export class PrismaVerificationRepo implements IVerificationRepository {
  async save(request: VerificationRequest): Promise<void> {
    await prisma.verificationRequest.create({
      data: {
        id: request.id,
        externalReference: request.externalReference,
        documentType: request.documentType as DocumentType,
        fileKey: request.fileKey,
        status: request.status as VerificationStatus,
        confidenceScore: request.confidenceScore ?? 0,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<VerificationRequest | null> {
    const raw = await prisma.verificationRequest.findUnique({
      where: { id },
    });

    if (!raw) return null;

    return VerificationRequest.restore({
      id: raw.id,
      externalReference: raw.externalReference!,
      documentType: raw.documentType as DocumentType,
      fileKey: raw.fileKey,
      status: raw.status as VerificationStatus,
      confidenceScore: raw.confidenceScore!,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
  async findByIdOrExternalId(
    identifier: string
  ): Promise<VerificationRequest | null> {
    const raw = await prisma.verificationRequest.findFirst({
      where: {
        OR: [{ id: identifier }, { externalReference: identifier }],
      },
    });

    if (!raw) return null;

    return VerificationRequest.restore({
      id: raw.id,
      externalReference: raw.externalReference!,
      documentType: raw.documentType as DocumentType,
      fileKey: raw.fileKey,
      status: raw.status as VerificationStatus,
      confidenceScore: raw.confidenceScore!,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
  async update(request: VerificationRequest): Promise<void> {
    await prisma.verificationRequest.update({
      where: { id: request.id },
      data: {
        status: request.status as any,
        confidenceScore: request.confidenceScore ?? 0,
        updatedAt: new Date(),
      },
    });
  }
}
