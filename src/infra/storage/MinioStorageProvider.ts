import * as Minio from "minio";
import { IStorageProvider } from "@core/ports/IStorageProvider";

export class MinioStorageProvider implements IStorageProvider {
  private client: Minio.Client;

  constructor() {
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || "localhost",
      port: Number(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY || "admin",
      secretKey: process.env.MINIO_SECRET_KEY || "password123",
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
        console.log(`[Storage] Bucket '${bucket}' não existe. Criando...`);
        await this.client.makeBucket(bucket, "us-east-1");
      }
    } catch (err) {
      console.warn("[Storage] Aviso ao verificar bucket:", err);
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
