import { ApiKey } from "@infra/config/prisma/generated/client";

export interface IAuthRepository {
  existsAndIsActive(key: string): Promise<boolean>;
  create(clientName: string, key: string): Promise<ApiKey>;
}
