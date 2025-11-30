import { randomBytes } from "node:crypto";
import { IAuthRepository } from "../../ports/IAuthRepository";

interface Input {
  client: string;
  webhookUrl?: string;
  allowedIp?: string;
}

interface Output extends Input {
  key: string;
  webhookSecret?: string;
}

export class CreateApiKeyUsecase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(input: Input): Promise<Output> {
    if (!input.client) {
      throw new Error("Nome do cliente é obrigatório");
    }

    const generatedKey = `sk_client_${randomBytes(16).toString("hex")}`;
    const generatedSecret = input.webhookUrl
      ? `whsec_${randomBytes(24).toString("hex")}`
      : undefined;
    const apiKey = await this.authRepo.create({
      clientName: input.client,
      key: generatedKey,
      webhookUrl: input.webhookUrl,
      allowedIp: input.allowedIp,
      webhookSecret: generatedSecret,
    });

    return {
      client: apiKey.client,
      key: apiKey.key,
      webhookUrl: apiKey.webhookUrl ?? undefined,
      webhookSecret: apiKey.webhookSecret,
      allowedIp: apiKey.allowedIp ?? undefined,
    };
  }
}
