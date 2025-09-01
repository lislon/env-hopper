-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Application" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "urlPerEnv" TEXT NOT NULL,
    "meta" TEXT NOT NULL DEFAULT '{}'
);
INSERT INTO "new_Application" ("id", "name", "url", "urlPerEnv") SELECT "id", "name", "url", "urlPerEnv" FROM "Application";
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
CREATE UNIQUE INDEX "Application_name_key" ON "Application"("name");
PRAGMA foreign_key_check("Application");
PRAGMA foreign_keys=ON;
