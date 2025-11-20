-- Enable the vector extension for embeddings
create extension if not exists vector;

-- Create tables
create table if not exists notes(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text check (kind in ('text','audio','video','photo')) not null,
  content text,
  media_url text,
  summary text,
  next_step text,
  sentiment text,
  sensitivity text check (sensitivity in ('private','personal','shared')) default 'personal',
  topic text,
  subtopic text,
  created_at timestamp default now()
);

create table if not exists note_embeddings(
  note_id uuid references notes(id) on delete cascade,
  embedding vector(1536),
  primary key (note_id)
);

create table if not exists profiles(
  user_id uuid primary key,
  trial_started_at timestamp default now(),
  trial_days int default 14
);

create table if not exists planner_tasks(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  note_id uuid references notes(id) on delete cascade,
  "when" timestamp not null,
  why text,
  youtube_url text
);

create table if not exists media(
  id uuid primary key default gen_random_uuid(),
  note_id uuid references notes(id) on delete cascade,
  type text check (type in ('photo','video')),
  media_url text,
  exif_json jsonb
);

-- Enable Row Level Security (RLS)
alter table notes enable row level security;
alter table note_embeddings enable row level security;
alter table profiles enable row level security;
alter table planner_tasks enable row level security;
alter table media enable row level security;

-- Create RLS policies
create policy "user owns notes" on notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user owns embeds" on note_embeddings
  for all using (exists(select 1 from notes n where n.id = note_id and n.user_id = auth.uid()))
  with check (exists(select 1 from notes n where n.id = note_id and n.user_id = auth.uid()));

create policy "user owns profile" on profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user owns tasks" on planner_tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user owns media" on media
  for all using (exists(select 1 from notes n where n.id = note_id and n.user_id = auth.uid()))
  with check (exists(select 1 from notes n where n.id = note_id and n.user_id = auth.uid()));

-- Create indexes for better performance
create index if not exists notes_user_id_idx on notes(user_id);
create index if not exists notes_created_at_idx on notes(created_at desc);
create index if not exists notes_kind_idx on notes(kind);
create index if not exists notes_sensitivity_idx on notes(sensitivity);
create index if not exists planner_tasks_user_id_idx on planner_tasks(user_id);
create index if not exists planner_tasks_when_idx on planner_tasks("when");
create index if not exists media_note_id_idx on media(note_id);

-- Helper RPC for semantic memory search (requires pgvector extension)
create or replace function public.match_notes(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_user_id uuid
)
returns table (
  id uuid,
  content text,
  sentiment text,
  topic text,
  created_at timestamp,
  similarity float
) language plpgsql as $$
begin
  return query
  select
    n.id,
    n.content,
    n.sentiment,
    n.topic,
    n.created_at,
    1 - (embedding <=> query_embedding) as similarity
  from note_embeddings e
    join notes n on n.id = e.note_id
  where n.user_id = filter_user_id
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;

-- Create a function to automatically create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, trial_started_at, trial_days)
  values (new.id, now(), 14);
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically create profile for new users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
