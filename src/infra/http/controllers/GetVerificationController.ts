import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { GetVerificationUsecase } from "@core/usecases/VerificationUseCase/GetVerificationUsecase";

const paramsSchema = z.object({
  id: z.string().min(1),
});

export class GetVerificationController {
  constructor(private getVerificationUseCase: GetVerificationUsecase) {}

  async handle(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = paramsSchema.parse(req.params);

      const result = await this.getVerificationUseCase.execute(id);

      if (!result) {
        return reply.status(404).send({ error: "Verificação não encontrada." });
      }

      return reply.status(200).send(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: "Identificador inválido." });
      }

      req.log.error(error);
      return reply.status(500).send({ error: "Erro interno do servidor." });
    }
  }
}
