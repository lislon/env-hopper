-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Substitution" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isBrowserAutocomplete" BOOLEAN NOT NULL DEFAULT false,
    "isSharedAcrossEnvs" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Substitution" ("id", "name", "title") SELECT "id", "name", "title" FROM "Substitution";
DROP TABLE "Substitution";
ALTER TABLE "new_Substitution" RENAME TO "Substitution";
CREATE UNIQUE INDEX "Substitution_name_key" ON "Substitution"("name");
PRAGMA foreign_key_check("Substitution");
PRAGMA foreign_keys=ON;
