-- CreateTable
CREATE TABLE "IdentifierSequence" (
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "year" INTEGER,
    "currentVal" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentifierSequence_pkey" PRIMARY KEY ("name")
);
