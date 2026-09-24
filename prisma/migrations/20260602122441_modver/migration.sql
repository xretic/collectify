-- CreateTable
CREATE TABLE "Verified" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verified_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Moderator" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "assignedBy" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Moderator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Verified_userId_key" ON "Verified"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Moderator_userId_key" ON "Moderator"("userId");

-- AddForeignKey
ALTER TABLE "Verified" ADD CONSTRAINT "Verified_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Moderator" ADD CONSTRAINT "Moderator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
