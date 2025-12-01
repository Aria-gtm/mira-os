CREATE TABLE `accountabilityPartners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`partnerId` int,
	`partnerEmail` varchar(320) NOT NULL,
	`partnerName` varchar(255),
	`status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`permissions` varchar(50) NOT NULL DEFAULT 'view_goals',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accountabilityPartners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shareTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`permissions` varchar(50) NOT NULL DEFAULT 'view_goals',
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shareTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `shareTokens_token_unique` UNIQUE(`token`)
);
