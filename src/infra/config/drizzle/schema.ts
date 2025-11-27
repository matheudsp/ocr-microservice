import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";

export const verificationStatusEnum = pgEnum("VerificationStatus", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

export const documentTypeEnum = pgEnum("DocumentType", [
  "RG",
  "CPF",
  "CNH",
  "COMPROVANTE_RENDA",
]);

export const roleEnum = pgEnum("Role", ["ADMIN", "CLIENT"]);

export const verificationRequests = pgTable("verification_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalReference: text("externalReference"),
  documentType: documentTypeEnum("documentType").notNull(),
  fileKey: text("fileKey").notNull(),
  status: verificationStatusEnum("status").notNull(),
  failReason: text("failReason"),
  confidenceScore: integer("confidenceScore"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  client: text("client").notNull(),
  role: roleEnum("role").default("CLIENT").notNull(),
  webhookUrl: text("webhook_url"),
  allowedIp: text("allowed_ip"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});
