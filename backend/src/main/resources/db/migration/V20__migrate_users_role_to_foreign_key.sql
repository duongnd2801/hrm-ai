-- V20__migrate_users_role_to_foreign_key.sql
-- Migrate users.role (ENUM) to users.role_id (FK to roles table)

DO $$ 
BEGIN
  -- Only add role_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE users ADD COLUMN role_id UUID;
    
    -- Migrate data from role ENUM to role_id FK
    UPDATE users u 
    SET role_id = r.id 
    FROM roles r 
    WHERE r.name = u.role::text;
    
    -- Make role_id NOT NULL
    ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;
    
    -- Add foreign key constraint
    ALTER TABLE users ADD CONSTRAINT fk_users_role_id 
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT;
    
    -- Drop the old role column
    ALTER TABLE users DROP COLUMN role;
    
    -- Create index for performance
    CREATE INDEX idx_users_role_id ON users(role_id);
  END IF;
END $$;
