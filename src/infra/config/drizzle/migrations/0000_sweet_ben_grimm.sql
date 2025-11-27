CREATE TYPE "public"."DocumentType" AS ENUM('RG', 'CPF', 'CNH', 'COMPROVANTE_RENDA');--> statement-breakpoint
CREATE TYPE "public"."Role" AS ENUM('ADMIN', 'CLIENT');--> statement-breakpoint
CREATE TYPE "public"."VerificationStatus" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"client" text NOT NULL,
	"role" "Role" DEFAULT 'CLIENT' NOT NULL,
	"webhook_url" text,
	"allowed_ip" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "verification_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"externalReference" text,
	"documentType" "DocumentType" NOT NULL,
	"fileKey" text NOT NULL,
	"status" "VerificationStatus" NOT NULL,
	"failReason" text,
	"confidenceScore" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
