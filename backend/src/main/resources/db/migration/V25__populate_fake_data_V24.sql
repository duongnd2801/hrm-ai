-- V25__populate_fake_data_V24.sql
-- Cập nhật dữ liệu mẫu cho các trường mở rộng vừa thêm ở V24

UPDATE employees
SET 
  -- Đồng bộ ngày vào làm với ngày bắt đầu (nếu chưa có)
  join_date = COALESCE(join_date, start_date),
  contract_signing_date = COALESCE(contract_signing_date, start_date),
  
  -- Thông tin cá nhân mẫu
  personal_email = LOWER(REPLACE(full_name, ' ', '.')) || '@gmail.com',
  citizen_id = '079' || LPAD(FLOOR(RANDOM() * 1000000000)::text, 9, '0'),
  citizen_id_date = '2021-05-15',
  citizen_id_place = 'CA TP. Hồ Chí Minh',
  
  -- Người thân khẩn cấp mẫu
  emergency_contact_name = 'Người thân của ' || full_name,
  emergency_contact_relationship = CASE WHEN FLOOR(RANDOM() * 2) = 0 THEN 'Vợ/Chồng' ELSE 'Bố/Mẹ' END,
  emergency_contact_phone = '09' || LPAD(FLOOR(RANDOM() * 100000000)::text, 8, '0'),
  
  -- Trình độ học vấn mẫu
  programming_languages = 'Java, TypeScript, SQL',
  university = CASE 
    WHEN FLOOR(RANDOM() * 3) = 0 THEN 'ĐH Bách Khoa TP.HCM' 
    WHEN FLOOR(RANDOM() * 3) = 1 THEN 'ĐH Công nghệ Thông tin - ĐHQG'
    ELSE 'Học viện Công nghệ Bưu chính Viễn thông' 
  END,
  major = 'Công nghệ phần mềm',
  education_level = 'Đại học',
  graduation_year = 2018 + FLOOR(RANDOM() * 6),
  it_certificate = 'AWS Certified, IELTS 7.0';

-- Gán Manager cấp 2 mẫu cho tất cả những ai đã có manager 1 (manager1 là manager2 của manager1)
-- Nếu manager1 không có manager, gán cho admin đầu tiên
UPDATE employees e
SET manager2_id = (
  SELECT m1.manager_id 
  FROM employees m1 
  WHERE m1.id = e.manager_id 
  AND m1.manager_id IS NOT NULL 
  LIMIT 1
)
WHERE e.manager_id IS NOT NULL;

-- Backup: Nếu manager2 vẫn null mà có manager1, gán cho Admin
UPDATE employees e
SET manager2_id = (SELECT id FROM employees WHERE email = 'admin@company.com' LIMIT 1)
WHERE e.manager_id IS NOT NULL 
  AND e.manager2_id IS NULL 
  AND e.email <> 'admin@company.com';
