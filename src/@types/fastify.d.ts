import "fastify";
import { ApiKey } from "@infra/config/prisma/generated/client";

declare module "fastify" {
  interface FastifyRequest {
    apiKey?: ApiKey;
  }
}
