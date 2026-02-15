ALTER TABLE `entities` RENAME COLUMN "hakushin_id" TO "game_id";--> statement-breakpoint
CREATE TABLE `skills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`game_id` integer,
	`entity_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon_url` text,
	`origin_type` text,
	FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
DROP INDEX `entities_hakushin_id_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `entities_game_id_unique` ON `entities` (`game_id`);