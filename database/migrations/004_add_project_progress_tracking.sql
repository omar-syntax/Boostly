-- Migration: add_project_progress_tracking
-- Description: Adds functions and triggers for automatic progress calculation
-- Version: 004

-- Function to calculate project progress
CREATE OR REPLACE FUNCTION calculate_project_progress(project_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_items INTEGER;
  completed_items INTEGER;
  calculated_progress INTEGER;
BEGIN
  -- Count total goals and project_tasks (excluding subtasks)
  SELECT COUNT(*) INTO total_items
  FROM (
    SELECT id FROM goals WHERE project_id = project_uuid
    UNION ALL
    SELECT id FROM project_tasks WHERE project_id = project_uuid AND parent_task_id IS NULL
  ) combined;
  
  -- Count completed goals and project_tasks (excluding subtasks)
  SELECT COUNT(*) INTO completed_items
  FROM (
    SELECT id FROM goals WHERE project_id = project_uuid AND completed = TRUE
    UNION ALL
    SELECT id FROM project_tasks WHERE project_id = project_uuid AND parent_task_id IS NULL AND completed = TRUE
  ) combined;
  
  -- Calculate progress
  IF total_items = 0 THEN
    calculated_progress := 0;
  ELSE
    calculated_progress := ROUND((completed_items::FLOAT / total_items::FLOAT) * 100);
  END IF;
  
  -- Update project progress
  UPDATE projects 
  SET progress = calculated_progress 
  WHERE id = project_uuid;
  
  RETURN calculated_progress;
END;
$$ LANGUAGE plpgsql;

-- Function to update project progress when goals or project_tasks change
CREATE OR REPLACE FUNCTION update_project_progress_trigger()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_project_progress(NEW.project_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update project progress (only create if they don't exist)
DROP TRIGGER IF EXISTS update_project_progress_on_goal_change ON goals;
CREATE TRIGGER update_project_progress_on_goal_change
  AFTER INSERT OR UPDATE OR DELETE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_project_progress_trigger();

DROP TRIGGER IF EXISTS update_project_progress_on_project_task_change ON project_tasks;
CREATE TRIGGER update_project_progress_on_project_task_change
  AFTER INSERT OR UPDATE OR DELETE ON project_tasks
  FOR EACH ROW EXECUTE FUNCTION update_project_progress_trigger();
