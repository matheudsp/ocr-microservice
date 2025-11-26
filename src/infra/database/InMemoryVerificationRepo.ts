import { IVerificationRepository } from "@core/ports/IVerificationRepository";
import { VerificationRequest } from "@core/domain/VerificationRequest";
import { logger } from "@infra/logger";

export class InMemoryVerificationRepo implements IVerificationRepository {
  // mimic a database table in memory (ram)
  private db = new Map<string, VerificationRequest>();

  async save(request: VerificationRequest): Promise<void> {
    this.db.set(request.id, request);
    logger.info(
      { verificationId: request.id, status: request.status },
      "Registro salvo no banco em memória"
    );
  }

  async findById(id: string): Promise<VerificationRequest | null> {
    const item = this.db.get(id);
    return item ? VerificationRequest.restore(item) : null;
  }

  async findByIdOrExternalId(
    identifier: string
  ): Promise<VerificationRequest | null> {
    const byId = this.db.get(identifier);
    if (byId) return VerificationRequest.restore(byId);

    for (const item of this.db.values()) {
      if (item.externalReference === identifier) {
        return VerificationRequest.restore(item);
      }
    }

    return null;
  }

  async update(request: VerificationRequest): Promise<void> {
    this.db.set(request.id, request);
  }
}
