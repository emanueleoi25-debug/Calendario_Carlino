CREATE DATABASE IF NOT EXISTS `calendario_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `calendario_db`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin','user') NOT NULL DEFAULT 'user',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `calendars` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `type` ENUM('office','private','sub-office') NOT NULL,
  `owner_user_id` INT UNSIGNED NULL,
  `color` VARCHAR(20) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_calendars_type` (`type`),
  KEY `idx_calendars_owner` (`owner_user_id`),
  CONSTRAINT `fk_calendars_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `events` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `calendar_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `start_datetime` DATETIME NOT NULL,
  `end_datetime` DATETIME NOT NULL,
  `is_all_day` TINYINT(1) NOT NULL DEFAULT 0,
  `created_by_user_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_events_calendar` (`calendar_id`),
  KEY `idx_events_start_end` (`start_datetime`,`end_datetime`),
  CONSTRAINT `fk_events_calendar` FOREIGN KEY (`calendar_id`) REFERENCES `calendars` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_events_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `calendar_permissions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `calendar_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `can_edit` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_calendar_user` (`calendar_id`,`user_id`),
  CONSTRAINT `fk_calendar_permissions_calendar` FOREIGN KEY (`calendar_id`) REFERENCES `calendars` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_calendar_permissions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `access_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NULL,
  `action` VARCHAR(255) NOT NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` VARCHAR(45) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_access_logs_user` (`user_id`),
  CONSTRAINT `fk_access_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `sub_offices` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `parent_office_id` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sub_offices_parent` (`parent_office_id`),
  CONSTRAINT `fk_sub_offices_parent` FOREIGN KEY (`parent_office_id`) REFERENCES `sub_offices` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `user_sub_offices` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `sub_office_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_sub` (`user_id`,`sub_office_id`),
  CONSTRAINT `fk_user_sub_offices_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_sub_offices_sub` FOREIGN KEY (`sub_office_id`) REFERENCES `sub_offices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO users (username, email, password_hash, role)
VALUES (
  'admin',
  'admin@example.com',
  -- password: admin123 (bcrypt hash da aggiornare lato app se necessario)
  'admin123',
  'admin'
)
ON DUPLICATE KEY UPDATE email = VALUES(email), password_hash = VALUES(password_hash);

INSERT INTO calendars (name, type, owner_user_id, color)
SELECT 'Calendario Ufficio', 'office', users.id, '#2563eb'
FROM users WHERE users.username = 'admin'
ON DUPLICATE KEY UPDATE color = VALUES(color);
