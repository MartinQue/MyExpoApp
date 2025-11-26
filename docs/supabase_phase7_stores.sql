-- Phase 7: Store persistence tables
-- Run this AFTER supabase_phase1_update.sql

-- ========================================
-- Conversations & Messages (Chat Store)
-- ========================================
create table if not exists conversations(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text default 'New Chat',
  last_message_preview text,
  active_agent text default 'alter_ego',
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table if not exists messages(
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  user_id uuid not null,
  role text check (role in ('user', 'ai', 'system')) not null,
  content text not null,
  agent_name text,
  media_url text,
  media_type text check (media_type in ('image', 'audio', 'video', 'file')),
  created_at timestamp default now()
);

-- ========================================
-- Plans & Milestones (Planner Store)
-- ========================================
create table if not exists plans(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text,
  progress int default 0 check (progress between 0 and 100),
  next_task text,
  due_date timestamp,
  motivation_quote text,
  theme_color text,
  status text check (status in ('active', 'completed', 'archived')) default 'active',
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table if not exists milestones(
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans(id) on delete cascade,
  title text not null,
  status text check (status in ('completed', 'in-progress', 'upcoming')) default 'upcoming',
  position int default 0,
  created_at timestamp default now()
);

-- ========================================
-- Library Items (Library Store)
-- ========================================
create table if not exists library_items(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  category text check (category in ('personal', 'notes')) not null,
  type text check (type in ('image', 'video', 'voice-memo', 'meeting')) not null,
  title text not null,
  url text,
  thumbnail text,
  duration text,
  summary text,
  transcript text,
  action_items jsonb default '[]',
  participants jsonb default '[]',
  tags jsonb default '[]',
  created_at timestamp default now()
);

-- ========================================
-- Generated Images (Imagine Store)
-- ========================================
create table if not exists generated_images(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  prompt text not null,
  enhanced_prompt text,
  image_url text not null,
  style text,
  aspect_ratio text,
  credits_used int default 1,
  favorited boolean default false,
  created_at timestamp default now()
);

-- ========================================
-- User Preferences (User Store)
-- ========================================
create table if not exists user_preferences(
  user_id uuid primary key,
  display_name text,
  avatar_url text,
  theme text check (theme in ('light', 'dark', 'system')) default 'dark',
  mood text,
  credits int default 10,
  is_pro boolean default false,
  notification_enabled boolean default true,
  haptic_enabled boolean default true,
  voice_enabled boolean default true,
  updated_at timestamp default now()
);

-- ========================================
-- Enable RLS on all new tables
-- ========================================
alter table conversations enable row level security;
alter table messages enable row level security;
alter table plans enable row level security;
alter table milestones enable row level security;
alter table library_items enable row level security;
alter table generated_images enable row level security;
alter table user_preferences enable row level security;

-- ========================================
-- RLS Policies
-- ========================================
create policy "user owns conversations" on conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user owns messages" on messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user owns plans" on plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user owns milestones" on milestones
  for all using (exists(select 1 from plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (exists(select 1 from plans p where p.id = plan_id and p.user_id = auth.uid()));

create policy "user owns library items" on library_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user owns generated images" on generated_images
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user owns preferences" on user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ========================================
-- Indexes for performance
-- ========================================
create index if not exists conversations_user_id_idx on conversations(user_id);
create index if not exists conversations_updated_at_idx on conversations(updated_at desc);
create index if not exists messages_conversation_id_idx on messages(conversation_id);
create index if not exists messages_created_at_idx on messages(created_at);
create index if not exists plans_user_id_idx on plans(user_id);
create index if not exists plans_status_idx on plans(status);
create index if not exists milestones_plan_id_idx on milestones(plan_id);
create index if not exists library_items_user_id_idx on library_items(user_id);
create index if not exists library_items_category_idx on library_items(category);
create index if not exists library_items_type_idx on library_items(type);
create index if not exists generated_images_user_id_idx on generated_images(user_id);
create index if not exists generated_images_created_at_idx on generated_images(created_at desc);

-- ========================================
-- Trigger to update updated_at timestamps
-- ========================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_conversations_updated_at
  before update on conversations
  for each row execute procedure update_updated_at_column();

create trigger update_plans_updated_at
  before update on plans
  for each row execute procedure update_updated_at_column();

create trigger update_user_preferences_updated_at
  before update on user_preferences
  for each row execute procedure update_updated_at_column();

-- ========================================
-- Function to create default user preferences on signup
-- ========================================
create or replace function public.handle_new_user_preferences()
returns trigger as $$
begin
  insert into public.user_preferences (user_id, display_name, credits, theme)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'User'), 10, 'dark')
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Update the existing trigger or create new one
drop trigger if exists on_auth_user_created_preferences on auth.users;
create trigger on_auth_user_created_preferences
  after insert on auth.users
  for each row execute procedure public.handle_new_user_preferences();