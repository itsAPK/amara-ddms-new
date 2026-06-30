-- DDMS schema for MySQL/MariaDB. Mirrors db/schema.ts exactly.
-- Applied idempotently by db/migrate.ts (uses CREATE TABLE IF NOT EXISTS).
-- utf8mb4_unicode_ci is case-insensitive, so email lookups/uniqueness work
-- correctly without needing a separate functional lower() index.

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('SUPER_ADMIN','USER') NOT NULL DEFAULT 'USER',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at DATETIME,
  created_by_id VARCHAR(36),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY users_email_idx (email)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  description TEXT,
  color VARCHAR(16) NOT NULL DEFAULT '#2f6b5f',
  icon VARCHAR(60) NOT NULL DEFAULT 'FolderKanban',
  sort_order INT NOT NULL DEFAULT 0,
  created_by_id VARCHAR(36),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY departments_slug_idx (slug),
  CONSTRAINT fk_departments_created_by FOREIGN KEY (created_by_id) REFERENCES users(id)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS folders (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  department_id VARCHAR(36) NOT NULL,
  parent_id VARCHAR(36),
  sort_order INT NOT NULL DEFAULT 0,
  created_by_id VARCHAR(36),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY folders_department_idx (department_id),
  KEY folders_parent_idx (parent_id),
  CONSTRAINT fk_folders_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  CONSTRAINT fk_folders_parent FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE,
  CONSTRAINT fk_folders_created_by FOREIGN KEY (created_by_id) REFERENCES users(id)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_name VARCHAR(255) NOT NULL,
  stored_file_name VARCHAR(255) NOT NULL,
  file_type ENUM('PDF','DOC','DOCX','XLS','XLSX','PPT','PPTX','JPG','JPEG','PNG') NOT NULL,
  file_size INT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  folder_id VARCHAR(36) NOT NULL,
  uploaded_by_id VARCHAR(36),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY documents_folder_idx (folder_id),
  CONSTRAINT fk_documents_folder FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
  CONSTRAINT fk_documents_uploaded_by FOREIGN KEY (uploaded_by_id) REFERENCES users(id)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS document_versions (
  id VARCHAR(36) PRIMARY KEY,
  document_id VARCHAR(36) NOT NULL,
  version INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  stored_file_name VARCHAR(255) NOT NULL,
  file_size INT NOT NULL,
  uploaded_by_id VARCHAR(36),
  created_at DATETIME NOT NULL,
  KEY document_versions_document_idx (document_id),
  CONSTRAINT fk_docversions_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_docversions_uploaded_by FOREIGN KEY (uploaded_by_id) REFERENCES users(id)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS department_permissions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  department_id VARCHAR(36) NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT TRUE,
  can_upload BOOLEAN NOT NULL DEFAULT FALSE,
  can_edit BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete BOOLEAN NOT NULL DEFAULT FALSE,
  can_download BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY department_permissions_user_dept_idx (user_id, department_id),
  CONSTRAINT fk_deptperm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_deptperm_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS folder_permissions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  folder_id VARCHAR(36) NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT TRUE,
  can_upload BOOLEAN NOT NULL DEFAULT FALSE,
  can_edit BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete BOOLEAN NOT NULL DEFAULT FALSE,
  can_download BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY folder_permissions_user_folder_idx (user_id, folder_id),
  CONSTRAINT fk_folderperm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_folderperm_folder FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  user_name VARCHAR(100),
  user_email VARCHAR(255),
  action ENUM(
    'LOGIN_SUCCESS','LOGIN_FAILED','LOGOUT','PASSWORD_CHANGED','PASSWORD_RESET',
    'USER_CREATED','USER_UPDATED','USER_ACTIVATED','USER_DEACTIVATED','PERMISSION_CHANGED',
    'DEPARTMENT_CREATED','DEPARTMENT_UPDATED','DEPARTMENT_DELETED',
    'FOLDER_CREATED','FOLDER_UPDATED','FOLDER_DELETED',
    'DOCUMENT_UPLOADED','DOCUMENT_UPDATED','DOCUMENT_REPLACED','DOCUMENT_DELETED',
    'DOCUMENT_VIEWED','DOCUMENT_DOWNLOADED'
  ) NOT NULL,
  target_type VARCHAR(60),
  target_id VARCHAR(36),
  target_label VARCHAR(255),
  details TEXT,
  ip_address VARCHAR(64),
  created_at DATETIME NOT NULL,
  KEY audit_logs_user_idx (user_id),
  KEY audit_logs_action_idx (action),
  KEY audit_logs_created_idx (created_at)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
