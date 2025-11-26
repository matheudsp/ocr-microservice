import { IAuthRepository } from "../../ports/IAuthRepository";

export class ValidateAdminKeyUsecase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(key: string): Promise<boolean> {
    if (!key) return false;

    const apiKey = await this.authRepo.findByKey(key);

    if (!apiKey) return false;
    if (!apiKey.isActive) return false;

    return apiKey.role === "ADMIN";
  }
}
