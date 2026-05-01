-- Fix trigger deadlock issue by changing from BEFORE to AFTER UPDATE
-- This prevents the trigger from trying to INSERT while the task row is still locked

-- Drop the existing trigger
DROP TRIGGER IF EXISTS log_task_status_change_trigger ON tasks;

-- Recreate the function with slight modifications for AFTER trigger
CREATE OR REPLACE FUNCTION log_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO task_activities (task_id, user_id, activity_type, old_value, new_value)
        VALUES (NEW.id, NEW.user_id, 'status_change', OLD.status::text, NEW.status::text);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for task status changes (AFTER UPDATE instead of BEFORE)
CREATE TRIGGER log_task_status_change_trigger
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_task_status_change();

-- Also update the completed_at field update to a separate trigger
CREATE OR REPLACE FUNCTION update_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'complete' AND OLD.status != 'complete' THEN
        NEW.completed_at = timezone('utc'::text, now());
    ELSIF NEW.status != 'complete' AND OLD.status = 'complete' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_completed_at_trigger
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_completed_at();

-- Add composite index for the common query pattern (user_id + created_at DESC)
-- This optimizes: SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_tasks_user_id_created_at ON tasks(user_id, created_at DESC);
