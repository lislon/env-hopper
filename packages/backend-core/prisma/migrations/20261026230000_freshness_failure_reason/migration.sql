-- Why a read failed, made safe for a browser.
ALTER TABLE "AppEnvFreshness" ADD COLUMN "failedReason" TEXT;
ALTER TABLE "AppEnvFreshness" ADD COLUMN "failedMessage" TEXT;
