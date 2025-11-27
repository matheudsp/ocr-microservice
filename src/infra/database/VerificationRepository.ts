import { IVerificationRepository } from "@core/ports/IVerificationRepository";
import { VerificationRequest } from "@core/domain/VerificationRequest";
import { db } from "../config/drizzle/database";
import { verificationRequests } from "../config/drizzle/schema";
import { eq, or } from "drizzle-orm";
import { VerificationStatus, DocumentType } from "@core/dtos/verification.dto";

export class VerificationRepository implements IVerificationRepository {
  async save(request: VerificationRequest): Promise<void> {
    await db.insert(verificationRequests).values({
      id: request.id,
      externalReference: request.externalReference,
      documentType: request.documentType,
      fileKey: request.fileKey,
      status: request.status,
      confidenceScore: request.confidenceScore ?? 0,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      failReason: request.failReason,
    });
  }

  async findById(id: string): Promise<VerificationRequest | null> {
    const [result] = await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.id, id));

    if (!result) return null;

    return this.mapToDomain(result);
  }

  async findByIdOrExternalId(
    identifier: string
  ): Promise<VerificationRequest | null> {
    const [result] = await db
      .select()
      .from(verificationRequests)
      .where(
        or(
          eq(verificationRequests.id, identifier),
          eq(verificationRequests.externalReference, identifier)
        )
      );

    if (!result) return null;

    return this.mapToDomain(result);
  }

  async update(request: VerificationRequest): Promise<void> {
    await db
      .update(verificationRequests)
      .set({
        status: request.status as any,
        failReason: request.failReason,
        confidenceScore: request.confidenceScore ?? 0,
        updatedAt: new Date(),
      })
      .where(eq(verificationRequests.id, request.id));
  }

  private mapToDomain(
    raw: typeof verificationRequests.$inferSelect
  ): VerificationRequest {
    return VerificationRequest.restore({
      id: raw.id,
      externalReference: raw.externalReference ?? undefined,
      documentType: raw.documentType as DocumentType,
      fileKey: raw.fileKey,
      status: raw.status as VerificationStatus,
      failReason: raw.failReason ?? undefined,
      confidenceScore: raw.confidenceScore ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
