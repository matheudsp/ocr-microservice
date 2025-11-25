/*
  Warnings:

  - Changed the type of `documentType` on the `verification_requests` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('RG_FRENTE', 'RG_VERSO', 'CPF', 'CNH', 'COMPROVANTE_RENDA');

-- AlterTable
ALTER TABLE "verification_requests" DROP COLUMN "documentType",
ADD COLUMN     "documentType" "DocumentType" NOT NULL;
