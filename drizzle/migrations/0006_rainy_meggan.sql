CREATE TABLE `game_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`streamerProfileId` int NOT NULL,
	`submittedByUserId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`platform` enum('xbox','playstation') NOT NULL,
	`note` text,
	`status` enum('pending','reviewed','accepted','declined') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `game_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `game_suggestions` ADD CONSTRAINT `game_suggestions_profile_fk` FOREIGN KEY (`streamerProfileId`) REFERENCES `streamer_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `game_suggestions` ADD CONSTRAINT `game_suggestions_submitter_fk` FOREIGN KEY (`submittedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;