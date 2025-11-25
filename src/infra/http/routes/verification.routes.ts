import { FastifyInstance } from "fastify";
import { VerificationModule } from "../modules/verification.module";

export async function verificationRoutes(app: FastifyInstance) {
  const { uploadController, getVerificationController, verifyApiKey } =
    VerificationModule();

  app.addHook("preHandler", verifyApiKey);

  app.post("/verification", (req, reply) =>
    uploadController.handle(req, reply)
  );

  app.get("/verification/:id", (req, reply) =>
    getVerificationController.handle(req, reply)
  );
}
