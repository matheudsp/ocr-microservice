import { FastifyInstance } from "fastify";
import { AdminModule } from "../modules/admin.module";
import { adminMiddleware } from "../middlewares/AdminMiddleware";

export async function adminRoutes(app: FastifyInstance) {
  const { createApiKeyController } = AdminModule();

  app.addHook("preHandler", adminMiddleware);

  app.post("/admin/api-keys", (req, reply) =>
    createApiKeyController.handle(req, reply)
  );
}
