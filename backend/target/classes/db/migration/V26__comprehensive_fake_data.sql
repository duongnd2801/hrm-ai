-- V26__comprehensive_fake_data.sql
-- Lấp đầy dữ liệu mẫu quanh Hà Nội và tạo các kịch bản thực tế (Nghỉ việc, Hết hợp đồng)

UPDATE employees
SET 
  -- Gán giới tính ngẫu nhiên nếu trống
  gender = CASE 
    WHEN gender IS NULL THEN (CASE WHEN RANDOM() < 0.6 THEN 'MALE'::gender_type ELSE 'FEMALE'::gender_type END)
    ELSE gender 
  END,
  
  -- Gán ngày sinh ngẫu nhiên từ 1988 đến 2000 nếu trống
  birth_date = CASE 
    WHEN birth_date IS NULL THEN (MAKE_DATE(1988 + FLOOR(RANDOM() * 12)::int, 1 + FLOOR(RANDOM() * 12)::int, 1 + FLOOR(RANDOM() * 28)::int))
    ELSE birth_date 
  END,
  
  -- Địa chỉ tập trung quanh HÀ NỘI
  address = CASE 
    WHEN address IS NULL OR address = '' OR address LIKE '%TP.HCM%' THEN (
      CASE FLOOR(RANDOM() * 7)
        WHEN 0 THEN 'Số 12 Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội'
        WHEN 1 THEN 'Ngõ 102 Đống Đa, Ô Chợ Dừa, Đống Đa, Hà Nội'
        WHEN 2 THEN 'Số 45 Liễu Giai, Ba Đình, Hà Nội'
        WHEN 3 THEN 'Số 89 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội'
        WHEN 4 THEN 'Chung cư Royal City, Thanh Xuân, Hà Nội'
        WHEN 5 THEN 'Số 15 Hai Bà Trưng, Tràng Tiền, Hoàn Kiếm, Hà Nội'
        ELSE 'Số 22 Duy Tân, Mỹ Đình, Nam Từ Liêm, Hà Nội'
      END
    )
    ELSE address
  END,
  
  -- Gán số điện thoại nếu trống
  phone = CASE 
    WHEN phone IS NULL OR phone = '' THEN '09' || LPAD(FLOOR(RANDOM() * 100000000)::text, 8, '0')
    ELSE phone
  END,
  
  -- Gán vị trí & phòng ban nếu chưa có
  department_id = COALESCE(department_id, (SELECT id FROM departments ORDER BY RANDOM() LIMIT 1)),
  position_id = COALESCE(position_id, (SELECT id FROM positions ORDER BY RANDOM() LIMIT 1));

-- --- TẠO CÁC KỊCH BẢN THỰC TẾ ---

-- 1. Cho 3 người ngẫu nhiên nghỉ việc (INACTIVE)
UPDATE employees 
SET status = 'INACTIVE', end_date = '2024-03-15'
WHERE id IN (SELECT id FROM employees WHERE email NOT LIKE 'admin%' ORDER BY RANDOM() LIMIT 3);

-- 2. Cho 4 người ngẫu nhiên hết hạn hợp đồng (end_date trong quá khứ)
UPDATE employees 
SET end_date = '2023-12-31', status = 'CONTRACT'
WHERE id IN (SELECT id FROM employees WHERE status = 'ACTIVE' ORDER BY RANDOM() LIMIT 4);

-- 3. Cập nhật lại thâm niên logic: join_date từ 2020-2023 cho đa dạng
UPDATE employees 
SET join_date = MAKE_DATE(2020 + FLOOR(RANDOM() * 4)::int, 1 + FLOOR(RANDOM() * 12)::int, 1 + FLOOR(RANDOM() * 28)::int),
    start_date = join_date
WHERE join_date > NOW() OR join_date IS NULL;
