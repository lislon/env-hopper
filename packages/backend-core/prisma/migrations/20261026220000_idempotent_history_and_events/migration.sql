-- DeploymentHistory: one row per change, whoever writes it.
ALTER TABLE "DeploymentHistory" ADD COLUMN "eventAt" TIMESTAMP(3);
UPDATE "DeploymentHistory" SET "eventAt" = "deployedAt";
UPDATE "DeploymentHistory" SET "version" = "previous", "previous" = NULL
  WHERE "kind" = 'removed' AND "version" IS NULL;
DELETE FROM "DeploymentHistory" d
  USING "DeploymentHistory" k
  WHERE d."id" > k."id"
    AND d."componentSlug" = k."componentSlug"
    AND d."targetSlug" = k."targetSlug"
    AND d."kind" = k."kind"
    AND COALESCE(d."version", '') = COALESCE(k."version", '')
    AND COALESCE(d."eventAt", TIMESTAMP '1970-01-01 00:00:00') = COALESCE(k."eventAt", TIMESTAMP '1970-01-01 00:00:00');
CREATE UNIQUE INDEX "DeploymentHistory_event_key" ON "DeploymentHistory"
  ("componentSlug", "targetSlug", "kind", COALESCE("version", ''), COALESCE("eventAt", TIMESTAMP '1970-01-01 00:00:00'));

-- UserEvent: the browser's event id; sent twice, kept once.
ALTER TABLE "UserEvent" ADD COLUMN "eventId" TEXT;
ALTER TABLE "UserEvent" ADD COLUMN "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX "UserEvent_eventId_key" ON "UserEvent"("eventId");
