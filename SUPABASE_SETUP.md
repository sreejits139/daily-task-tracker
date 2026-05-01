# Daily Task Tracker - Supabase Setup Guide

## Prerequisites
- A Supabase account (free tier is sufficient)

## Setup Steps

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create a free account
3. Click "New Project"
4. Fill in:
   - **Name**: daily-task-tracker (or your preferred name)
   - **Database Password**: Create a strong password (save it somewhere safe)
   - **Region**: Choose the region closest to you
   - **Pricing Plan**: Free
5. Click "Create new project"
6. Wait 2-3 minutes for the project to be provisioned

### 2. Run Database Migrations

1. In your Supabase dashboard, click on **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned" - this means the schema was created successfully

### 3. Enable Email Authentication

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Find **Email** provider and ensure it's enabled
3. (Optional) Configure email templates under **Authentication** > **Email Templates**

### 4. Get Your API Keys

1. Go to **Settings** > **API** in your Supabase dashboard
2. You'll see two important values:
   - **Project URL**: Something like `https://xxxxx.supabase.co`
   - **anon public key**: A long string starting with `eyJ...`
3. Copy these values

### 5. Configure Environment Variables

1. In your project root, create a file named `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and replace the placeholder values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-actual-key
   ```

3. Save the file

### 6. Verify Setup

Run your development server:
```bash
npm run dev
```

The application should start without errors. You're now ready to build the authentication and task management features!

## Important Notes

- **Free Tier Auto-Pause**: Your Supabase project will auto-pause after 7 days of inactivity. Just visit the dashboard to wake it up.
- **Never Commit .env.local**: This file contains sensitive keys and is already in `.gitignore`
- **Database Backups**: Free tier doesn't include automatic backups. For important data, consider upgrading or manually exporting.

## Troubleshooting

### Migration Fails
- Ensure you copied the entire SQL file contents
- Check the error message in the SQL editor
- You can drop all tables and re-run if needed:
  ```sql
  DROP TABLE IF EXISTS reminders, task_activities, tasks, projects CASCADE;
  DROP TYPE IF EXISTS task_status, task_priority, activity_type CASCADE;
  ```

### Authentication Issues
- Verify your environment variables are correct
- Check that email provider is enabled in Supabase dashboard
- Clear browser cookies and try again

### Connection Errors
- Ensure your Supabase project is not paused
- Verify the project URL in `.env.local` matches your dashboard
- Check that the anon key is copied completely
