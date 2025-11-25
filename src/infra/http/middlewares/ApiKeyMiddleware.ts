import { FastifyReply, FastifyRequest } from "fastify";
import { ValidateApiKeyUsecase } from "@core/usecases/ValidateApiKeyUsecase";

export const apiKeyMiddleware = (
  validateApiKeyUseCase: ValidateApiKeyUsecase
) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "API Key não fornecida (header: x-api-key)",
      });
    }

    const isValid = await validateApiKeyUseCase.execute(apiKey);

    if (!isValid) {
      return reply.status(403).send({
        error: "Forbidden",
        message: "API Key inválida ou inativa",
      });
    }
  };
};
