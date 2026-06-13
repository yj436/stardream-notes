CREATE TABLE `User` (
  `id` VARCHAR(64) NOT NULL,
  `username` VARCHAR(64) NOT NULL,
  `email` VARCHAR(191) NULL,
  `passwordHash` VARCHAR(191) NULL,
  `nickname` VARCHAR(80) NOT NULL,
  `avatarUrl` VARCHAR(512) NOT NULL,
  `avatarPosition` VARCHAR(64) NULL,
  `coverUrl` VARCHAR(512) NOT NULL,
  `bio` TEXT NOT NULL,
  `level` INTEGER NOT NULL DEFAULT 1,
  `creatorBadge` VARCHAR(80) NULL,
  `favoriteCharacter` TEXT NOT NULL,
  `stats` TEXT NOT NULL,
  `role` VARCHAR(24) NOT NULL DEFAULT 'user',
  `status` VARCHAR(24) NOT NULL DEFAULT 'active',
  `isFollowing` BOOLEAN NOT NULL DEFAULT false,
  `theme` VARCHAR(32) NOT NULL DEFAULT 'sakura',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Post` (
  `id` VARCHAR(64) NOT NULL,
  `authorId` VARCHAR(64) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `excerpt` TEXT NOT NULL,
  `content` LONGTEXT NOT NULL,
  `coverUrl` VARCHAR(512) NOT NULL,
  `imagePosition` VARCHAR(64) NULL,
  `type` VARCHAR(24) NOT NULL,
  `tags` TEXT NOT NULL,
  `gallery` TEXT NOT NULL,
  `viewCount` INTEGER NOT NULL DEFAULT 0,
  `likeCount` INTEGER NOT NULL DEFAULT 0,
  `favoriteCount` INTEGER NOT NULL DEFAULT 0,
  `commentCount` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `status` VARCHAR(24) NOT NULL DEFAULT 'published',
  `isPinned` BOOLEAN NOT NULL DEFAULT false,
  `isLiked` BOOLEAN NOT NULL DEFAULT false,
  `isFavorited` BOOLEAN NOT NULL DEFAULT false,
  `reactions` TEXT NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Comment` (
  `id` VARCHAR(64) NOT NULL,
  `postId` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(64) NOT NULL,
  `parentId` VARCHAR(64) NULL,
  `content` TEXT NOT NULL,
  `likeCount` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AnimeRecord` (
  `id` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(64) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `coverUrl` VARCHAR(512) NOT NULL,
  `status` VARCHAR(32) NOT NULL,
  `rating` INTEGER NOT NULL,
  `review` TEXT NOT NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Draft` (
  `id` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(64) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `tags` TEXT NOT NULL,
  `images` TEXT NOT NULL,
  `savedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Report` (
  `id` VARCHAR(64) NOT NULL,
  `postId` VARCHAR(64) NOT NULL,
  `reporterId` VARCHAR(64) NOT NULL,
  `reason` VARCHAR(80) NOT NULL,
  `detail` TEXT NULL,
  `status` VARCHAR(24) NOT NULL DEFAULT 'open',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `User_username_key` ON `User`(`username`);
CREATE UNIQUE INDEX `User_email_key` ON `User`(`email`);
CREATE INDEX `Post_authorId_idx` ON `Post`(`authorId`);
CREATE INDEX `Post_status_createdAt_idx` ON `Post`(`status`, `createdAt`);
CREATE INDEX `Post_isPinned_createdAt_idx` ON `Post`(`isPinned`, `createdAt`);
CREATE INDEX `Comment_postId_createdAt_idx` ON `Comment`(`postId`, `createdAt`);
CREATE INDEX `Comment_userId_idx` ON `Comment`(`userId`);
CREATE INDEX `Comment_parentId_idx` ON `Comment`(`parentId`);
CREATE INDEX `AnimeRecord_userId_updatedAt_idx` ON `AnimeRecord`(`userId`, `updatedAt`);
CREATE INDEX `AnimeRecord_status_idx` ON `AnimeRecord`(`status`);
CREATE UNIQUE INDEX `Draft_userId_key` ON `Draft`(`userId`);
CREATE INDEX `Report_postId_idx` ON `Report`(`postId`);
CREATE INDEX `Report_reporterId_idx` ON `Report`(`reporterId`);
CREATE INDEX `Report_status_createdAt_idx` ON `Report`(`status`, `createdAt`);

ALTER TABLE `Post` ADD CONSTRAINT `Post_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AnimeRecord` ADD CONSTRAINT `AnimeRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Draft` ADD CONSTRAINT `Draft_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Report` ADD CONSTRAINT `Report_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Report` ADD CONSTRAINT `Report_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
