CREATE TABLE `DraftSnapshot` (
  `id` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(64) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `tags` TEXT NOT NULL,
  `images` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `DraftSnapshot_userId_createdAt_idx` ON `DraftSnapshot`(`userId`, `createdAt`);

ALTER TABLE `DraftSnapshot` ADD CONSTRAINT `DraftSnapshot_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
