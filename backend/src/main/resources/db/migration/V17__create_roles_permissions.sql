-- V17__create_roles_permissions.sql
-- Create Role-Based Access Control (RBAC) tables

-- Create permissions table
CREATE TABLE permissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL UNIQUE,
  code       VARCHAR(100) NOT NULL UNIQUE,
  module     VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create roles table
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Create junction table for role-permission mapping
CREATE TABLE role_permissions (
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Seed default roles
INSERT INTO roles (name, description) VALUES 
('ADMIN', 'Quản trị viên hệ thống'),
('HR', 'Nhân viên HR'),
('MANAGER', 'Trưởng phòng ban'),
('EMPLOYEE', 'Nhân viên thường');

-- Create indexes for performance
CREATE INDEX idx_permissions_code ON permissions(code);
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
