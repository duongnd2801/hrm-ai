-- V27__update_cccd_hanoi_context.sql
-- Cập nhật CCCD và nơi cấp, trường học sang khu vực Hà Nội cho hợp lý

UPDATE employees
SET 
  -- 1. Cập nhật citizen_id (CCCD)
  -- Sử dụng đầu số 001 (Hà Nội) cho phần lớn, và một ít các tỉnh lân cận
  citizen_id = (
    CASE FLOOR(RANDOM() * 5)
      WHEN 0 THEN '001' -- Hà Nội
      WHEN 1 THEN '027' -- Bắc Ninh
      WHEN 2 THEN '033' -- Hưng Yên
      WHEN 3 THEN '035' -- Hà Nam
      ELSE '001'
    END
  ) || LPAD(FLOOR(RANDOM() * 1000000000)::text, 9, '0'),

  -- 2. Cập nhật nơi cấp (citizen_id_place)
  citizen_id_place = (
    CASE FLOOR(RANDOM() * 4)
      WHEN 0 THEN 'Cục CS QLHC về TTXH'
      WHEN 1 THEN 'CA TP. Hà Nội'
      WHEN 2 THEN 'CA Tỉnh Bắc Ninh'
      ELSE 'CA Tỉnh Hưng Yên'
    END
  ),

  -- 3. Cập nhật trường đại học (university) sang HN
  university = (
    CASE FLOOR(RANDOM() * 6)
      WHEN 0 THEN 'ĐH Bách Khoa Hà Nội'
      WHEN 1 THEN 'ĐH Quốc gia Hà Nội'
      WHEN 2 THEN 'ĐH Kinh tế Quốc dân'
      WHEN 3 THEN 'ĐH Ngoại thương'
      WHEN 4 THEN 'ĐH Giao thông Vận tải'
      ELSE 'Học viện Công nghệ Bưu chính Viễn thông'
    END
  )
WHERE email IS NOT NULL; -- Áp dụng cho toàn bộ nhân viên
