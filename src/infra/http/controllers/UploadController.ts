import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { RequestVerificationUsecase } from "@core/usecases/VerificationUseCase/RequestVerificationUsecase";
import { DocumentType } from "@core/dtos/verification.dto";
import { FileValidator } from "../validators/FileValidator";

const metadataSchema = z.object({
  externalReference: z.uuidv4(),
  documentType: z.enum(DocumentType),
  expectedData: z.object({
    name: z.string().min(3),
    cpf: z.string(),
    declaredIncome: z.number().optional(),
  }),
});

export class UploadController {
  constructor(private requestVerificationUseCase: RequestVerificationUsecase) {}

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
      try {
        await FileValidator.validate(fileBuffer, mimetype);
      } catch (validationError: any) {
        return reply.status(400).send({
          error: "Security Check Failed",
          message: validationError.message,
        });
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
        webhookUrl: req.apiKey?.webhookUrl ?? undefined,
        webhookSecret: req.apiKey?.webhookSecret ?? undefined,
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
