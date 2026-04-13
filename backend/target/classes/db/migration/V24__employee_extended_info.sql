-- V24__employee_extended_info.sql — Bổ sung thông tin nhân viên theo bảng DSNLĐ
-- Thêm 16 cột mới vào bảng employees (tất cả NULLABLE, không breaking change)

ALTER TABLE employees

  -- Nhóm HỢP ĐỒNG: Quản lý cấp 2, Ngày vào, Ngày ký HĐ
  ADD COLUMN manager2_id            UUID REFERENCES employees(id),
  ADD COLUMN join_date              DATE,
  ADD COLUMN contract_signing_date  DATE,

  -- Nhóm CÁ NHÂN: Email cá nhân, CCCD
  ADD COLUMN personal_email         VARCHAR(255),
  ADD COLUMN citizen_id             VARCHAR(20),
  ADD COLUMN citizen_id_date        DATE,
  ADD COLUMN citizen_id_place       VARCHAR(255),

  -- Nhóm NGƯỜI THÂN LIÊN HỆ
  ADD COLUMN emergency_contact_name         VARCHAR(255),
  ADD COLUMN emergency_contact_relationship VARCHAR(50),
  ADD COLUMN emergency_contact_phone        VARCHAR(20),

  -- Nhóm TRÌNH ĐỘ
  ADD COLUMN programming_languages  VARCHAR(500),
  ADD COLUMN major                  VARCHAR(255),
  ADD COLUMN university             VARCHAR(255),
  ADD COLUMN education_level        VARCHAR(50),
  ADD COLUMN graduation_year        INT,
  ADD COLUMN it_certificate         TEXT;
