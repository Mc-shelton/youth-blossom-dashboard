-- CreateTable
CREATE TABLE "CommunityAlert" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "district" TEXT,
    "channel" TEXT,
    "category" TEXT,
    "severity" TEXT,
    "message" TEXT NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityAlert_pkey" PRIMARY KEY ("id")
);
