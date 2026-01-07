-- Add parent_id column to tasks table to support subtasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- Add index for performance on recursive lookups
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
