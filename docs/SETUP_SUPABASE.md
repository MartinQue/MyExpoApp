# Setting Up Supabase Database

## Overview
Your Supabase project is already connected! Now we need to set up the database tables and storage.

**Your Supabase Project:** https://dmhwtmoialgvwtzlebfo.supabase.co

---

## Step 1: Run Initial Database Migration

1. **Go to Supabase Dashboard:**
   - Open: https://supabase.com/dashboard
   - Click on your project: **Happiness**

2. **Open SQL Editor:**
   - In the left sidebar, click **SQL Editor**
   - Click **New Query**

3. **Copy the Initial Migration:**
   - Open the file: `docs/supabase.sql`
   - Copy ALL the content
   - Paste it into the SQL Editor

4. **Run the Migration:**
   - Click **Run** (or press `Cmd + Enter`)
   - You should see: "Success. No rows returned"

**What this creates:**
- ✅ Tables: `notes`, `profiles`, `planner_tasks`, `media`, `note_embeddings`
- ✅ Row Level Security (RLS) policies
- ✅ Automatic profile creation trigger
- ✅ Performance indexes

---

## Step 2: Run Phase 1 Updates

1. **In the same SQL Editor:**
   - Click **New Query** again

2. **Copy the Phase 1 Updates:**
   - Open the file: `docs/supabase_phase1_update.sql`
   - Copy ALL the content
   - Paste it into the SQL Editor

3. **Run the Update:**
   - Click **Run**
   - You should see: "Success. No rows returned"

**What this adds:**
- ✅ AI consent fields to profiles
- ✅ Summary and risk analysis to notes
- ✅ Mood tracking table
- ✅ Agent observability logs
- ✅ Enhanced media metadata

---

## Step 3: Create Storage Bucket

1. **Go to Storage:**
   - In the left sidebar, click **Storage**

2. **Create New Bucket:**
   - Click **New bucket**
   - Name: `media`
   - Public bucket: **Yes** (for now)
   - Click **Create bucket**

3. **Configure Bucket Policies:**
   - Click on the `media` bucket
   - Go to **Policies** tab
   - Click **New Policy**
   - Select **For full customization**
   - Copy this policy:

```sql
create policy "Users can upload their own media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can view their own media"
on storage.objects for select
to authenticated
using (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their own media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

4. **Click Review** → **Save Policy**

---

## Step 4: Verify Setup

1. **Check Tables:**
   - Go to **Table Editor** in the sidebar
   - You should see all these tables:
     - ✅ profiles
     - ✅ notes
     - ✅ note_embeddings
     - ✅ planner_tasks
     - ✅ media
     - ✅ mood_logs
     - ✅ agent_logs

2. **Check Storage:**
   - Go to **Storage**
   - You should see the `media` bucket

---

## Step 5: Test Authentication (Optional)

Since you're in **TESTING_MODE**, authentication is bypassed. But you can test it when ready:

1. **Enable Email Auth:**
   - Go to **Authentication** → **Providers**
   - Enable **Email** provider
   - (Already done based on your config)

2. **Test Login:**
   - Change `TESTING_MODE = false` in `app/_layout.js`
   - Restart Expo
   - Try sending a magic link to your email
   - Check email and click link
   - Should auto-login and redirect to tabs

---

## Troubleshooting

### "relation already exists"
- This is fine! It means the table was already created
- Just continue with the migration

### "permission denied"
- Make sure you're logged into Supabase
- Check that you're in the correct project

### "syntax error"
- Make sure you copied the ENTIRE migration file
- Check for any missing semicolons

---

## What's Next?

After completing these steps:
- ✅ Database is ready for real data
- ✅ Storage is ready for media uploads
- ✅ Authentication will work when enabled
- 🎯 Ready to wire up the app to use real Supabase data!

---

## Related Files
- Initial migration: `docs/supabase.sql`
- Phase 1 updates: `docs/supabase_phase1_update.sql`
- Supabase client code: `lib/supabase.ts`
- Database TypeScript types: `lib/supabase.ts` (Database interface)
