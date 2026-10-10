-- ==========================================================
-- Brainy Bot - MySQL Database Schema
-- ==========================================================
-- The target database is chosen by the DB_NAME value in .env.
-- Run with:  npm run db:init
-- ==========================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------
-- users
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(120)    NOT NULL,
  `email`         VARCHAR(190)    NOT NULL,
  `password_hash` VARCHAR(255)    NOT NULL,
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- quizzes
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `quizzes`;
CREATE TABLE `quizzes` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_id`        BIGINT UNSIGNED NOT NULL,
  `title`           VARCHAR(255)    NOT NULL,
  `description`     TEXT            NULL,
  `visibility`      ENUM('private','public') NOT NULL DEFAULT 'private',
  `status`          ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  `cover_image_url` VARCHAR(1024)   NULL,
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_quizzes_owner` (`owner_id`),
  KEY `idx_quizzes_status` (`status`),
  KEY `idx_quizzes_visibility` (`visibility`),
  CONSTRAINT `fk_quizzes_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- questions
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `questions`;
CREATE TABLE `questions` (
  `id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `quiz_id`            BIGINT UNSIGNED NOT NULL,
  `question_text`      TEXT            NOT NULL,
  `question_type`      ENUM('multiple_choice','true_false') NOT NULL DEFAULT 'multiple_choice',
  `position`           INT             NOT NULL DEFAULT 1,
  `time_limit_seconds` INT             NOT NULL DEFAULT 20,
  `base_points`        INT             NOT NULL DEFAULT 1000,
  `image_url`          VARCHAR(1024)   NULL,
  `explanation`        TEXT            NULL,
  `created_at`         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_questions_quiz` (`quiz_id`, `position`),
  CONSTRAINT `fk_questions_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- answer_options
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `answer_options`;
CREATE TABLE `answer_options` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `question_id` BIGINT UNSIGNED NOT NULL,
  `option_text` VARCHAR(500)    NOT NULL,
  `position`    INT             NOT NULL DEFAULT 1,
  `is_correct`  TINYINT(1)      NOT NULL DEFAULT 0,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_options_question` (`question_id`, `position`),
  CONSTRAINT `fk_options_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- game_sessions
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `game_sessions`;
CREATE TABLE `game_sessions` (
  `id`                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `quiz_id`               BIGINT UNSIGNED NOT NULL,
  `host_id`               BIGINT UNSIGNED NOT NULL,
  `game_pin`              VARCHAR(16)     NOT NULL,
  `status`                ENUM('lobby','running','completed','cancelled') NOT NULL DEFAULT 'lobby',
  `current_question_id`   BIGINT UNSIGNED NULL,
  `current_question_index` INT            NOT NULL DEFAULT -1,
  `question_started_at`   DATETIME        NULL,
  `question_deadline_at`  DATETIME        NULL,
  `started_at`            DATETIME        NULL,
  `ended_at`              DATETIME        NULL,
  `created_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sessions_pin` (`game_pin`),
  KEY `idx_sessions_host` (`host_id`),
  KEY `idx_sessions_quiz` (`quiz_id`),
  KEY `idx_sessions_status` (`status`),
  CONSTRAINT `fk_sessions_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sessions_host` FOREIGN KEY (`host_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sessions_current_question` FOREIGN KEY (`current_question_id`) REFERENCES `questions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- participants
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `participants`;
CREATE TABLE `participants` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id`   BIGINT UNSIGNED NOT NULL,
  `nickname`     VARCHAR(60)     NOT NULL,
  `total_score`  INT             NOT NULL DEFAULT 0,
  `status`       ENUM('connected','disconnected','removed','finished') NOT NULL DEFAULT 'connected',
  `joined_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `left_at`      DATETIME        NULL,
  PRIMARY KEY (`id`),
  KEY `idx_participants_session` (`session_id`),
  UNIQUE KEY `uq_participants_session_nickname` (`session_id`, `nickname`),
  CONSTRAINT `fk_participants_session` FOREIGN KEY (`session_id`) REFERENCES `game_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- answer_submissions
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `answer_submissions`;
CREATE TABLE `answer_submissions` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id`        BIGINT UNSIGNED NOT NULL,
  `participant_id`    BIGINT UNSIGNED NOT NULL,
  `question_id`       BIGINT UNSIGNED NOT NULL,
  `selected_option_id` BIGINT UNSIGNED NULL,
  `is_correct`        TINYINT(1)      NOT NULL DEFAULT 0,
  `points_awarded`    INT             NOT NULL DEFAULT 0,
  `response_time_ms`  INT             NOT NULL DEFAULT 0,
  `submitted_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_answer_participant_question` (`participant_id`, `question_id`),
  KEY `idx_answers_session` (`session_id`),
  KEY `idx_answers_question` (`question_id`),
  CONSTRAINT `fk_answers_session` FOREIGN KEY (`session_id`) REFERENCES `game_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_answers_participant` FOREIGN KEY (`participant_id`) REFERENCES `participants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_answers_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_answers_option` FOREIGN KEY (`selected_option_id`) REFERENCES `answer_options` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- Done. Run `npm run db:seed` to insert demo data.
-- ==========================================================
