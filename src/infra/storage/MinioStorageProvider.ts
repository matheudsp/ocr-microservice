import * as Minio from "minio";
import { IStorageProvider } from "@core/ports/IStorageProvider";
import { env } from "@infra/config/env";
import { logger } from "@infra/logger";

export class MinioStorageProvider implements IStorageProvider {
  private client: Minio.Client;
  private readonly serviceName: string = MinioStorageProvider.name;
  constructor() {
    this.client = new Minio.Client({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });
  }

  async saveFile(
    bucket: string,
    fileName: string,
    fileBuffer: Buffer,
    mimetype: string
  ): Promise<string> {
    try {
      const bucketExists = await this.client.bucketExists(bucket);
      if (!bucketExists) {
        logger.info(
          { service: this.serviceName },
          ` Bucket '${bucket}' não existe. Criando...`
        );
        await this.client.makeBucket(bucket, "us-east-1");
      }
    } catch (err) {
      logger.warn(
        { service: this.serviceName },
        "Aviso ao verificar bucket:",
        err
      );
    }

    const metaData = {
      "Content-Type": mimetype,
    };

    await this.client.putObject(
      bucket,
      fileName,
      fileBuffer,
      fileBuffer.length,
      metaData
    );

    return fileName;
  }

  async getFile(bucket: string, key: string): Promise<Buffer> {
    const dataStream = await this.client.getObject(bucket, key);

    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      dataStream.on("data", (chunk) => chunks.push(chunk as Buffer));
      dataStream.on("end", () => resolve(Buffer.concat(chunks)));
      dataStream.on("error", (err) => reject(err));
    });
  }
}
