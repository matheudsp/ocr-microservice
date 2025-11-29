import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  vi,
  beforeEach,
} from "vitest";
import { buildApp } from "../../infra/http/app";
import { db } from "../../infra/config/drizzle/database";
import {
  apiKeys,
  verificationRequests,
} from "../../infra/config/drizzle/schema";
import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";

// --- MOCKS DE INFRAESTRUTURA ---
const mockAddJob = vi.fn();

vi.mock("@infra/queue/BullMqProvider", () => {
  return {
    BullMqProvider: class {
      constructor(public queueName: string) {}
      async addJob(name: string, data: any) {
        mockAddJob(name, data);
        return Promise.resolve();
      }
    },
  };
});

// Mock do MinIO para não precisar de uma instância real rodando
vi.mock("@infra/storage/MinioStorageProvider", () => ({
  MinioStorageProvider: class {
    async saveFile() {
      return "docs/test-file-uploaded.jpg";
    }
    async getFile() {
      return Buffer.from("fake-content");
    }
  },
}));

// Helper para criar corpo multipart (simula o form-data)
function createMultipartPayload(
  metadata: object,
  fileBuffer: Buffer,
  boundary: string
) {
  const crlf = "\r\n";
  return Buffer.concat([
    Buffer.from(`--${boundary}${crlf}`),
    Buffer.from(
      `Content-Disposition: form-data; name="metadata"${crlf}${crlf}`
    ),
    Buffer.from(`${JSON.stringify(metadata)}${crlf}`),
    Buffer.from(`--${boundary}${crlf}`),
    Buffer.from(
      `Content-Disposition: form-data; name="file"; filename="test.jpg"${crlf}`
    ),
    Buffer.from(`Content-Type: image/jpeg${crlf}${crlf}`),
    fileBuffer,
    Buffer.from(`${crlf}--${boundary}--${crlf}`),
  ]);
}

describe("E2E - Verification Flow", () => {
  let app: FastifyInstance;

  const ALLOWED_IP = "127.0.0.1"; // Fastify inject geralmente usa localhost/127.0.0.1
  const BLOCKED_IP = "189.90.10.1";
  const API_KEY_VAL = "sk_test_integration_123";
  const WEBHOOK_URL = "https://meu-sistema.com/webhook-callback";

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    // LIMPEZA DO BANCO
    await db.delete(verificationRequests);
    await db.delete(apiKeys);

    // SEED: CRIAÇÃO DA API KEY
    await db.insert(apiKeys).values({
      client: "Integration Test Client",
      key: API_KEY_VAL,
      role: "CLIENT",
      isActive: true,
      allowedIp: ALLOWED_IP,
      webhookUrl: WEBHOOK_URL,
    });
  });

  it("deve rejeitar (403) se o IP não for o autorizado na API Key", async () => {
    // ARRANGE
    const boundary = "----TestBoundaryBlocked";
    const payload = createMultipartPayload(
      {
        externalReference: randomUUID(),
        documentType: "CNH",
        expectedData: { name: "Teste", cpf: "123" },
      },
      Buffer.from("fake-img"), // Buffer simples simulando imagem
      boundary
    );

    // ACT
    const response = await app.inject({
      method: "POST",
      url: "/verification",
      headers: {
        "x-api-key": API_KEY_VAL,
        "content-type": `multipart/form-data; boundary=${boundary}`,
      },
      remoteAddress: BLOCKED_IP, // IP Bloqueado
      payload: payload,
    });

    // ASSERT
    expect(response.statusCode).toBe(403);
    expect(mockAddJob).not.toHaveBeenCalled();
  });

  it("deve aceitar (202) e enfileirar o job quando tudo estiver correto", async () => {
    // ARRANGE
    const boundary = "----TestBoundaryAllowed";
    // Header de arquivo JPG válido (primeiros bytes) para passar no FileValidator
    const validJpgHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

    const payload = createMultipartPayload(
      {
        externalReference: randomUUID(),
        documentType: "RG",
        expectedData: { name: "Authorized User", cpf: "000.000.000-00" },
      },
      validJpgHeader,
      boundary
    );

    // ACT
    const response = await app.inject({
      method: "POST",
      url: "/verification",
      headers: {
        "x-api-key": API_KEY_VAL,
        "content-type": `multipart/form-data; boundary=${boundary}`,
      },
      remoteAddress: ALLOWED_IP,
      payload: payload,
    });

    if (response.statusCode >= 400) {
      console.error("Erro na Requisição:", response.json());
    }

    // ASSERT
    expect(response.statusCode).toBe(202);

    // Verifica se caiu na fila
    expect(mockAddJob).toHaveBeenCalledTimes(1);

    const [queueName, jobData] = mockAddJob.mock.calls[0];
    expect(queueName).toBe("ocr-processing-queue"); // Confirma nome da fila
    expect(jobData).toEqual(
      expect.objectContaining({
        webhookUrl: WEBHOOK_URL, // Webhook deve vir da API Key se não enviado no payload
        fileKey: "docs/test-file-uploaded.jpg", // Retorno do mock do Storage
      })
    );
  });
});
