/*
  Warnings:

  - A unique constraint covering the columns `[transactionId]` on the table `Rental` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[packageId]` on the table `Rental` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `packageId` to the `Rental` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `Rental` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionId` to the `Rental` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `rental` ADD COLUMN `packageId` VARCHAR(191) NOT NULL,
    ADD COLUMN `totalAmount` DOUBLE NOT NULL,
    ADD COLUMN `transactionId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Rental_transactionId_key` ON `Rental`(`transactionId`);

-- CreateIndex
CREATE UNIQUE INDEX `Rental_packageId_key` ON `Rental`(`packageId`);
