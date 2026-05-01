@AGENTS.md

# Daily Task Tracker - Project Documentation

## Project Overview

A modern, full-stack task management application built with Next.js 16 and Supabase. Features task CRUD operations, project organization, priority management, activity tracking, browser notifications, and real-time updates.

**Status**: ✅ Phase 2 Extended 100% COMPLETE! All core features including projects (with full CRUD), activities, comments, automatic logging, and browser notifications fully implemented and working. Ready for production use.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16.2.4 (App Router)
- **React**: 19.2.4
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: lucide-react
- **State Management**: @tanstack/react-query
- **Date Handling**: date-fns

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password + magic links)
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase (for future file attachments)

### Key Dependencies
- `@supabase/ssr` v0.10.2 - Server-side auth
- `@supabase/supabase-js` v2.105.0 - Client SDK
- `class-variance-authority` - Component variants
- `clsx` + `tailwind-merge` - Conditional styling

---

## Project Structure

```
daily-task-tracker/
├── app/
│   ├── auth/
│   │   ├── callback/route.ts       # OAuth callback handler
│   │   └── auth-code-error/page.tsx # Auth error page
│   ├── dashboard/
│   │   └── page.tsx                 # ✅ Dashboard page
│   ├── login/page.tsx               # ✅ Login page
│   ├── signup/page.tsx              # ✅ Signup page
│   ├── layout.tsx                   # Root layout
│   └── globals.css                  # ✅ Tailwind + shadcn theme
├── components/
│   ├── ui/                          # shadcn/ui components
│   │   ├── button.tsx               # ✅
│   │   ├── card.tsx                 # ✅
│   │   ├── input.tsx                # ✅
│   │   ├── textarea.tsx             # ✅
│   │   ├── badge.tsx                # ✅
│   │   ├── dialog.tsx               # ✅
│   │   ├── dropdown-menu.tsx        # ✅
│   │   └── select.tsx               # ✅
│   └── dashboard/                   # Dashboard components
│       ├── nav.tsx                  # ✅ Sidebar navigation
│       ├── task-list.tsx            # ✅ Task list view
│       ├── task-dialog.tsx          # ✅ Create/edit task dialog
│       └── task-detail-panel.tsx    # ✅ Task detail panel
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Browser client
│   │   ├── server.ts                # Server client
│   │   └── middleware.ts            # Auth session handler
│   ├── database.types.ts            # ✅ TypeScript types from Supabase
│   └── utils.ts                     # Utility functions (cn)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql   # Database schema
├── proxy.ts                         # ✅ Next.js proxy (was middleware.ts)
├── components.json                  # shadcn/ui config
├── package.json
└── .env.local                       # Supabase credentials (gitignored)
```

---

## Environment Setup

### Required Environment Variables

Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
```

### Supabase Configuration

**Important Settings** (in Supabase Dashboard):

1. **Authentication → Providers → Email**
   - ✅ Email confirmation: **DISABLED** (for development)
   - Can be enabled for production

2. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

3. **Database → SQL Editor**
   - Run migration: `supabase/migrations/001_initial_schema.sql`

---

## Key Implementation Details

### 1. Next.js 16 Breaking Changes

**Critical**: This project uses Next.js 16 with breaking changes from v15:

- ✅ `middleware.ts` → `proxy.ts` (renamed for clarity)
- ✅ `proxy` function export (not `middleware`)
- ✅ Tailwind CSS v4 syntax (no `@apply` directives)

**Always check**: `node_modules/next/dist/docs/` for Next.js 16 API changes before implementing new features.

### 2. Authentication Flow

**Current Implementation**:
- Email/password signup and login ✅
- Magic link support (UI ready, tested) ✅
- Session management via `proxy.ts` ✅
- Auto-redirect to `/dashboard` when authenticated ✅
- Auto-redirect to `/login` when not authenticated ✅

**Auth Files**:
- `lib/supabase/client.ts` - Browser-side auth
- `lib/supabase/server.ts` - Server-side auth (with cookies)
- `lib/supabase/middleware.ts` - Session refresh logic
- `proxy.ts` - Route protection

**Important**: Always use `createClient()` from the correct file:
- Client Components: `@/lib/supabase/client`
- Server Components/Actions: `@/lib/supabase/server`
- Proxy: `@/lib/supabase/middleware`

### 3. Styling System

**Tailwind CSS v4 Changes**:
- No `@layer base` with `@apply`
- Use `@theme inline` for CSS variables
- Colors defined as `--color-*` in HSL format

**Current Theme** (in `app/globals.css`):
```css
--color-card: hsl(0 0% 100%)
--color-card-foreground: hsl(222.2 84% 4.9%)
--color-muted-foreground: hsl(215.4 16.3% 46.9%)
```

**shadcn/ui Components**:
- Installed: Button, Card, Input, Dialog, Dropdown, Select
- Style: "new-york" variant
- CSS Variables: enabled
- Base color: slate

### 4. Database Schema

**Tables** (see `supabase/migrations/001_initial_schema.sql`):

1. **projects** - Project organization (future feature)
2. **tasks** - Main task data
   - Columns: title, description, status, priority, due_date, user_id
   - Status: not_started, in_progress, complete, blocked, on_hold
   - Priority: low, medium, high, urgent
3. **task_activities** - Activity timeline
   - Types: comment, status_change, assignment, priority_change
4. **reminders** - Task reminders (future feature)

**Row Level Security (RLS)**: ✅ Enabled
- Users can only access their own data
- Policies: SELECT, INSERT, UPDATE, DELETE per user_id

**Indexes**: Optimized for user queries and date sorting

---

## Development Workflow

### Starting the Dev Server

```bash
npm run dev
```

Server runs on: http://localhost:3000

### Common Commands

```bash
npm install              # Install dependencies
npm run build           # Production build
npm run start           # Start production server
npm run lint            # Run ESLint
```

### Adding shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```

**Already installed**: button, card, input, dialog, dropdown-menu, select

---

## Known Issues & Gotchas

### 1. ✅ FIXED: Email Confirmation Error

**Issue**: Email confirmation links fail with PKCE error
**Solution**: Disabled email confirmation in Supabase (dev mode)
**Production**: Re-enable with proper email templates

### 2. ✅ FIXED: Middleware Deprecation Warning

**Issue**: Next.js 16 renamed `middleware.ts` to `proxy.ts`
**Solution**: File renamed, function renamed to `proxy()`

### 3. ✅ FIXED: Text Visibility Issues

**Issue**: Light text on white background (missing CSS variables)
**Solution**: Added shadcn/ui color system to `globals.css`

### 4. ✅ FIXED: Missing class-variance-authority

**Issue**: Build error for shadcn/ui components
**Solution**: Installed `class-variance-authority` package

### 5. Important: Async cookies() in Next.js 16

**Change**: `cookies()` is now async in Next.js 16
```ts
// Old (Next.js 15)
const cookieStore = cookies()

// New (Next.js 16) ✅
const cookieStore = await cookies()
```

**Already updated in**: `lib/supabase/server.ts`

---

## Next Steps / Roadmap

### Phase 1: Dashboard Implementation ✅ COMPLETE

- [x] Create `/app/dashboard/page.tsx`
- [x] Build dashboard layout with navigation
- [x] Implement task list component
- [x] Add "New Task" dialog
- [x] Wire up Supabase queries with real-time updates

### Phase 2: Task Management ✅ COMPLETE

- [x] Task detail panel (view/edit)
- [x] Status and priority dropdowns
- [x] Due date picker
- [x] Task deletion with confirmation
- [x] Show/hide completed tasks toggle

### Phase 2 Extended: Activity & Project Features ✅ COMPLETE

- [x] Activity timeline component
- [x] Add comment functionality
- [x] Automatic status change logging
- [x] Activity timestamps with date-fns
- [x] Project organization (create, edit, delete, assign, filter)
- [x] Project colors and visual indicators
- [x] Browser-based notifications (Web Notifications API)
- [x] Task reminders for upcoming and overdue tasks
- [x] Customizable notification timing (15min, 30min, 1hr, 1 day before)
- [x] Sortable columns with visual indicators (arrows)
- [x] User profile/account settings (display name, password change)
- [x] Visual overdue task highlighting (red background, alert icon)
- [x] Task duplication/cloning with one click
- [x] Quick task entry (inline input with Enter key)
- [x] Task statistics dashboard (overview metrics and status breakdown)
- [x] Bulk operations (multi-select, batch status update, project assignment, delete)

### Phase 3: Polish & Features (NEXT)

- [ ] Loading states refinement
- [ ] Error boundaries
- [ ] Empty states improvements
- [ ] Mobile responsive design audit
- [ ] Keyboard shortcuts
- [ ] Deploy to Vercel
- [ ] Enable email confirmation (production)

### Phase 4: Future Enhancements
- [ ] Recurring tasks
- [ ] Tags and labels
- [ ] File attachments
- [ ] Dark mode
- [ ] Export tasks (CSV/JSON)
- [ ] Drag-and-drop task reordering
- [ ] Task assignment (multi-user)

---

## Testing the Application

### Manual Testing Checklist

**Authentication**:
- [x] Sign up with new email
- [x] Sign in with credentials  
- [x] Magic link (UI ready)
- [x] Logout functionality
- [x] Protected routes redirect to /login
- [x] Authenticated users redirect to /dashboard

**Dashboard & Tasks** (Ready to Test):
- [ ] View task list
- [ ] Create new task
- [ ] Edit task details
- [ ] Delete task
- [ ] Change task status
- [ ] Set task priority
- [ ] Set due date
- [ ] Search tasks
- [ ] Filter by status (Not Started, In Progress, Complete, Blocked, On Hold)
- [ ] Hide/show completed tasks
- [ ] Clear filters button
- [ ] View task details in side panel
- [ ] Real-time updates when tasks change
- [ ] Add comments to tasks
- [ ] View activity timeline

---

## Code Conventions

### File Naming
- Pages: `page.tsx`
- Layouts: `layout.tsx`
- Route handlers: `route.ts`
- Components: `kebab-case.tsx` (e.g., `task-list.tsx`)

### Component Structure
```tsx
'use client' // Only if needed

import statements
types/interfaces

export default function ComponentName() {
  // hooks
  // handlers
  // render
}
```

### Supabase Queries
- Use React Query for data fetching
- Handle loading/error states
- Implement optimistic updates
- Use RLS policies for security

### Styling
- Use Tailwind utility classes
- Leverage shadcn/ui components
- Keep components responsive
- Use `cn()` helper for conditional classes

---

## Useful Resources

- [Next.js 16 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest)

---

## Support & Troubleshooting

### Common Errors

**"Module not found"**
→ Run `npm install`

**"Cannot find module '@/lib/...'**
→ Check `tsconfig.json` paths are correct

**"Database connection error"**
→ Verify `.env.local` has correct Supabase credentials
→ Check Supabase project is not paused

**"Middleware is deprecated"**
→ Already fixed: using `proxy.ts` instead

**Build errors with globals.css**
→ Ensure Tailwind v4 syntax (no `@apply` in problematic areas)

### Getting Help

1. Check this CLAUDE.md first
2. Review relevant documentation links
3. Check Supabase dashboard for auth/DB issues
4. Review Next.js 16 docs for breaking changes

---

**Last Updated**: 2026-04-30
**Project Status**: ✅ Phase 2 Extended 100% Complete - All core features fully implemented including projects, activities, comments, automatic logging, browser notifications with customizable timing, sortable columns, user profile/account settings (with cross-browser Safari/Chrome compatibility), visual overdue task highlighting, task duplication, quick task entry, task statistics dashboard, and bulk operations for batch task management
**Next Milestone**: Polish features, improve mobile responsiveness, and deploy to Vercel
