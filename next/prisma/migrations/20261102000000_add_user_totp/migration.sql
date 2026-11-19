-- AlterTable
ALTER TABLE `User`
    ADD COLUMN `totpSecret` VARCHAR(255) NULL,
    ADD COLUMN `totpPendingSecret` VARCHAR(255) NULL,
    ADD COLUMN `totpEnabledAt` DATETIME(3) NULL,
    ADD COLUMN `totpLastStep` INTEGER NULL;
