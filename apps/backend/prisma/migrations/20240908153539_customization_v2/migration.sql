/*
  Warnings:

  - You are about to drop the `CustomFooterHtml` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CustomFooterHtml";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "UnstableCustomization" (
    "syntheticId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "unstable__analytics_script" TEXT NOT NULL,
    "unstable__footer_html" TEXT NOT NULL
);
