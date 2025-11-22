PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_motor` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`motor_name` text NOT NULL,
	`time` text DEFAULT (datetime('now', 'localtime')) NOT NULL,
	`ml` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_motor`("id", "motor_name", "time", "ml") SELECT "id", "motor_name", "time", "ml" FROM `motor`;--> statement-breakpoint
DROP TABLE `motor`;--> statement-breakpoint
ALTER TABLE `__new_motor` RENAME TO `motor`;--> statement-breakpoint
PRAGMA foreign_keys=ON;