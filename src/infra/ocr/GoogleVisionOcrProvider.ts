import { ImageAnnotatorClient } from "@google-cloud/vision";
import { IOcrProvider } from "@core/ports/IOcrProvider";
import { logger } from "@infra/logger";
import fs from "fs";

export class GoogleVisionOcrProvider implements IOcrProvider {
  private readonly client: ImageAnnotatorClient;
  private readonly serviceName: string = "GoogleVisionProvider";
  constructor() {
    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!keyPath || !fs.existsSync(keyPath)) {
      throw new Error(
        `[${this.serviceName}] Arquivo de credenciais não encontrado em: ${keyPath}`
      );
    }
    this.client = new ImageAnnotatorClient();
  }

  async extractText(imageBuffer: Buffer): Promise<string> {
    try {
      const start = Date.now();
      const [result] = await this.client.textDetection(imageBuffer);

      const duration = Date.now() - start;
      logger.info(
        { service: this.serviceName, duration },
        "OCR processado com sucesso"
      );

      const detections = result.textAnnotations;

      if (!detections || detections.length === 0) {
        logger.warn(
          { service: this.serviceName },
          "Nenhum texto detectado na imagem"
        );
        return "";
      }

      return detections[0].description || "";
    } catch (error) {
      logger.error(
        { service: this.serviceName, err: error },
        "Falha na comunicação com Google Vision API"
      );
      throw new Error("Falha ao processar imagem via OCR");
    }
  }
}
