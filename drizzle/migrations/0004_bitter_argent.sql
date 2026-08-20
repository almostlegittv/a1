CREATE TABLE `creator_application_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`checkType` enum('identity','stream_profile','gamer_tag','catalog','policy') NOT NULL,
	`subject` varchar(240) NOT NULL,
	`evidenceUrl` varchar(512),
	`status` enum('unreviewed','verified','failed','not_applicable') NOT NULL DEFAULT 'unreviewed',
	`reviewerNote` text,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creator_application_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creator_application_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`fromStatus` varchar(40),
	`toStatus` varchar(40) NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creator_application_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `streamer_profiles` ADD `gamerTags` text;--> statement-breakpoint
ALTER TABLE `streamer_profiles` ADD `streamLinks` text;--> statement-breakpoint
ALTER TABLE `streamer_profiles` ADD `verifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `streamer_profiles` ADD `verifiedByUserId` int;--> statement-breakpoint
ALTER TABLE `creator_application_checks` ADD CONSTRAINT `creator_application_checks_application_fk` FOREIGN KEY (`applicationId`) REFERENCES `creator_applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `creator_application_checks` ADD CONSTRAINT `creator_application_checks_reviewer_user_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `creator_application_events` ADD CONSTRAINT `creator_application_events_application_fk` FOREIGN KEY (`applicationId`) REFERENCES `creator_applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `creator_application_events` ADD CONSTRAINT `creator_application_events_actor_user_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `streamer_profiles` ADD CONSTRAINT `streamer_profiles_verifier_user_fk` FOREIGN KEY (`verifiedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;