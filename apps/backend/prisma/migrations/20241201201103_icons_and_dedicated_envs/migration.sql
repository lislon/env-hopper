/*
  Warnings:

  - Added the required column `unstable__appLinkTypes` to the `UnstableCustomization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unstable__icons` to the `UnstableCustomization` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Environment" ADD COLUMN "appOverride" TEXT;
ALTER TABLE "Environment" ADD COLUMN "envType" TEXT;
ALTER TABLE "Application" ADD COLUMN "widgets" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UnstableCustomization" (
    "syntheticId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "unstable__analytics_script" TEXT NOT NULL,
    "unstable__footer_html" TEXT NOT NULL,
    "unstable__custom" TEXT NOT NULL,
    "unstable__icons" TEXT NOT NULL,
    "unstable__appLinkTypes" TEXT NOT NULL
);
INSERT INTO "new_UnstableCustomization" ("syntheticId", "unstable__analytics_script", "unstable__custom", "unstable__footer_html") SELECT "syntheticId", "unstable__analytics_script", "unstable__custom", "unstable__footer_html" FROM "UnstableCustomization";
DROP TABLE "UnstableCustomization";
ALTER TABLE "new_UnstableCustomization" RENAME TO "UnstableCustomization";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
