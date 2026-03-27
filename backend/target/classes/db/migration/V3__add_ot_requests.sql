-- V3__add_ot_requests.sql

CREATE TYPE ot_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE ot_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID NOT NULL REFERENCES employees(id),
  date         DATE NOT NULL,
  hours        DECIMAL(4,2) NOT NULL,
  reason       TEXT,
  status       ot_status DEFAULT 'PENDING',
  reviewed_by  UUID REFERENCES users(id),
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);
