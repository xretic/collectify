-- CreateTable
CREATE TABLE "Admin" (
    "id" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "assignedBy" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userId_key" ON "Admin"("userId");
