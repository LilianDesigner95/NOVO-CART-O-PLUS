CREATE TABLE `audit` (
	`owner` text NOT NULL,
	`event_id` text NOT NULL,
	`operation` text NOT NULL,
	`created_at` text NOT NULL,
	`revision` integer NOT NULL,
	PRIMARY KEY(`owner`, `event_id`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`owner` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
