-- Migration: add_sql_execution_function
-- Description: Creates a function to execute SQL migrations
-- Version: 006

-- Function to execute SQL (for migrations)
CREATE OR REPLACE FUNCTION exec_sql(sql_text TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to execute the function
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
