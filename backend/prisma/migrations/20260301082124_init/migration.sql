-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "settlementName" TEXT NOT NULL,
    "district" TEXT,
    "region" TEXT,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "households" INTEGER,
    "arrivals14d" INTEGER,
    "penta3" DOUBLE PRECISION,
    "gam" DOUBLE PRECISION,
    "safety" DOUBLE PRECISION,
    "needs" JSONB,
    "raw" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
