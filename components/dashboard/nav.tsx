'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CheckSquare, LogOut, Plus, User as UserIcon, Settings2 } from 'lucide-react'
import { ProjectDialog } from './project-dialog'
import { UserProfileDialog } from './user-profile-dialog'
import { ManageProjectsDialog } from './manage-projects-dialog'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

type Project = Database['public']['Tables']['projects']['Row']

interface DashboardNavProps {
  user: User
  selectedProjectId?: string | null
}

export function DashboardNav({ user, selectedProjectId }: DashboardNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [projects, setProjects] = useState<Project[]>([])
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  const [showManageProjectsDialog, setShowManageProjectsDialog] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (data) {
      setProjects(data)
    }
  }

  useEffect(() => {
    fetchProjects()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchProjects()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id])

  const handleProjectSelect = (projectId: string | null) => {
    if (projectId === null) {
      // "All Tasks" - remove project param
      router.push(pathname)
    } else {
      // Specific project - add project param
      router.push(`${pathname}?project=${projectId}`)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <CheckSquare className="h-6 w-6 text-slate-700" />
          <h1 className="text-lg font-semibold text-slate-900">Task Tracker</h1>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          <Button
            variant={selectedProjectId === null ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => handleProjectSelect(null)}
          >
            All Tasks
          </Button>

          <div className="pt-2">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-sm font-medium text-slate-500">My Projects</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setShowManageProjectsDialog(true)}
                  title="Manage Projects"
                >
                  <Settings2 className="h-3 w-3 mr-1" />
                  Manage
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowProjectDialog(true)}
                  title="New Project"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {projects.length === 0 ? (
              <div className="px-2 py-4 text-center">
                <p className="text-sm text-slate-400">No projects yet</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-sm"
                  onClick={() => setShowProjectDialog(true)}
                >
                  Create your first project
                </Button>
              </div>
            ) : (
              projects.map((project) => (
                <Button
                  key={project.id}
                  variant={selectedProjectId === project.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start mb-1"
                  onClick={() => handleProjectSelect(project.id)}
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: project.color,
                        width: '12px',
                        height: '12px',
                        minWidth: '12px',
                        minHeight: '12px'
                      }}
                    />
                    <span className="truncate">{project.name}</span>
                  </div>
                </Button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200">
        <div className="mb-3 px-2">
          <p className="text-sm text-slate-500">Signed in as</p>
          <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
        </div>
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setShowProfileDialog(true)}
          >
            <UserIcon className="h-4 w-4 mr-2" />
            Account Settings
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </div>

      <ProjectDialog
        open={showProjectDialog}
        onOpenChange={setShowProjectDialog}
        onProjectCreated={fetchProjects}
        userId={user.id}
      />

      <ManageProjectsDialog
        open={showManageProjectsDialog}
        onOpenChange={setShowManageProjectsDialog}
        userId={user.id}
        onProjectsChanged={fetchProjects}
      />

      <UserProfileDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        user={user}
      />
    </div>
  )
}
