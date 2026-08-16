CREATE TABLE "OfflineSyncRecord" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfflineSyncRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OfflineSyncRecord_key_key" ON "OfflineSyncRecord"("key");

CREATE INDEX "OfflineSyncRecord_createdAt_idx" ON "OfflineSyncRecord"("createdAt");
