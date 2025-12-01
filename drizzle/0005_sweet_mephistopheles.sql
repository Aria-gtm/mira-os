CREATE TABLE `dailyGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`personalGoal` text,
	`professionalGoal` text,
	`growthGoal` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dailyGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailyReflections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`personalProgress` text,
	`professionalProgress` text,
	`growthProgress` text,
	`patterns` text,
	`wins` text,
	`struggles` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dailyReflections_id` PRIMARY KEY(`id`)
);
