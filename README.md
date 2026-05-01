# Daily Task Tracker

A modern, full-featured task management application built with Next.js 16 and Supabase. Track your tasks with projects, get browser notifications, add comments, set priorities, and manage your work efficiently - all completely free!

## Features

✅ **Task Management**
- Create, edit, and delete tasks
- Quick task entry (type title and press Enter for rapid task creation)
- Duplicate tasks with one click (resets status, clears due date)
- Bulk operations (select multiple tasks with checkboxes for batch actions)
- Batch update status, assign to project, or delete multiple tasks
- Set status (Not Started, In Progress, Complete, Blocked, On Hold)
- Set priority levels (Low, Medium, High, Urgent)
- Add due dates with timezone support
- Rich descriptions
- Assign tasks to projects

✅ **Project Organization**
- Create custom projects with color coding
- Edit project names and colors
- Delete projects (tasks become unassigned)
- Filter tasks by project
- Visual project indicators throughout the app
- Real-time project updates

✅ **Smart Notifications**
- Browser notifications for upcoming tasks (customizable: 15min, 30min, 1hr, or 1 day before due)
- Overdue task alerts
- Smart notification cooldowns (no spam)
- Clickable notifications to open tasks
- User-configurable notification timing preferences

✅ **Activity Tracking**
- Comment on tasks
- Automatic activity logging for status changes
- Complete history timeline
- Formatted timestamps

✅ **User Experience**
- Show/hide completed tasks
- Search tasks by title and description
- Filter by status
- Sortable columns (click headers to sort by title, status, priority, project, due date, or created time)
- Real-time updates across all views
- Clean, modern UI
- Configurable column visibility
- Visual overdue task highlighting (red background and alert icon)
- Task statistics dashboard (total tasks, completed this week, overdue, status breakdown)

✅ **Authentication & Profile**
- Email/password sign-in
- Magic link authentication
- Secure session management
- User profile management (display name, password change)
- Profile avatar with initials
- Cross-browser compatible (Chrome, Safari, Firefox, Edge)

## Tech Stack

- **Frontend**: Next.js 16.2.4 (React 19.2.4), Tailwind CSS v4, Shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Notifications**: Web Notifications API
- **Date Handling**: date-fns
- **Hosting**: Vercel (frontend) + Supabase (backend)
- **Cost**: 100% Free on free tiers

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free at [supabase.com](https://supabase.com))
- A Vercel account (optional, for deployment)

### 1. Install Dependencies

Dependencies are already installed, but if needed:

```bash
npm install
```

### 2. Set Up Supabase

Follow the detailed instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md):

1. Create a Supabase project
2. Run the database migration (copy `supabase/migrations/001_initial_schema.sql` into SQL Editor)
3. Get your API keys from Settings > API
4. Enable email authentication

### 3. Configure Environment Variables

Create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Create an Account

1. Click "Sign up" on the login page
2. Enter your email and password
3. Start managing your tasks!

## Project Structure

```
daily-task-tracker/
├── app/
│   ├── login/           # Login page
│   ├── signup/          # Signup page
│   ├── dashboard/       # Main dashboard
│   └── auth/callback/   # Auth callback route
├── components/
│   ├── dashboard/       # Dashboard components
│   │   ├── nav.tsx                    # Sidebar navigation with projects
│   │   ├── task-list.tsx              # Task list view with filtering
│   │   ├── task-dialog.tsx            # Create task dialog
│   │   ├── task-detail-panel.tsx      # Task detail panel with activities
│   │   ├── project-dialog.tsx         # Create project dialog
│   │   ├── manage-projects-dialog.tsx # Edit/delete projects dialog
│   │   ├── user-profile-dialog.tsx    # User profile & account settings
│   │   └── notification-banner.tsx    # Notification permission banner
│   └── ui/              # Shadcn UI components
├── lib/
│   ├── supabase/        # Supabase clients
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server client
│   │   └── middleware.ts      # Auth middleware
│   ├── notifications.ts      # Notification service
│   ├── database.types.ts     # TypeScript types
│   └── utils.ts              # Utility functions
├── supabase/
│   └── migrations/      # Database migrations
└── proxy.ts             # Next.js 16 proxy (renamed from middleware.ts)
```

## Database Schema

The app uses the following tables:

- **projects**: ✅ Organize tasks into projects with color coding
- **tasks**: Main task data (title, description, status, priority, dates, project assignment)
- **task_activities**: Activity timeline (comments, status changes, timestamps)
- **reminders**: Task reminders (table exists, future feature)

Row-level security (RLS) ensures users can only access their own data.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "Import Project" and select your repository
4. Add your environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click "Deploy"

Your app will be live at `https://your-app.vercel.app`!

### Important Notes

- **Supabase Free Tier**: Projects auto-pause after 7 days of inactivity. Just visit the dashboard to wake it up.
- **Environment Variables**: Never commit `.env.local` to git
- **Database Backups**: Free tier doesn't include automatic backups

## Roadmap

### ✅ Completed (Phase 1-2)
- [x] Task CRUD operations
- [x] Quick task entry with Enter key
- [x] Task duplication/cloning
- [x] Bulk operations (multi-select with checkboxes)
- [x] Batch status update, project assignment, and deletion
- [x] Status and priority management
- [x] Activity timeline and comments
- [x] Automatic status change logging
- [x] Show/hide completed tasks
- [x] Search and filter functionality
- [x] Sortable columns with visual indicators
- [x] Project organization with color coding
- [x] Browser notifications for upcoming & overdue tasks
- [x] Customizable notification timing (15min, 30min, 1hr, 1 day before)
- [x] Real-time updates across all views
- [x] Configurable column visibility
- [x] Due date management with timezone support
- [x] User profile and account management
- [x] Visual overdue task highlighting
- [x] Task statistics dashboard

### 🚧 In Progress (Phase 3)
- [ ] Loading states refinement
- [ ] Error boundaries
- [ ] Empty states improvements
- [ ] Mobile responsive design enhancements
- [ ] Keyboard shortcuts

### 📋 Future Enhancements (Phase 4)
- [ ] Email reminders
- [ ] Recurring tasks
- [ ] Tags and labels
- [ ] File attachments
- [ ] Dark mode
- [ ] Export tasks (CSV/JSON)
- [ ] Drag-and-drop task reordering
- [ ] Task assignment (multi-user collaboration)
- [ ] Mobile app (React Native)

## Contributing

This is a personal project, but feel free to fork and customize it for your own use!

## License

MIT License - feel free to use this for personal or commercial projects.

## Support

If you encounter issues:

1. Check [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for setup troubleshooting
2. Verify your environment variables are correct
3. Check the browser console for errors
4. Ensure your Supabase project is not paused

## Screenshots

### Login Page
Clean authentication with email/password and magic link options.

### Task Dashboard
View all your tasks with status badges, priorities, and search functionality.

### Task Detail Panel
Edit tasks, add comments, and view complete activity history.

---

Built with ❤️ using Next.js and Supabase
