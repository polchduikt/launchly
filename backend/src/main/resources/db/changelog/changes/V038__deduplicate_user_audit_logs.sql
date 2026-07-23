DELETE FROM user_audit_logs
WHERE id NOT IN (
    SELECT MIN(id)
    FROM user_audit_logs
    GROUP BY user_id, COALESCE(action_type, 'NONE'), COALESCE(target_id, 0), title, category
);
