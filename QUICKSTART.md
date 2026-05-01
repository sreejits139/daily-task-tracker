# Quick Start Guide

Get your Daily Task Tracker up and running in 10 minutes!

## Step 1: Create Supabase Project (3 minutes)

1. Go to https://supabase.com and sign in (or create a free account)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `daily-task-tracker`
   - **Database Password**: Create a strong password and **save it**
   - **Region**: Choose closest to you
   - **Plan**: Free
4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning

## Step 2: Set Up Database (2 minutes)

1. In your Supabase dashboard, click **"SQL Editor"** in the sidebar
2. Click **"New Query"**
3. Open the file: `supabase/migrations/001_initial_schema.sql`
4. Copy the **entire contents** (all 300+ lines)
5. Paste into the SQL editor
6. Click **"Run"** or press Cmd/Ctrl + Enter
7. You should see **"Success. No rows returned"** ✅

## Step 3: Get API Keys (1 minute)

1. In Supabase dashboard, go to **Settings** > **API**
2. Copy these two values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`

## Step 4: Configure Environment (1 minute)

1. In your project folder, create `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and paste your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-actual-key
   ```

3. Save the file

## Step 5: Configure Authentication (1 minute)

1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Click on **"Email"** provider
3. Scroll down and find **"Confirm email"** toggle
4. **Turn it OFF** (for development - skip email confirmation)
5. Click **"Save"**

> **Why disable email confirmation?**
> For local development, email confirmation adds friction. You can re-enable it when deploying to production.

## Step 6: Install Dependencies & Start (2 minutes)

1. Install all dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000 in your browser

## Step 7: Create Your Account (1 minute)

1. You'll be redirected to the login page
2. Click **"Sign up"**
3. Enter your email and password
4. Click **"Create account"**
5. You're in! 🎉

The dashboard will load and you're ready to start managing tasks!

## Next Steps

Now that you're set up, you can:

- **View statistics**: See your task overview at the top - total tasks, completed this week, overdue count, and status breakdown
- **Create projects**: Organize your tasks into custom projects with color coding
- **Manage projects**: Edit project names, change colors, or delete projects via the "Manage" button in the sidebar
- **Quick add tasks**: Use the inline "Quick add" field at the top - just type a task title and press Enter for instant task creation
- **Create detailed tasks**: Click the "New Task" button for the full dialog with all options
- **Bulk operations**: Select multiple tasks using checkboxes, then batch update status, assign to project, or delete
- **Duplicate tasks**: Click on any task to open details, then click "Duplicate Task" to create a copy
- **Set priorities**: Mark tasks as Low, Medium, High, or Urgent
- **Set due dates**: Get browser notifications 1 hour before tasks are due. Overdue tasks are highlighted in red with an alert icon
- **Customize notifications**: In Account Settings, choose when to be notified (15min, 30min, 1hr, or 1 day before due)
- **Track progress**: Update task status (Not Started, In Progress, Complete, Blocked, On Hold)
- **Add comments**: Click on any task to view details and add comments
- **View activity**: See automatic status change logging in the activity timeline
- **Filter & search**: Find tasks quickly with search, status filters, and project filters
- **Sort columns**: Click column headers to sort by title, status, priority, project, due date, or created time
- **Enable notifications**: Allow browser notifications to get reminders for upcoming and overdue tasks
- **Manage your profile**: Update display name and change password in Account Settings

## Troubleshooting

### "Your project's URL and Key are required"
- Check that `.env.local` exists in the project root
- Verify both environment variables are set correctly
- **Restart the dev server** after creating/editing `.env.local`
- Make sure there are no extra spaces in the values

### "Module not found: class-variance-authority"
- Run `npm install` to install all dependencies
- This package is required for shadcn/ui components

### "Migration failed"
- Ensure you copied the **entire** SQL file (all 300+ lines)
- Check for any red error messages in the SQL editor
- Verify you're in the correct Supabase project

### "Email not confirmed" error when logging in
- Make sure you **disabled email confirmation** in Step 5
- If you didn't, go to Authentication > Providers > Email and turn off "Confirm email"
- Delete your user and sign up again after disabling

### Database connection issues
- Verify your Supabase project is not paused (visit the dashboard to wake it)
- Check that the Project URL is correct in `.env.local`
- Ensure you're using the **anon key**, not the service_role key

### Port 3000 already in use
- Stop any other Next.js dev servers
- Or Next.js will automatically use port 3001

### Build errors with CSS
- The project uses Tailwind CSS v4 - ensure you're on the latest version
- If you see `@apply` errors, check that globals.css uses correct syntax

## Advanced Configuration

### URL Configuration (for email features)

If you want to enable email confirmation or magic links in production:

1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL** to your production URL (e.g., `https://your-app.vercel.app`)
3. Add to **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

For local development, these should be:
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

## Support

For more detailed information, see:
- [CLAUDE.md](./CLAUDE.md) - Complete project documentation and implementation guide
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Detailed Supabase setup guide
- [README.md](./README.md) - Project overview and features

---

**Time to completion**: ~10 minutes  
**Cost**: $0 (completely free)  
**Status**: ✅ All setup complete - ready to build!  
**Next milestone**: Start building your task management dashboard!

