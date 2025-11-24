import Tesseract from "tesseract.js";
import { IOcrProvider } from "@core/ports/IOcrProvider";
import { logger } from "@infra/logger";

export class TesseractOcrProvider implements IOcrProvider {
  private readonly serviceName: string = "TesseractProvider";

  async extractText(imageBuffer: Buffer): Promise<string> {
    try {
      const result = await Tesseract.recognize(imageBuffer, "por", {
        // enable only in dev
        // logger: (m) => console.log(m),
      });

      return result.data.text;
    } catch (error) {
      logger.error({ service: this.serviceName, err: error }, "Erro no OCR");
      throw new Error("Falha ao processar imagem via OCR");
    }
  }
}
