-- V1__init.sql — HRM Database Schema

-- ENUMs
CREATE TYPE role_type         AS ENUM ('EMPLOYEE', 'MANAGER', 'HR', 'ADMIN');
CREATE TYPE gender_type       AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE emp_status        AS ENUM ('ACTIVE', 'INACTIVE', 'CONTRACT', 'PROBATION', 'COLLABORATOR');
CREATE TYPE contract_type     AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'PROBATION', 'COLLABORATOR');
CREATE TYPE attendance_status AS ENUM ('PENDING','ON_TIME','LATE','INSUFFICIENT','ABSENT','APPROVED','DAY_OFF');
CREATE TYPE apology_type      AS ENUM ('LATE','FORGOT_CHECKIN','FORGOT_CHECKOUT','INSUFFICIENT_HOURS');
CREATE TYPE apology_status    AS ENUM ('PENDING','APPROVED','REJECTED');
CREATE TYPE leave_type        AS ENUM ('ANNUAL','OT_LEAVE','SICK','UNPAID','HALF_DAY_AM','HALF_DAY_PM');

-- Users (accounts)
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       role_type NOT NULL DEFAULT 'EMPLOYEE',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Departments
CREATE TABLE departments (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL
);

-- Positions
CREATE TABLE positions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(100) UNIQUE NOT NULL,
  description    TEXT,
  is_locked      BOOLEAN DEFAULT FALSE,
  multi_per_dept BOOLEAN DEFAULT TRUE,
  standalone     BOOLEAN DEFAULT TRUE
);

-- Employees
CREATE TABLE employees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE REFERENCES users(id),
  full_name       VARCHAR(255) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  phone           VARCHAR(20),
  address         TEXT,
  bio             TEXT,
  gender          gender_type,
  birth_date      DATE,
  status          emp_status DEFAULT 'ACTIVE',
  contract_type   contract_type DEFAULT 'FULL_TIME',
  start_date      DATE NOT NULL,
  end_date        DATE,
  department_id   UUID REFERENCES departments(id),
  position_id     UUID REFERENCES positions(id),
  manager_id      UUID REFERENCES employees(id),
  base_salary     BIGINT DEFAULT 0,
  tax_dependents  INT DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Company configuration
CREATE TABLE company_config (
  id                      VARCHAR(10) PRIMARY KEY DEFAULT 'default',
  work_start_time         TIME DEFAULT '09:00',
  work_end_time           TIME DEFAULT '18:00',
  lunch_break_start       TIME DEFAULT '12:00',
  lunch_break_end         TIME DEFAULT '13:00',
  early_checkin_minutes   INT DEFAULT 30,
  standard_hours          DECIMAL(4,1) DEFAULT 8.0,
  standard_days_per_month INT DEFAULT 26,
  cutoff_day              INT DEFAULT 10,
  ot_rate_weekday         DECIMAL(3,1) DEFAULT 1.5,
  ot_rate_weekend         DECIMAL(3,1) DEFAULT 2.0,
  ot_rate_holiday         DECIMAL(3,1) DEFAULT 3.0,
  ot_rate_holiday_comp    DECIMAL(3,1) DEFAULT 2.0,
  half_day_morning_rate   DECIMAL(3,2) DEFAULT 0.4,
  half_day_afternoon_rate DECIMAL(3,2) DEFAULT 0.6,
  updated_at              TIMESTAMP DEFAULT NOW()
);

-- Attendances
CREATE TABLE attendances (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID NOT NULL REFERENCES employees(id),
  date         DATE NOT NULL,
  check_in     TIMESTAMP,
  check_out    TIMESTAMP,
  total_hours  DECIMAL(5,2),
  status       attendance_status DEFAULT 'PENDING',
  note         TEXT,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE (employee_id, date)
);

-- Apologies (đơn xin tha tội)
CREATE TABLE apologies (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    UUID NOT NULL REFERENCES employees(id),
  attendance_id  UUID UNIQUE NOT NULL REFERENCES attendances(id),
  type           apology_type NOT NULL,
  reason         TEXT NOT NULL,
  file_url       VARCHAR(500),
  status         apology_status DEFAULT 'PENDING',
  reviewed_by    UUID REFERENCES users(id),
  review_note    TEXT,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

-- Leave requests
CREATE TABLE leave_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID NOT NULL REFERENCES employees(id),
  type         leave_type NOT NULL,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  reason       TEXT,
  status       apology_status DEFAULT 'PENDING',
  reviewed_by  UUID REFERENCES users(id),
  created_at   TIMESTAMP DEFAULT NOW()
);

-- Payrolls
CREATE TABLE payrolls (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES employees(id),
  month           INT NOT NULL,
  year            INT NOT NULL,
  base_salary     BIGINT NOT NULL,
  standard_days   INT NOT NULL,
  actual_days     DECIMAL(5,2) NOT NULL,
  ot_hours        DECIMAL(6,2) DEFAULT 0,
  ot_amount       BIGINT DEFAULT 0,
  allowance       BIGINT DEFAULT 0,
  gross_salary    BIGINT NOT NULL,
  bhxh            BIGINT NOT NULL,
  bhyt            BIGINT NOT NULL,
  bhtn            BIGINT NOT NULL,
  taxable_income  BIGINT NOT NULL,
  income_tax      BIGINT NOT NULL,
  net_salary      BIGINT NOT NULL,
  note            TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE (employee_id, month, year)
);
