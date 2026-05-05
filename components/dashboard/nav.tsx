'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CheckSquare, LogOut, Plus, User as UserIcon, Settings2, Menu, X } from 'lucide-react'
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
    setIsMobileMenuOpen(false) // Close mobile menu on selection
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
    <>
      {/* Mobile Menu Toggle Button - Fixed position */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-slate-200 rounded-lg shadow-lg"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="h-5 w-5 text-slate-700" />
        ) : (
          <Menu className="h-5 w-5 text-slate-700" />
        )}
      </button>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed md:relative inset-y-0 left-0 z-40
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          w-20 sm:w-48 md:w-64
          bg-white border-r border-slate-200 flex flex-col
        `}
      >
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <CheckSquare className="h-6 w-6 text-slate-700 flex-shrink-0" />
          <h1 className="text-lg font-semibold text-slate-900 hidden sm:block truncate">Task Tracker</h1>
        </div>
      </div>

      <div className="flex-1 p-2 sm:p-4 overflow-y-auto">
        <div className="space-y-2">
          <Button
            variant={selectedProjectId === null ? 'secondary' : 'ghost'}
            className="w-full justify-center sm:justify-start px-2 sm:px-4"
            onClick={() => handleProjectSelect(null)}
            title="All Tasks"
          >
            <CheckSquare className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">All Tasks</span>
          </Button>

          <div className="pt-2">
            <div className="flex flex-col sm:flex-row items-center justify-between px-2 mb-2 gap-1">
              <span className="text-xs sm:text-sm font-medium text-slate-500 hidden sm:block">My Projects</span>
              <div className="flex items-center gap-1 w-full justify-center sm:w-auto sm:justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1 sm:px-2 text-xs"
                  onClick={() => setShowManageProjectsDialog(true)}
                  title="Manage Projects"
                >
                  <Settings2 className="h-3 w-3 sm:mr-1" />
                  <span className="hidden sm:inline">Manage</span>
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
                <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">No projects yet</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs sm:text-sm w-full"
                  onClick={() => setShowProjectDialog(true)}
                  title="Create your first project"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Create project</span>
                </Button>
              </div>
            ) : (
              projects.map((project) => (
                <Button
                  key={project.id}
                  variant={selectedProjectId === project.id ? 'secondary' : 'ghost'}
                  className="w-full justify-center sm:justify-start mb-1 px-1 sm:px-4"
                  onClick={() => handleProjectSelect(project.id)}
                  title={project.name}
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
                    <span className="truncate hidden sm:inline">{project.name}</span>
                  </div>
                </Button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="p-2 sm:p-4 border-t border-slate-200">
        <div className="mb-3 px-2 hidden sm:block">
          <p className="text-sm text-slate-500">Signed in as</p>
          <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
        </div>
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-center sm:justify-start px-2"
            onClick={() => setShowProfileDialog(true)}
            title="Account Settings"
          >
            <UserIcon className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Account Settings</span>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-center sm:justify-start px-2"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Sign out</span>
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
    </>
  )
}
