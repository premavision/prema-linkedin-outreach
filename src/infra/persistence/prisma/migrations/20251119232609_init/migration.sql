-- CreateTable
CREATE TABLE "Target" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "linkedinUrl" TEXT NOT NULL,
    "role" TEXT,
    "company" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOT_VISITED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProfileSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "targetId" INTEGER NOT NULL,
    "headline" TEXT,
    "about" TEXT,
    "currentRole" TEXT,
    "company" TEXT,
    "location" TEXT,
    "industry" TEXT,
    "rawHtml" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfileSnapshot_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Target" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "targetId" INTEGER NOT NULL,
    "variant" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Message_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Target" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Target_linkedinUrl_key" ON "Target"("linkedinUrl");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileSnapshot_targetId_key" ON "ProfileSnapshot"("targetId");
