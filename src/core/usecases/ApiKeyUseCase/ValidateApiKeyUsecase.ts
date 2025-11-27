import { ApiKey } from "@core/domain/ApiKey";
import { IAuthRepository } from "../../ports/IAuthRepository";

export class ValidateApiKeyUsecase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(key: string, requestIp?: string): Promise<ApiKey | null> {
    if (!key) return null;

    const apiKey = await this.authRepo.findByKey(key);

    if (!apiKey) return null;
    if (!apiKey.isActive) return null;

    if (apiKey.allowedIp) {
      if (!requestIp || apiKey.allowedIp !== requestIp) {
        return null;
      }
    }

    return apiKey;
  }
}
