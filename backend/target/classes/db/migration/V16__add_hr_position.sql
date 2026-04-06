-- V16__add_hr_position.sql
-- Thêm chức danh HR nếu chưa có

INSERT INTO positions (id, name, description, is_locked) 
VALUES ('22222222-2222-2222-2222-222222222226', 'HR', 'Human Resources', TRUE)
ON CONFLICT (name) DO NOTHING;
