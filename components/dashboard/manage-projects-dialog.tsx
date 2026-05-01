'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Pencil, Trash2, Save, X } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type Project = Database['public']['Tables']['projects']['Row']

interface ManageProjectsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onProjectsChanged: () => void
}

const PRESET_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Green', value: '#10b981' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Teal', value: '#14b8a6' },
]

export function ManageProjectsDialog({ open, onOpenChange, userId, onProjectsChanged }: ManageProjectsDialogProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      fetchProjects()
    }
  }, [open])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (project: Project) => {
    setEditingId(project.id)
    setEditName(project.name)
    setEditColor(project.color || '#6366f1')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditColor('')
  }

  const saveEdit = async (projectId: string) => {
    if (!editName.trim()) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: editName.trim(),
          color: editColor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
        .eq('user_id', userId)

      if (error) throw error

      await fetchProjects()
      onProjectsChanged()
      setEditingId(null)
      setEditName('')
      setEditColor('')
    } catch (err) {
      console.error('Failed to update project:', err)
    } finally {
      setSaving(false)
    }
  }

  const deleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"?\n\nTasks in this project will become unassigned.`)) {
      return
    }

    setDeleting(projectId)
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', userId)

      if (error) throw error

      await fetchProjects()
      onProjectsChanged()
    } catch (err) {
      console.error('Failed to delete project:', err)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Manage Projects</DialogTitle>
          <DialogDescription>
            Edit or delete your projects. Deleting a project will unassign tasks but won't delete them.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-500">
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-slate-500 mb-2">No projects yet</p>
              <p className="text-sm text-slate-400">Create your first project from the sidebar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  {editingId === project.id ? (
                    <>
                      {/* Edit Mode */}
                      <div className="flex-1 space-y-3">
                        <Input
                          placeholder="Project name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          disabled={saving}
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600 font-medium">Color:</span>
                          <div className="flex gap-2 flex-wrap">
                            {PRESET_COLORS.map((color) => (
                              <button
                                key={color.value}
                                onClick={() => setEditColor(color.value)}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${
                                  editColor === color.value
                                    ? 'border-slate-900 scale-110'
                                    : 'border-slate-300 hover:border-slate-400'
                                }`}
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                                disabled={saving}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveEdit(project.id)}
                          disabled={saving || !editName.trim()}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          {saving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEdit}
                          disabled={saving}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* View Mode */}
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color || '#6366f1' }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{project.name}</p>
                        <p className="text-xs text-slate-500">
                          Created {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(project)}
                          disabled={deleting === project.id}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteProject(project.id, project.name)}
                          disabled={deleting === project.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
