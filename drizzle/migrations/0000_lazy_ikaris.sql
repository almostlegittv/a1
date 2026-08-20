CREATE TABLE `booking_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`streamerProfileId` int NOT NULL,
	`gameId` int NOT NULL,
	`viewerUserId` int,
	`viewerHandle` varchar(160) NOT NULL,
	`viewerPlatform` varchar(40) NOT NULL,
	`status` enum('requested','reviewing','owned','support_pending','scheduled','completed','cancelled') NOT NULL DEFAULT 'requested',
	`publicNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `booking_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `catalog_games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`platform` enum('xbox','playstation') NOT NULL,
	`genre` varchar(120),
	`note` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `catalog_games_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `streamer_catalog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`streamerProfileId` int NOT NULL,
	`gameId` int NOT NULL,
	`ownershipStatus` enum('unconfirmed','owned') NOT NULL DEFAULT 'unconfirmed',
	`isVisible` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `streamer_catalog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `streamer_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`slug` varchar(96) NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`bio` text,
	`approvalStatus` enum('pending','approved','suspended','archived') NOT NULL DEFAULT 'pending',
	`publicTipUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `streamer_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `streamer_profiles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
