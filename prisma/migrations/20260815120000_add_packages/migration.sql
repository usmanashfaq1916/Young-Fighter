-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY');

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "billingType" "BillingType" NOT NULL DEFAULT 'MONTHLY',
    "sessionsPerWeek" INTEGER NOT NULL DEFAULT 0,
    "features" TEXT[],
    "startDate" DATE,
    "endDate" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Package_isActive_idx" ON "Package"("isActive");
