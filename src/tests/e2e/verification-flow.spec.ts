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
import { prisma } from "../../infra/config/prisma/prisma";
import { Role } from "../../infra/config/prisma/generated/client";
import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";

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

vi.mock("@infra/storage/MinioStorageProvider", () => ({
  MinioStorageProvider: class {
    async saveFile() {
      return "docs/test-file.jpg";
    }
    async getFile() {
      return Buffer.from("fake-content");
    }
  },
}));

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

describe("E2E - Verification Flow & Security", () => {
  let app: FastifyInstance;

  const ALLOWED_IP = "200.100.50.25";
  const BLOCKED_IP = "189.90.10.1";
  const API_KEY_VAL = "sk_test_integration_123";
  const WEBHOOK_URL = "https://meu-sistema.com/webhook-callback";

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
    await prisma.$connect();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    await prisma.verificationRequest.deleteMany();
    await prisma.apiKey.deleteMany();

    await prisma.apiKey.create({
      data: {
        client: "Integration Test Client",
        key: API_KEY_VAL,
        role: Role.CLIENT,
        isActive: true,
        allowedIp: ALLOWED_IP,
        webhookUrl: WEBHOOK_URL,
      },
    });
  });

  it("deve rejeitar (403) requisição vinda de IP não autorizado", async () => {
    // ARRANGE
    const boundary = "----TestBoundaryBlocked";
    const payload = createMultipartPayload(
      {
        externalReference: randomUUID(),
        documentType: "CNH",
        expectedData: { name: "Teste", cpf: "123" },
      },
      Buffer.from("fake-img"),
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
      remoteAddress: BLOCKED_IP,
      payload: payload,
    });

    // ASSERT
    expect(response.statusCode).toBe(403);
    expect(mockAddJob).not.toHaveBeenCalled();
  });

  it("deve aceitar (202) IP autorizado e propagar Webhook URL para a fila", async () => {
    // ARRANGE
    const boundary = "----TestBoundaryAllowed";
    const payload = createMultipartPayload(
      {
        externalReference: randomUUID(),
        documentType: "RG_FRENTE",
        expectedData: { name: "Authorized User", cpf: "000.000.000-00" },
      },
      Buffer.from("fake-img-valid"),
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

    // DEBUG (se falhar novamente, veremos o erro exato)
    if (response.statusCode === 400) {
      console.error("Erro 400 Detalhado:", response.json());
    }

    // ASSERT
    expect(response.statusCode).toBe(202);

    expect(mockAddJob).toHaveBeenCalledTimes(1);

    const [queueName, jobData] = mockAddJob.mock.calls[0];

    expect(queueName).toBe("ocr-processing-queue");
    expect(jobData).toEqual(
      expect.objectContaining({
        webhookUrl: WEBHOOK_URL,
        expectedData: expect.anything(),
      })
    );
  });
});
