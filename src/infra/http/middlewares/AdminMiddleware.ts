import { FastifyReply, FastifyRequest } from "fastify";
import { env } from "@infra/config/env";

export const adminMiddleware = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const adminToken = req.headers["x-admin-token"] as string;

  if (!adminToken || adminToken !== env.ADMIN_API_TOKEN) {
    return reply.status(403).send({
      error: "Forbidden",
      message: "Acesso administrativo negado.",
    });
  }
};
