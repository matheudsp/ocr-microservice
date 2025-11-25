import { randomBytes } from "node:crypto";
import { IAuthRepository } from "../ports/IAuthRepository";

interface Output {
  key: string;
  client: string;
}

export class CreateApiKeyUsecase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(clientName: string): Promise<Output> {
    if (!clientName) {
      throw new Error("Nome do cliente é obrigatório");
    }

    const generatedKey = `sk_${randomBytes(16).toString("hex")}`;

    const apiKey = await this.authRepo.create(clientName, generatedKey);

    return {
      client: apiKey.client,
      key: apiKey.key,
    };
  }
}
