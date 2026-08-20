CREATE TABLE `creator_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicantUserId` int NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`requestedSlug` varchar(96) NOT NULL,
	`bio` text,
	`gamerTags` text NOT NULL,
	`streamLinks` text NOT NULL,
	`catalogDraft` text NOT NULL,
	`status` enum('pending','in_review','needs_changes','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewerNotes` text,
	`reviewedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creator_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `creator_applications` ADD CONSTRAINT `creator_applications_applicant_user_fk` FOREIGN KEY (`applicantUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `creator_applications` ADD CONSTRAINT `creator_applications_reviewer_user_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;