import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { CreateApiKeyUsecase } from "@core/usecases/CreateApiKeyUsecase";

const bodySchema = z.object({
  client: z.string().min(3),
});

export class CreateApiKeyController {
  constructor(private createApiKeyUseCase: CreateApiKeyUsecase) {}

  async handle(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { client } = bodySchema.parse(req.body);

      const result = await this.createApiKeyUseCase.execute(client);

      return reply.status(201).send(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply
          .status(400)
          .send({ error: "Dados inválidos", details: error.issues });
      }
      return reply
        .status(400)
        .send({ error: error.message || "Erro inesperado" });
    }
  }
}
