CREATE TABLE `attacks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_id` integer NOT NULL,
	`name` text,
	`parent_name` text,
	`description` text,
	`unlocked_at` text,
	`echo_set_bonus_requirement` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`scaling_stat` text NOT NULL,
	`attribute` text,
	`motion_values` text NOT NULL,
	`tags` text NOT NULL,
	`alternative_definitions` text,
	`origin_type` text,
	FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `entities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hakushin_id` integer,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`attribute` text,
	`echo_set_ids` text,
	`set_bonus_thresholds` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entities_hakushin_id_unique` ON `entities` (`hakushin_id`);--> statement-breakpoint
CREATE TABLE `modifiers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_id` integer NOT NULL,
	`name` text,
	`parent_name` text,
	`description` text,
	`unlocked_at` text,
	`echo_set_bonus_requirement` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`target` text NOT NULL,
	`modified_stats` text NOT NULL,
	`alternative_definitions` text,
	`origin_type` text,
	FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `permanent_stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_id` integer NOT NULL,
	`name` text,
	`parent_name` text,
	`description` text,
	`unlocked_at` text,
	`echo_set_bonus_requirement` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`stat` text NOT NULL,
	`value` text NOT NULL,
	`tags` text NOT NULL,
	`origin_type` text,
	FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE cascade
);
