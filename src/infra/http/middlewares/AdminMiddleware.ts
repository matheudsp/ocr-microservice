import { FastifyReply, FastifyRequest } from "fastify";
import { ValidateAdminKeyUsecase } from "@core/usecases/ApiKeyUseCase/ValidateAdminKeyUsecase";

export const adminMiddleware = (validateAdminKey: ValidateAdminKeyUsecase) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Credenciais não fornecidas.",
      });
    }

    const isAdmin = await validateAdminKey.execute(apiKey);

    if (!isAdmin) {
      return reply.status(403).send({
        error: "Forbidden",
        message: "Acesso administrativo negado.",
      });
    }
  };
};
