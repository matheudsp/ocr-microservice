import {
  IAuthRepository,
  CreateApiKeyInput,
} from "@core/ports/IAuthRepository";
import { db } from "../config/drizzle/database";
import { apiKeys } from "../config/drizzle/schema";
import { ApiKey, ApiKeyRole } from "@core/domain/ApiKey";
import { eq } from "drizzle-orm";

export class AuthRepository implements IAuthRepository {
  async findByKey(key: string): Promise<ApiKey | null> {
    const [result] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.key, key));

    if (!result) return null;

    return this.mapToDomain(result);
  }

  async create(data: CreateApiKeyInput): Promise<ApiKey> {
    const [inserted] = await db
      .insert(apiKeys)
      .values({
        client: data.clientName,
        key: data.key,
        role: data.role === "ADMIN" ? "ADMIN" : "CLIENT",
        webhookUrl: data.webhookUrl,
        allowedIp: data.allowedIp,
        isActive: true,
      })
      .returning();

    return this.mapToDomain(inserted);
  }

  private mapToDomain(raw: typeof apiKeys.$inferSelect): ApiKey {
    return ApiKey.restore({
      id: raw.id,
      key: raw.key,
      client: raw.client,
      role: raw.role as ApiKeyRole,
      webhookUrl: raw.webhookUrl ?? undefined,
      allowedIp: raw.allowedIp ?? undefined,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
    });
  }
}
