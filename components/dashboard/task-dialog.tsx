'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Database, TaskStatus, TaskPriority } from '@/lib/database.types'

type Project = Database['public']['Tables']['projects']['Row']

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskCreated: () => void
  userId: string
  currentProjectId?: string | null
}

export function TaskDialog({ open, onOpenChange, onTaskCreated, userId, currentProjectId }: TaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('not_started')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [projectId, setProjectId] = useState<string | null>(null)
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const supabase = createClient()

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })

    if (data) {
      setProjects(data)
    }
  }

  useEffect(() => {
    if (open) {
      fetchProjects()
      // Set project to current project when dialog opens
      setProjectId(currentProjectId || null)
      // Set due date to exactly 1 day from now in local timezone
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      // Format in local timezone instead of UTC
      const year = tomorrow.getFullYear()
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
      const day = String(tomorrow.getDate()).padStart(2, '0')
      const hours = String(tomorrow.getHours()).padStart(2, '0')
      const minutes = String(tomorrow.getMinutes()).padStart(2, '0')
      const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`
      setDueDate(formattedDate)
    }
  }, [open, userId, currentProjectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Convert datetime-local to ISO timestamp with timezone
      let dueDateISO = null
      if (dueDate) {
        const localDate = new Date(dueDate)
        dueDateISO = localDate.toISOString()
      }

      const { error: insertError } = await supabase.from('tasks').insert({
        user_id: userId,
        title,
        description: description || null,
        status,
        priority,
        due_date: dueDateISO,
        project_id: projectId,
      })

      if (insertError) throw insertError

      // Reset form
      setTitle('')
      setDescription('')
      setStatus('not_started')
      setPriority('medium')
      setProjectId(currentProjectId || null)
      // Reset due date to 1 day from now in local timezone
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const year = tomorrow.getFullYear()
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
      const day = String(tomorrow.getDate()).padStart(2, '0')
      const hours = String(tomorrow.getHours()).padStart(2, '0')
      const minutes = String(tomorrow.getMinutes()).padStart(2, '0')
      const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`
      setDueDate(formattedDate)
      onTaskCreated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your tracker. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title *
              </label>
              <Input
                id="title"
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Add more details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">
                  Status
                </label>
                <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="priority" className="text-sm font-medium">
                  Priority
                </label>
                <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="project" className="text-sm font-medium">
                Project
              </label>
              <Select
                value={projectId || 'none'}
                onValueChange={(value) => setProjectId(value === 'none' ? null : value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center space-x-2">
                        <div
                          className="rounded-full"
                          style={{
                            backgroundColor: project.color,
                            width: '12px',
                            height: '12px',
                            minWidth: '12px',
                            minHeight: '12px'
                          }}
                        />
                        <span>{project.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="dueDate" className="text-sm font-medium">
                Due Date
              </label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title}>
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
