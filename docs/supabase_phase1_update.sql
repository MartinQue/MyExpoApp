-- Phase 1 Updates: Add AI-specific columns
-- Run this AFTER the initial supabase.sql migration

-- Add AI consent and privacy fields to profiles
alter table profiles add column if not exists has_ai_consent boolean default false;
alter table profiles add column if not exists location_preferences jsonb default '{}';
alter table profiles add column if not exists energy_baseline text;
alter table profiles add column if not exists last_privacy_mode text;
alter table profiles add column if not exists first_name text;
alter table profiles add column if not exists last_name text;

-- Add AI analysis fields to notes
alter table notes add column if not exists summary text;
alter table notes add column if not exists next_step text;
alter table notes add column if not exists risk text check (risk in ('low', 'medium', 'high'));
alter table notes add column if not exists flagged boolean default false;
alter table notes add column if not exists sentiment text;
alter table notes add column if not exists media_ids uuid[];

-- Update planner_tasks with agent-specific fields
alter table planner_tasks add column if not exists status text check (status in ('pending', 'in_progress', 'completed', 'cancelled')) default 'pending';
alter table planner_tasks add column if not exists priority text check (priority in ('low', 'medium', 'high')) default 'medium';
alter table planner_tasks add column if not exists source_agent text;
alter table planner_tasks add column if not exists linked_media uuid[];

-- Add media caption and embedding fields
alter table media add column if not exists caption text;
alter table media add column if not exists tags text[];
alter table media add column if not exists created_at timestamp default now();

-- Create mood_logs table
create table if not exists mood_logs(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  note_id uuid references notes(id) on delete set null,
  mood text,
  energy_level int check (energy_level between 1 and 10),
  recorded_at timestamp default now()
);

-- Create agent_logs table for observability
create table if not exists agent_logs(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  agent_name text not null,
  tool_name text,
  input_data jsonb,
  output_data jsonb,
  latency_ms int,
  error text,
  created_at timestamp default now()
);

-- Enable RLS on new tables
alter table mood_logs enable row level security;
alter table agent_logs enable row level security;

-- Create RLS policies for new tables
create policy "user owns mood logs" on mood_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user owns agent logs" on agent_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Create indexes for new columns
create index if not exists notes_risk_idx on notes(risk);
create index if not exists notes_flagged_idx on notes(flagged);
create index if not exists planner_tasks_status_idx on planner_tasks(status);
create index if not exists planner_tasks_priority_idx on planner_tasks(priority);
create index if not exists mood_logs_user_id_idx on mood_logs(user_id);
create index if not exists mood_logs_recorded_at_idx on mood_logs(recorded_at desc);
create index if not exists agent_logs_user_id_idx on agent_logs(user_id);
create index if not exists agent_logs_created_at_idx on agent_logs(created_at desc);
create index if not exists media_created_at_idx on media(created_at desc);

-- Create storage bucket for media if it doesn't exist
-- Run this in the Supabase Dashboard -> Storage section manually
-- Bucket name: media
-- Public: true (for now, can restrict later)
