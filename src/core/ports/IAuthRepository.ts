import { ApiKey } from "@core/domain/ApiKey";

export interface CreateApiKeyInput {
  clientName: string;
  key: string;
  role?: "ADMIN" | "CLIENT";
  webhookUrl?: string;
  allowedIp?: string;
  webhookSecret?: string;
}

export interface IAuthRepository {
  findByKey(key: string): Promise<ApiKey | null>;
  create(data: CreateApiKeyInput): Promise<ApiKey>;
}
