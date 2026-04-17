-- V32__add_attendance_indexes.sql
-- Thêm DB index cho bảng attendances để tối ưu truy vấn chấm công

-- Index cho tính năng getAttendanceByEmployeeAndDate
CREATE INDEX IF NOT EXISTS idx_attendances_emp_date ON attendances(employee_id, date);

-- Partial index cho truy vấn thống kê mảng chấm công theo tháng (tránh full table scan hàng tháng)
-- Hàm EXTRACT có thể được hỗ trợ bởi expression index trong Postgres
CREATE INDEX IF NOT EXISTS idx_attendances_emp_year_month ON attendances(
    employee_id, 
    EXTRACT(YEAR FROM date), 
    EXTRACT(MONTH FROM date)
);
