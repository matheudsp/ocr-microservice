import { IAuthRepository } from "@core/ports/IAuthRepository";
import { prisma } from "../config/prisma/prisma";
import { ApiKey } from "@infra/config/prisma/generated/client";

export class PrismaAuthRepo implements IAuthRepository {
  async existsAndIsActive(key: string): Promise<boolean> {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
    });
    return !!apiKey && apiKey.isActive;
  }

  async create(clientName: string, key: string): Promise<ApiKey> {
    return prisma.apiKey.create({
      data: {
        client: clientName,
        key: key,
        isActive: true,
      },
    });
  }
}
