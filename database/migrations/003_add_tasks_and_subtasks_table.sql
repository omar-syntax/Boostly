-- Migration: add_project_tasks_and_subtasks_table
-- Description: Creates the project_tasks table with hierarchical support for subtasks
-- Version: 003

CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  due_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_parent_task_id ON project_tasks(parent_task_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_project_tasks_updated_at_trigger
  BEFORE UPDATE ON project_tasks
  FOR EACH ROW EXECUTE FUNCTION update_project_tasks_updated_at();

-- Function to check if task should be marked as completed based on subtasks
CREATE OR REPLACE FUNCTION update_project_task_completion()
RETURNS TRIGGER AS $$
DECLARE
  has_subtasks BOOLEAN;
  all_subtasks_completed BOOLEAN;
BEGIN
  -- Check if task has subtasks
  SELECT EXISTS(SELECT 1 FROM project_tasks WHERE parent_task_id = NEW.id) INTO has_subtasks;
  
  IF has_subtasks THEN
    -- Check if all subtasks are completed
    SELECT BOOL_AND(completed) INTO all_subtasks_completed
    FROM project_tasks 
    WHERE parent_task_id = NEW.id;
    
    -- Update task completion based on subtasks
    IF all_subtasks_completed IS NULL THEN
      -- No subtasks exist, use task's own completion status
      RETURN NEW;
    ELSIF all_subtasks_completed THEN
      -- All subtasks completed, mark task as completed
      NEW.completed = TRUE;
    ELSE
      -- Some subtasks not completed, mark task as incomplete
      NEW.completed = FALSE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update task completion based on subtasks
CREATE TRIGGER update_project_task_completion_trigger
  AFTER INSERT OR UPDATE ON project_tasks
  FOR EACH ROW EXECUTE FUNCTION update_project_task_completion();
