-- CreateTable
CREATE TABLE "AppEnvFreshness" (
    "appSlug" TEXT NOT NULL,
    "envSlug" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL,
    "reading" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "failedSource" TEXT,
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppEnvFreshness_pkey" PRIMARY KEY ("appSlug","envSlug")
);

-- CreateTable
CREATE TABLE "EhUser" (
    "id" TEXT NOT NULL,
    "loginId" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EhUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEvent" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "appSlug" TEXT NOT NULL,
    "envSlug" TEXT NOT NULL,
    "resourceJump" TEXT,
    "url" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppEnvFreshness_scope_idx" ON "AppEnvFreshness"("scope");

-- CreateIndex
CREATE INDEX "EhUser_loginId_idx" ON "EhUser"("loginId");

-- CreateIndex
CREATE INDEX "UserEvent_userId_at_idx" ON "UserEvent"("userId", "at");

-- CreateIndex
CREATE INDEX "UserEvent_at_idx" ON "UserEvent"("at");

-- AddForeignKey
ALTER TABLE "UserEvent" ADD CONSTRAINT "UserEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "EhUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

