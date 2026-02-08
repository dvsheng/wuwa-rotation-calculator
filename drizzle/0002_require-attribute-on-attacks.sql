PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_attacks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_id` integer NOT NULL,
	`name` text,
	`parent_name` text,
	`description` text,
	`icon_path` text,
	`unlocked_at` text,
	`echo_set_bonus_requirement` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`scaling_stat` text NOT NULL,
	`attribute` text NOT NULL,
	`motion_values` text NOT NULL,
	`tags` text NOT NULL,
	`alternative_definitions` text,
	`origin_type` text,
	FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_attacks`("id", "entity_id", "name", "parent_name", "description", "icon_path", "unlocked_at", "echo_set_bonus_requirement", "created_at", "updated_at", "scaling_stat", "attribute", "motion_values", "tags", "alternative_definitions", "origin_type") SELECT "id", "entity_id", "name", "parent_name", "description", "icon_path", "unlocked_at", "echo_set_bonus_requirement", "created_at", "updated_at", "scaling_stat", "attribute", "motion_values", "tags", "alternative_definitions", "origin_type" FROM `attacks`;--> statement-breakpoint
DROP TABLE `attacks`;--> statement-breakpoint
ALTER TABLE `__new_attacks` RENAME TO `attacks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;