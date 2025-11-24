import { VerificationRequest } from "../domain/VerificationRequest";

export interface IVerificationRepository {
  save(request: VerificationRequest): Promise<void>;
  findById(id: string): Promise<VerificationRequest | null>;
  update(request: VerificationRequest): Promise<void>;
}
