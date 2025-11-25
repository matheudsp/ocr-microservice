import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { loggerOptions } from "@infra/config/logger";
import { verificationRoutes } from "./routes/verification.routes";
import { adminRoutes } from "./routes/admin.routes";

export const buildApp = () => {
  const app = Fastify({
    logger: loggerOptions,
  });

  app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  app.register(verificationRoutes);
  app.register(adminRoutes);

  return app;
};
