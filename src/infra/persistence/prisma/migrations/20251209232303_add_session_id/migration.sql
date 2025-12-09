/*
  Warnings:

  - The primary key for the `Config` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Config" (
    "key" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL DEFAULT 'default',
    "value" TEXT NOT NULL,

    PRIMARY KEY ("key", "sessionId")
);
INSERT INTO "new_Config" ("key", "value") SELECT "key", "value" FROM "Config";
DROP TABLE "Config";
ALTER TABLE "new_Config" RENAME TO "Config";
CREATE TABLE "new_Target" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL,
    "linkedinUrl" TEXT NOT NULL,
    "role" TEXT,
    "company" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOT_VISITED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Target" ("company", "createdAt", "id", "linkedinUrl", "name", "role", "status", "updatedAt") SELECT "company", "createdAt", "id", "linkedinUrl", "name", "role", "status", "updatedAt" FROM "Target";
DROP TABLE "Target";
ALTER TABLE "new_Target" RENAME TO "Target";
CREATE INDEX "Target_sessionId_idx" ON "Target"("sessionId");
CREATE UNIQUE INDEX "Target_linkedinUrl_sessionId_key" ON "Target"("linkedinUrl", "sessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
