import { Queue } from "bullmq";
import {
  IQueueProvider,
  VerificationJobData,
} from "@core/ports/IQueueProvider";
import { logger } from "@infra/logger";
import { env } from "../config/env";
export class BullMqProvider implements IQueueProvider {
  private queue: Queue;
  private readonly serviceName: string = BullMqProvider.name;

  constructor(queueName: string) {
    this.queue = new Queue(queueName, {
      connection: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
      },
    });
  }

  async addJob(queueName: string, data: VerificationJobData): Promise<void> {
    await this.queue.add("process-document", data, {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    });
    logger.info(
      { provider: this.serviceName },
      `Job adicionado na fila ${queueName}: ${data.verificationId}`
    );
  }
}
