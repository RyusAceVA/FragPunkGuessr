-- AlterTable
ALTER TABLE "Round" ADD COLUMN     "timedOut" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "GameSession_status_completedAt_idx" ON "GameSession"("status", "completedAt");
