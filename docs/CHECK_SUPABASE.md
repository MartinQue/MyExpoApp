# Checking Your Supabase Setup

Let's verify if your Supabase database is set up correctly!

## Step 1: Open Supabase Dashboard

1. Go to: **https://supabase.com/dashboard**
2. Sign in
3. Click on your **Happiness** project (or whatever you named it)

---

## Step 2: Check If Tables Exist

1. In the left sidebar, click **Table Editor**
2. **Do you see these tables?**
   - ☐ `profiles`
   - ☐ `notes`
   - ☐ `note_embeddings`
   - ☐ `planner_tasks`
   - ☐ `media`

### If YES ✅
Great! Your initial migration ran successfully.

**Now check for Phase 1 columns:**
1. Click on the `profiles` table
2. Look at the columns - do you see:
   - ☐ `has_ai_consent`
   - ☐ `location_preferences`
   - ☐ `first_name`

### If YES to Phase 1 columns ✅
Perfect! You're fully set up. Skip to **Step 4**.

### If NO ❌ (Tables don't exist)
You need to run the migrations. Go to **Step 3**.

---

## Step 3: Run Migrations (If Needed)

### A. Run Initial Migration

1. In the left sidebar, click **SQL Editor**
2. Click **New Query**
3. Open the file: `docs/supabase.sql` in VS Code
4. Copy **ALL** the content (Cmd + A, Cmd + C)
5. Paste it into the SQL Editor in Supabase
6. Click **Run** (or press Cmd + Enter)
7. Wait for "Success. No rows returned"

### B. Run Phase 1 Updates

1. In SQL Editor, click **New Query** again
2. Open the file: `docs/supabase_phase1_update.sql` in VS Code
3. Copy **ALL** the content
4. Paste it into the SQL Editor
5. Click **Run**
6. Wait for "Success" message

**Notes:**
- If you see "already exists" errors, that's OK! It means some parts were already created.
- The migrations are safe to run multiple times.

---

## Step 4: Check Storage Bucket

1. In the left sidebar, click **Storage**
2. **Do you see a bucket named `media`?**

### If YES ✅
Perfect! You're done.

### If NO ❌
Create it:
1. Click **New bucket**
2. Name: `media`
3. Public bucket: **Yes**
4. Click **Create bucket**

---

## Step 5: Test Connection from App

Let's make sure the app can connect to Supabase:

1. **On your iPhone**, reload the app
2. Go to the **Profile** tab
3. Scroll down to "Account & labs"
4. Tap **"Run Supabase storage check"**

**What should happen:**
- You'll see "Uploading sample asset..."
- After a few seconds: "Upload Successful!" with a URL
- This confirms Supabase storage is working!

**If it fails:**
- Check your `.env` file has the correct Supabase URL and key
- Make sure the `media` bucket exists
- Check that the bucket is set to public

---

## Quick Summary Checklist

Run through this checklist:

### Database Tables
- ☐ `profiles` table exists
- ☐ `notes` table exists
- ☐ `planner_tasks` table exists
- ☐ `media` table exists
- ☐ `mood_logs` table exists (Phase 1)
- ☐ `agent_logs` table exists (Phase 1)

### Storage
- ☐ `media` bucket exists
- ☐ Bucket is set to public

### App Connection
- ☐ "Run Supabase storage check" button works
- ☐ Upload succeeds

---

## If Everything Works ✅

Congratulations! Your Supabase is fully set up. You can now:
- Store real user data
- Upload media files
- Use authentication (when you turn off TESTING_MODE)
- Track mood and agent logs

---

## If Something Doesn't Work ❌

**Common issues:**

1. **"relation does not exist"**
   - The table wasn't created
   - Run the migration SQL again

2. **"permission denied"**
   - You're not logged into the right Supabase account
   - Check you're in the Happiness project

3. **"bucket not found"**
   - Create the `media` bucket in Storage section

4. **Upload test fails**
   - Check your `.env` file has correct Supabase credentials
   - Restart Expo server after changing `.env`

---

**Need help?** Let me know which step you're stuck on!
