-- Vector similarity search function for RAG memory retrieval
-- Run this in Supabase SQL Editor to enable semantic search

-- Create the vector similarity search function
create or replace function match_notes(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_user_id uuid
)
returns table (
  id uuid,
  content text,
  created_at timestamp,
  sentiment text,
  topic text,
  similarity float
)
language sql stable
as $$
  select
    notes.id,
    notes.content,
    notes.created_at,
    notes.sentiment,
    notes.topic,
    1 - (note_embeddings.embedding <=> query_embedding) as similarity
  from notes
  join note_embeddings on notes.id = note_embeddings.note_id
  where notes.user_id = filter_user_id
    and 1 - (note_embeddings.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
