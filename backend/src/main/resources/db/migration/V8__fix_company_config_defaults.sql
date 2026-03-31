-- V8__fix_company_config_defaults.sql — Đảm bảo cấu hình công ty mặc định chính xác.
-- Di chuyển logic từ V2 bị ghi đè nhầm sang V8 để bảo toàn lịch sử Flyway.

UPDATE company_config 
SET 
  work_start_time = '09:00',
  work_end_time = '18:00',
  lunch_break_start = '12:00',
  lunch_break_end = '13:00',
  early_checkin_minutes = 30,
  standard_hours = 8.0,
  standard_days_per_month = 22,
  cutoff_day = 25,
  ot_rate_weekday = 1.5,
  ot_rate_weekend = 2.0,
  ot_rate_holiday = 3.0,
  ot_rate_holiday_comp = 2.0,
  half_day_morning_rate = 0.4,
  half_day_afternoon_rate = 0.6
WHERE id = 'default';
