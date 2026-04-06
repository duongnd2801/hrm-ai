CREATE TYPE project_status AS ENUM ('ACTIVE', 'OVERDUE', 'COMPLETED', 'ON_HOLD');
CREATE TYPE project_type AS ENUM ('PRODUCT_DEVELOPMENT', 'OUTSOURCING', 'INTERNAL', 'MAINTENANCE');
CREATE TYPE project_role AS ENUM ('PM', 'DEV', 'QA', 'TESTER', 'BA', 'DESIGNER', 'COMTER', 'GUEST');

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(20) DEFAULT '#3b82f6',
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status project_status DEFAULT 'ACTIVE',
    type project_type DEFAULT 'PRODUCT_DEVELOPMENT',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    role project_role NOT NULL DEFAULT 'DEV',
    joined_at DATE DEFAULT CURRENT_DATE,
    left_at DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (project_id, employee_id)
);
