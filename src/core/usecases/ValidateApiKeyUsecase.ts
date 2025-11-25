import { IAuthRepository } from "../ports/IAuthRepository";

export class ValidateApiKeyUsecase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(key: string): Promise<boolean> {
    if (!key) return false;
    return this.authRepo.existsAndIsActive(key);
  }
}
