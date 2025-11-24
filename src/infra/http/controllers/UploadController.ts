import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { RequestVerification } from "@core/usecases/RequestVerification";
import { DocumentType } from "@core/dtos/verification.dto";

const metadataSchema = z.object({
  userId: z.uuidv4(),
  documentType: z.enum(DocumentType),
  expectedData: z.object({
    name: z.string().min(3),
    cpf: z.string(),
    declaredIncome: z.number().optional(),
  }),
});

export class UploadController {
  constructor(private requestVerificationUseCase: RequestVerification) {}

  async handle(req: FastifyRequest, reply: FastifyReply) {
    let fileBuffer: Buffer | undefined;
    let filename: string = "";
    let mimetype: string = "";
    let rawMetadata: string | undefined;

    try {
      const parts = req.parts();

      for await (const part of parts) {
        if (part.type === "file") {
          if (part.fieldname === "file") {
            fileBuffer = await part.toBuffer();
            filename = part.filename;
            mimetype = part.mimetype;
          } else {
            part.file.resume();
          }
        } else {
          if (part.fieldname === "metadata") {
            rawMetadata = part.value as string;
          }
        }
      }

      if (!fileBuffer) {
        return reply
          .status(400)
          .send({ error: 'Arquivo (campo "file") é obrigatório.' });
      }

      if (!rawMetadata) {
        return reply
          .status(400)
          .send({ error: 'Metadados (campo "metadata") são obrigatórios.' });
      }

      const parsedMetadata = JSON.parse(rawMetadata);
      const validatedMetadata = metadataSchema.parse(parsedMetadata);

      const result = await this.requestVerificationUseCase.execute({
        file: {
          buffer: fileBuffer,
          filename: filename,
          mimetype: mimetype,
        },
        metadata: validatedMetadata,
      });

      return reply.status(202).send(result);
    } catch (error: any) {
      req.log.error(error);
      return reply.status(400).send({
        error: "Falha na verificação",
        message: error.message || "Erro desconhecido",
      });
    }
  }
}
