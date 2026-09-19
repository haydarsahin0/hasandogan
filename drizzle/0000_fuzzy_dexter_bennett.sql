CREATE TABLE `attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`seminar_id` text NOT NULL,
	`template` text NOT NULL,
	`language` text DEFAULT 'tr' NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`seminar_id`) REFERENCES `seminars`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`place_id` text,
	`name` text NOT NULL,
	`city` text NOT NULL,
	`specialty` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`consent` integer DEFAULT 0 NOT NULL,
	`consent_source` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contacts_place_id_unique` ON `contacts` (`place_id`);--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`contact_id` text NOT NULL,
	`status` text NOT NULL,
	`provider_id` text DEFAULT '' NOT NULL,
	`error` text DEFAULT '' NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `delivery_unique` ON `deliveries` (`campaign_id`,`contact_id`);--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`seminar_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`seminar_id`) REFERENCES `seminars`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enrollment_unique` ON `enrollments` (`user_id`,`seminar_id`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`queries` text NOT NULL,
	`cursor` integer DEFAULT 0 NOT NULL,
	`page_token` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`found` integer DEFAULT 0 NOT NULL,
	`error` text DEFAULT '' NOT NULL,
	`lease` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `places` (
	`id` text PRIMARY KEY NOT NULL,
	`city` text NOT NULL,
	`specialty` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `seminars` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`start` text NOT NULL,
	`duration` integer NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`capacity` integer NOT NULL,
	`format` text NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`meet_url` text DEFAULT '' NOT NULL,
	`published` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`password` text NOT NULL,
	`salt` text NOT NULL,
	`must_change` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);