import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard/nav'
import { TaskList } from '@/components/dashboard/task-list'
import { NotificationBanner } from '@/components/dashboard/notification-banner'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const resolvedParams = await searchParams
  const projectId = resolvedParams.project || null

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <NotificationBanner />
      <div className="flex flex-1 overflow-hidden">
        <DashboardNav user={user} selectedProjectId={projectId} />
        <main className="flex-1 overflow-hidden">
          <TaskList userId={user.id} projectId={projectId} />
        </main>
      </div>
    </div>
  )
}
