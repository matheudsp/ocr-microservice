import { IWebhookProvider, WebhookPayload } from "@core/ports/IWebhookProvider";
import { logger } from "@infra/logger";
import { setTimeout } from "node:timers/promises";
import { createHmac } from "node:crypto";
export class FetchWebhookProvider implements IWebhookProvider {
  private readonly serviceName = FetchWebhookProvider.name;
  private readonly MAX_RETRIES = 4;

  async send(
    url: string,
    payload: WebhookPayload,
    secret?: string
  ): Promise<void> {
    let attempt = 0;
    const payloadString = JSON.stringify(payload);

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "User-Agent": "OCR-Microservice-Bot/1.0",
    };

    // Assinatura HMAC SHA256
    if (secret) {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = createHmac("sha256", secret)
        .update(`${timestamp}.${payloadString}`)
        .digest("hex");

      headers["X-OCR-Signature"] = `t=${timestamp},v1=${signature}`;
    }
    while (attempt < this.MAX_RETRIES) {
      try {
        attempt++;

        logger.info(
          {
            service: this.serviceName,
            url,
            verificationId: payload.verificationId,
            attempt,
          },
          `Enviando webhook (Tentativa ${attempt}/${this.MAX_RETRIES})...`
        );

        const controller = new AbortController();
        const timeoutId = global.setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
          method: "POST",
          headers: headers,
          body: payloadString,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (response.ok) {
          logger.info(
            {
              service: this.serviceName,
              verificationId: payload.verificationId,
            },
            "Webhook enviado com sucesso"
          );
          return;
        }

        if (
          response.status >= 400 &&
          response.status < 500 &&
          response.status !== 429
        ) {
          throw new Error(
            `Webhook rejeitado pelo destino (Erro de Cliente). Status: ${response.status}`
          );
        }

        throw new Error(
          `Falha temporária. Status: ${response.status} - ${response.statusText}`
        );
      } catch (error: any) {
        const isLastAttempt = attempt === this.MAX_RETRIES;

        logger.warn(
          {
            service: this.serviceName,
            url,
            err: error.message,
            attempt,
          },
          `Tentativa ${attempt} falhou.`
        );

        if (isLastAttempt) {
          logger.error(
            {
              service: this.serviceName,
              verificationId: payload.verificationId,
              err: error,
            },
            "Falha crítica: Todas as tentativas de envio do webhook esgotadas."
          );
          return;
        }

        // (attempt * 2000) + 1000 = 3s,5s,7s
        const delay = attempt * 2000 + 1000;

        await setTimeout(delay);
      }
    }
  }
}
