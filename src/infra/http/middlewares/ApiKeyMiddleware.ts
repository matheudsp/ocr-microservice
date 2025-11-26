import { FastifyReply, FastifyRequest } from "fastify";
import { ValidateApiKeyUsecase } from "@core/usecases/ApiKeyUseCase/ValidateApiKeyUsecase";

export const apiKeyMiddleware = (
  validateApiKeyUseCase: ValidateApiKeyUsecase
) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const apiKeyHeader = req.headers["x-api-key"] as string;

    const requestIp = req.ip;

    if (!apiKeyHeader) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "API Key não fornecida (header: x-api-key)",
      });
    }

    const apiKeyEntity = await validateApiKeyUseCase.execute(
      apiKeyHeader,
      requestIp
    );

    if (!apiKeyEntity) {
      return reply.status(403).send({
        error: "Forbidden",
        message: "API Key inválida, inativa ou IP não autorizado",
      });
    }

    req.apiKey = apiKeyEntity;
  };
};
