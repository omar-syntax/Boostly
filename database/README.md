# Database Migrations

This directory contains all database migrations for extending the existing database with Projects, Goals, Tasks, and Subtasks functionality.

## Migration Files

### 001_add_projects_table.sql
- Creates the `projects` table
- Links to existing `auth.users` table via `user_id`
- Includes all project metadata (title, description, category, priority, dates, etc.)
- Sets up indexes for performance

### 002_add_goals_table.sql
- Creates the `goals` table
- Foreign key relationship to `projects` table
- Basic goal structure with text and completion status

### 003_add_project_tasks_and_subtasks_table.sql
- Creates the `project_tasks` table with hierarchical support
- `parent_task_id` enables subtask relationships
- Includes priority and due_time fields for enhanced task management
- Sets up automatic task completion logic based on subtasks

### 004_add_project_progress_tracking.sql
- Adds database functions for automatic progress calculation
- Triggers update project progress when goals/tasks change
- Smart completion logic (tasks complete when all subtasks are done)
- Safely handles existing triggers with DROP IF EXISTS
- Fixes column ambiguity with proper variable naming

### 005_add_rls_policies_for_project_tables.sql
- Enables Row Level Security (RLS) on all new tables
- Creates policies ensuring users can only access their own data
- Proper authorization for all CRUD operations
- Safely handles existing policies with DROP IF EXISTS

## Running Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Run migrations in order (001-005)
4. Verify tables were created successfully

## Database Schema

### Projects Table
```sql
projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  start_date DATE DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  progress INTEGER DEFAULT 0,
  collaborators INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  color TEXT DEFAULT 'bg-primary',
  icon TEXT DEFAULT 'Target',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

### Goals Table
```sql
goals (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

### Project Tasks Table
```sql
project_tasks (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  due_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

## Key Features

### Security
- **Row Level Security**: Users can only access their own projects, goals, and tasks
- **Foreign Key Constraints**: Maintains referential integrity
- **Cascading Deletes**: Clean cleanup when parent records are deleted

### Automation
- **Progress Calculation**: Automatically updates project progress
- **Task Completion**: Tasks auto-complete when all subtasks are done
- **Timestamp Management**: Automatic updated_at tracking

### Performance
- **Optimized Indexes**: Fast queries for common operations
- **Hierarchical Queries**: Efficient subtask retrieval
- **Real-time Support**: Ready for Supabase subscriptions

## Data Integrity

1. **Referential Integrity**: All relationships properly constrained
2. **Cascading Operations**: Clean deletion handling
3. **Atomic Updates**: Progress calculations are consistent
4. **User Isolation**: Complete data separation between users

## Backward Compatibility

- Extends existing database without breaking changes
- Maintains compatibility with existing auth system
- No modifications to existing tables
- Safe rollback capability if needed
