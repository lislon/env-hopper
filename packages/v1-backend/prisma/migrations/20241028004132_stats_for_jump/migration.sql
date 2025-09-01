-- CreateTable
CREATE TABLE "StatsJump" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "envId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "sub" TEXT NOT NULL DEFAULT '',
    "appVersion" TEXT NOT NULL,
    "jumpDate" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UnstableCustomization" (
    "syntheticId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "unstable__analytics_script" TEXT NOT NULL,
    "unstable__footer_html" TEXT NOT NULL,
    "unstable__custom" TEXT NOT NULL
);
INSERT INTO "new_UnstableCustomization" ("syntheticId", "unstable__analytics_script", "unstable__custom", "unstable__footer_html")
                                  SELECT "syntheticId", "unstable__analytics_script", "unstable__custom", "unstable__footer_html" FROM "UnstableCustomization";
DROP TABLE "UnstableCustomization";
ALTER TABLE "new_UnstableCustomization" RENAME TO "UnstableCustomization";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
