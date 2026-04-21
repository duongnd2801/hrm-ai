-- V37__add_pm_details.sql
ALTER TABLE project_members ADD COLUMN contribution_percentage INT DEFAULT 0;
COMMENT ON COLUMN project_members.contribution_percentage IS 'Percentage of employee participation in this project (0-100)';
