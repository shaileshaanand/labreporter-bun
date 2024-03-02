CREATE TABLE `patients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`age` integer,
	`gender` text NOT NULL,
	`deleted` integer DEFAULT false,
	`createdAt` integer
);
