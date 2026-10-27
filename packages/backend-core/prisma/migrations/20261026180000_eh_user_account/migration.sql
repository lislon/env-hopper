-- EhUser.userId: the signed-in account an EhUser belongs to.
ALTER TABLE "EhUser" RENAME COLUMN "loginId" TO "userId";
ALTER INDEX "EhUser_loginId_idx" RENAME TO "EhUser_userId_idx";
