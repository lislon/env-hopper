/*
  Warnings:

  - The primary key for the `Application` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `name` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `urlPerEnv` on the `Application` table. All the data in the column will be lost.
  - The primary key for the `Environment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `name` on the `Environment` table. All the data in the column will be lost.
  - The primary key for the `Substitution` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `name` on the `Substitution` table. All the data in the column will be lost.
  - Added the required column `syntheticId` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `syntheticId` to the `Environment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `syntheticId` to the `Substitution` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "CustomFooterHtml" (
    "syntheticId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "html" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Application" (
    "syntheticId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "abbr" TEXT NOT NULL DEFAULT '',
    "aliases" TEXT NOT NULL DEFAULT '[]',
    "pages" TEXT NOT NULL DEFAULT '[]',
    "meta" TEXT NOT NULL DEFAULT '{}'
);
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
CREATE UNIQUE INDEX "Application_id_key" ON "Application"("id");
CREATE UNIQUE INDEX "Application_title_key" ON "Application"("title");
CREATE TABLE "new_Environment" (
    "syntheticId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id" TEXT NOT NULL,
    "meta" TEXT NOT NULL
);
DROP TABLE "Environment";
ALTER TABLE "new_Environment" RENAME TO "Environment";
CREATE UNIQUE INDEX "Environment_id_key" ON "Environment"("id");
CREATE TABLE "new_Substitution" (
    "syntheticId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isBrowserAutocomplete" BOOLEAN NOT NULL DEFAULT false,
    "isSharedAcrossEnvs" BOOLEAN NOT NULL DEFAULT false
);
DROP TABLE "Substitution";
ALTER TABLE "new_Substitution" RENAME TO "Substitution";
CREATE UNIQUE INDEX "Substitution_id_key" ON "Substitution"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
