-- Create focus_sessions table
create table if not exists focus_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  duration integer not null, -- in minutes
  completed boolean default false,
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  tree_type text, -- 'sapling', 'tree', 'large_tree'
  points_earned integer default 0,
  created_at timestamp with time zone default now()
);

-- Add RLS policies
alter table focus_sessions enable row level security;

-- Policy for viewing own sessions
create policy "Users can view own sessions"
  on focus_sessions for select
  using (auth.uid() = user_id);

-- Policy for inserting own sessions
create policy "Users can insert own sessions"
  on focus_sessions for insert
  with check (auth.uid() = user_id);

-- Add simple index for performance
create index if not exists idx_focus_sessions_user_id on focus_sessions(user_id);
