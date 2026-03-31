-- V7__update_company_config_defaults.sql — Set default values for company configuration

UPDATE company_config 
SET 
  work_start_time = '08:00:00',
  work_end_time = '17:00:00',
  lunch_break_start = '12:00:00',
  lunch_break_end = '13:00:00',
  early_checkin_minutes = 15,
  standard_hours = 8.0,
  standard_days_per_month = 22,
  cutoff_day = 25,
  ot_rate_weekday = 1.5,
  ot_rate_weekend = 2.0,
  ot_rate_holiday = 3.0,
  ot_rate_holiday_comp = 1.0,
  half_day_morning_rate = 0.5,
  half_day_afternoon_rate = 0.5
WHERE id = 'default' AND ot_rate_weekday IS NULL;
