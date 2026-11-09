-- Migration 001: Initial schema for CivicFix

CREATE TABLE IF NOT EXISTS wards (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(100) NULL,
  center_lat DOUBLE NULL,
  center_lng DOUBLE NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS departments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(40) NOT NULL, -- lucide icon name
  default_department_id INT UNSIGNED NOT NULL,
  sla_hours INT UNSIGNED NOT NULL,
  CONSTRAINT fk_cat_dept FOREIGN KEY (default_department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE, -- default collation is case-insensitive
  password_hash VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NULL,
  role ENUM('citizen','ward_admin') NOT NULL,
  ward_id INT UNSIGNED NULL, -- ward_admin: scope (NULL = all wards)
  department_id INT UNSIGNED NULL, -- ward_admin team member's department (NULL = ward lead)
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_seed TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_login_at DATETIME(3) NULL,
  CONSTRAINT fk_users_ward FOREIGN KEY (ward_id) REFERENCES wards(id),
  CONSTRAINT fk_users_dept FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT chk_users_dept CHECK (role = 'ward_admin' OR department_id IS NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS issues (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  issue_code VARCHAR(16) NULL UNIQUE, -- 'CF-024'; set right after insert from id
  title VARCHAR(160) NOT NULL,
  summary VARCHAR(500) NULL,
  description TEXT NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  ward_id INT UNSIGNED NOT NULL,
  department_id INT UNSIGNED NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  address VARCHAR(255) NULL,
  status ENUM('reported','assigned','in_progress','awaiting_verification','resolved','reopened','rejected')
    NOT NULL DEFAULT 'reported',
  priority ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  assigned_to INT UNSIGNED NULL,
  triage_confirmed_at DATETIME(3) NULL,
  triage_confirmed_by INT UNSIGNED NULL,
  first_assigned_at DATETIME(3) NULL,
  sla_due_at DATETIME(3) NULL,
  resolved_at DATETIME(3) NULL,
  reopened_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_public TINYINT(1) NOT NULL DEFAULT 1, -- 0 while spam-flagged report awaits moderation
  is_seed TINYINT(1) NOT NULL DEFAULT 0,
  created_by INT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_issues_cat FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_issues_ward FOREIGN KEY (ward_id) REFERENCES wards(id),
  CONSTRAINT fk_issues_dept FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_issues_asg FOREIGN KEY (assigned_to) REFERENCES users(id),
  CONSTRAINT fk_issues_tri FOREIGN KEY (triage_confirmed_by) REFERENCES users(id),
  CONSTRAINT fk_issues_by FOREIGN KEY (created_by) REFERENCES users(id),
  KEY idx_issues_ward_cat_status_date (ward_id, category_id, status, created_at),
  KEY idx_issues_status (status),
  KEY idx_issues_created (created_at),
  KEY idx_issues_geo (latitude, longitude),
  KEY idx_issues_assigned (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reports (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  issue_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  description TEXT NOT NULL,
  image_url VARCHAR(500) NULL,
  image_key VARCHAR(255) NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  address VARCHAR(255) NULL,
  chosen_category_id INT UNSIGNED NOT NULL,
  ai_suggested_category_id INT UNSIGNED NULL,
  language VARCHAR(10) NULL,
  review_status ENUM('accepted','flagged','rejected') NOT NULL DEFAULT 'accepted',
  flag_reason VARCHAR(255) NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_rep_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  CONSTRAINT fk_rep_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_rep_cat FOREIGN KEY (chosen_category_id) REFERENCES categories(id),
  CONSTRAINT fk_rep_aicat FOREIGN KEY (ai_suggested_category_id) REFERENCES categories(id),
  KEY idx_rep_issue (issue_id),
  KEY idx_rep_user_date (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS issue_support (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  issue_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_support (issue_id, user_id),
  CONSTRAINT fk_sup_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  CONSTRAINT fk_sup_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS assignments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  issue_id INT UNSIGNED NOT NULL,
  department_id INT UNSIGNED NOT NULL,
  assigned_to INT UNSIGNED NULL, -- responsible team member (optional)
  assigned_by INT UNSIGNED NOT NULL,
  note VARCHAR(500) NULL,
  sla_due_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ended_at DATETIME(3) NULL,
  CONSTRAINT fk_asg_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  CONSTRAINT fk_asg_dept FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_asg_to FOREIGN KEY (assigned_to) REFERENCES users(id),
  CONSTRAINT fk_asg_by FOREIGN KEY (assigned_by) REFERENCES users(id),
  KEY idx_asg_issue (issue_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS issue_updates (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  issue_id INT UNSIGNED NOT NULL,
  update_type ENUM('reported','report_added','support_added','triage','assignment','status_changed',
    'note','evidence_added','verification','reopened','moderation') NOT NULL,
  from_status VARCHAR(30) NULL,
  to_status VARCHAR(30) NULL,
  actor_id INT UNSIGNED NULL,
  visibility ENUM('public','internal') NOT NULL DEFAULT 'public',
  note TEXT NULL,
  next_step VARCHAR(255) NULL,
  metadata JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_upd_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  CONSTRAINT fk_upd_actor FOREIGN KEY (actor_id) REFERENCES users(id),
  KEY idx_upd_issue_date (issue_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS evidence (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  issue_id INT UNSIGNED NOT NULL,
  uploaded_by INT UNSIGNED NOT NULL,
  kind ENUM('before','progress','after') NOT NULL, -- 'after' = completion/closure proof
  url VARCHAR(500) NOT NULL,
  storage_key VARCHAR(255) NULL,
  caption VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_ev_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  CONSTRAINT fk_ev_user FOREIGN KEY (uploaded_by) REFERENCES users(id),
  KEY idx_ev_issue (issue_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS resolution_feedback (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  issue_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  cycle SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  outcome ENUM('confirmed','disputed') NOT NULL,
  rating TINYINT UNSIGNED NULL,
  comment TEXT NULL,
  image_url VARCHAR(500) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_feedback (issue_id, user_id, cycle),
  CONSTRAINT chk_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  CONSTRAINT fk_fb_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  CONSTRAINT fk_fb_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  type VARCHAR(40) NOT NULL,
  title VARCHAR(160) NOT NULL,
  body VARCHAR(500) NULL,
  issue_id INT UNSIGNED NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_not_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_not_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  KEY idx_not_user (user_id, is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_logs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  operation ENUM('classify','duplicates','summarize') NOT NULL,
  user_id INT UNSIGNED NULL,
  issue_id INT UNSIGNED NULL,
  input_hash CHAR(64) NULL,
  model VARCHAR(80) NULL,
  output JSON NULL,
  status ENUM('ok','fallback','error') NOT NULL,
  latency_ms INT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
