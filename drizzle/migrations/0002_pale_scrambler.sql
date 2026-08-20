ALTER TABLE `catalog_games` ADD `releaseDate` timestamp;--> statement-breakpoint
ALTER TABLE `catalog_games` ADD `popularityScore` int DEFAULT 0 NOT NULL;