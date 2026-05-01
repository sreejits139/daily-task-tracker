-- Create a function to efficiently get tasks with their last comment
-- This uses a LATERAL join to fetch only the most recent comment per task in a single query

CREATE OR REPLACE FUNCTION get_tasks_with_last_comment(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    project_id UUID,
    title TEXT,
    description TEXT,
    status task_status,
    priority task_priority,
    due_date TIMESTAMPTZ,
    reminder_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_comment_id UUID,
    last_comment_content TEXT,
    last_comment_created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id AS id,
        t.user_id AS user_id,
        t.project_id AS project_id,
        t.title AS title,
        t.description AS description,
        t.status AS status,
        t.priority AS priority,
        t.due_date AS due_date,
        t.reminder_date AS reminder_date,
        t.completed_at AS completed_at,
        t.created_at AS created_at,
        t.updated_at AS updated_at,
        lc.id AS last_comment_id,
        lc.content AS last_comment_content,
        lc.created_at AS last_comment_created_at
    FROM tasks t
    LEFT JOIN LATERAL (
        SELECT ta.id, ta.content, ta.created_at
        FROM task_activities ta
        WHERE ta.task_id = t.id
        AND ta.activity_type = 'comment'
        ORDER BY ta.created_at DESC
        LIMIT 1
    ) lc ON true
    WHERE t.user_id = p_user_id
    ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_tasks_with_last_comment(UUID) TO authenticated;
