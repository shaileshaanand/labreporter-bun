CREATE TABLE `USGReports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patientId` integer NOT NULL,
	`referrerId` integer NOT NULL,
	`partOfScan` text NOT NULL,
	`findings` text NOT NULL,
	`date` integer NOT NULL,
	`deleted` integer DEFAULT false,
	`createdAt` integer,
	FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`referrerId`) REFERENCES `doctors`(`id`) ON UPDATE no action ON DELETE no action
);
