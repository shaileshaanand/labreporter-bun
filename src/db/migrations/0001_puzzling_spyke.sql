CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`firstName` text NOT NULL,
	`lastName` text,
	`username` text NOT NULL,
	`passwordHash` text NOT NULL,
	`deleted` integer DEFAULT false,
	`createdAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);