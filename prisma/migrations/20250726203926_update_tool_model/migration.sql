/*
  Warnings:

  - Added the required column `category` to the `Tool` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dailyRate` to the `Tool` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Tool` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `Tool` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `Tool` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `tool` ADD COLUMN `category` VARCHAR(191) NOT NULL,
    ADD COLUMN `dailyRate` DOUBLE NOT NULL,
    ADD COLUMN `description` VARCHAR(191) NOT NULL,
    ADD COLUMN `imageUrl` VARCHAR(191) NOT NULL,
    ADD COLUMN `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `ownerId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Tool` ADD CONSTRAINT `Tool_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
