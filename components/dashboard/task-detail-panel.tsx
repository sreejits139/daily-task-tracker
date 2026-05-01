'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, Trash2, MessageSquare, Clock, AlertCircle, Copy } from 'lucide-react'
import { format } from 'date-fns'
import type { Database, TaskStatus, TaskPriority, ActivityType } from '@/lib/database.types'

type Task = Database['public']['Tables']['tasks']['Row']
type Activity = Database['public']['Tables']['task_activities']['Row']
type Project = Database['public']['Tables']['projects']['Row']

interface TaskDetailPanelProps {
  task: Task
  onClose: () => void
  onUpdate: () => void
}

const statusColors = {
  not_started: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  complete: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
}

const statusLabels = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  complete: 'Complete',
  blocked: 'Blocked',
  on_hold: 'On Hold',
}

const priorityIcons = {
  urgent: <AlertCircle className="h-4 w-4 text-red-500" />,
  high: <Clock className="h-4 w-4 text-orange-500" />,
  medium: <Clock className="h-4 w-4 text-yellow-500" />,
  low: <Clock className="h-4 w-4 text-slate-400" />,
}

export function TaskDetailPanel({ task, onClose, onUpdate }: TaskDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [priority, setPriority] = useState<TaskPriority>(task.priority || 'medium')
  const [projectId, setProjectId] = useState<string | null>(task.project_id)
  const [dueDate, setDueDate] = useState(() => {
    if (!task.due_date) return ''
    const date = new Date(task.due_date)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  })
  const [activities, setActivities] = useState<Activity[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const supabase = createClient()

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', task.user_id)
      .order('name', { ascending: true })

    if (data) {
      setProjects(data)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [task.user_id])

  const fetchActivities = async () => {
    const { data } = await supabase
      .from('task_activities')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: false })

    if (data) {
      setActivities(data)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [task.id])

  // Sync local state when task prop changes
  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description || '')
    setStatus(task.status)
    setPriority(task.priority || 'medium')
    setProjectId(task.project_id)
    if (task.due_date) {
      const date = new Date(task.due_date)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      setDueDate(`${year}-${month}-${day}T${hours}:${minutes}`)
    } else {
      setDueDate('')
    }
  }, [task])

  const handleSave = async () => {
    setLoading(true)
    setSaveError(null)

    // Convert datetime-local to ISO timestamp with timezone
    let dueDateISO = null
    if (dueDate) {
      const localDate = new Date(dueDate)
      dueDateISO = localDate.toISOString()
    }

    const updatePayload = {
      title,
      description: description || null,
      status,
      priority,
      due_date: dueDateISO,
      project_id: projectId,
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', task.id)
        .select()

      if (error) {
        console.error('Supabase error:', JSON.stringify(error, null, 2))
        setSaveError(error.message || 'Failed to update task')
        throw error
      }

      // Database trigger handles status change logging automatically
      setIsEditing(false)
      onUpdate()
    } catch (err) {
      console.error('Failed to update task:', JSON.stringify(err, null, 2))
      if (err instanceof Error && err.message) {
        setSaveError(err.message)
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setSaveError(String(err.message))
      } else {
        setSaveError('Failed to update task. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return

    setLoading(true)
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', task.id)

      if (error) throw error

      onClose()
      onUpdate()
    } catch (err) {
      console.error('Failed to delete task:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicate = async () => {
    setLoading(true)
    try {
      // Create a duplicate task with modified title
      const { error } = await supabase.from('tasks').insert({
        user_id: task.user_id,
        title: `${task.title} (Copy)`,
        description: task.description,
        status: 'not_started', // Reset status for the copy
        priority: task.priority,
        project_id: task.project_id,
        due_date: null, // Don't copy due date to avoid duplicate deadlines
      })

      if (error) throw error

      // Close panel and refresh list
      onClose()
      onUpdate()
    } catch (err) {
      console.error('Failed to duplicate task:', err)
      setSaveError('Failed to duplicate task')
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const tempComment = newComment
    setNewComment('')
    setLoading(true)

    try {
      const { data, error } = await supabase.from('task_activities').insert({
        task_id: task.id,
        user_id: task.user_id,
        activity_type: 'comment',
        content: tempComment,
      }).select().single()

      if (error) throw error

      // Optimistically add the comment to the list
      if (data) {
        setActivities([data, ...activities])
      }

      // Trigger parent refresh to update last comment in task list
      onUpdate()
    } catch (err) {
      console.error('Failed to add comment:', err)
      // Restore comment text on error
      setNewComment(tempComment)
    } finally {
      setLoading(false)
    }
  }

  const getActivityMessage = (activity: Activity) => {
    switch (activity.activity_type) {
      case 'status_change':
        const oldStatusLabel = statusLabels[activity.old_value as TaskStatus] || activity.old_value
        const newStatusLabel = statusLabels[activity.new_value as TaskStatus] || activity.new_value
        return `Status changed from ${oldStatusLabel} to ${newStatusLabel}`
      case 'comment':
        return activity.content
      case 'created':
        return 'Task created'
      default:
        return activity.content || 'Activity recorded'
    }
  }

  const getActivityBadge = (activityType: ActivityType) => {
    switch (activityType) {
      case 'comment':
        return <Badge className="bg-blue-100 text-blue-700 text-xs">Comment</Badge>
      case 'status_change':
        return <Badge className="bg-purple-100 text-purple-700 text-xs">Status Change</Badge>
      case 'created':
        return <Badge className="bg-green-100 text-green-700 text-xs">Created</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-700 text-xs">Activity</Badge>
    }
  }

  return (
    <div className="w-[400px] bg-white border-l border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-start justify-between">
        <div className="flex-1">
          {isEditing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-semibold"
            />
          ) : (
            <h3 className="font-semibold text-slate-900">{task.title}</h3>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Status & Priority */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Status</label>
            {isEditing ? (
              <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
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
            ) : (
              <Badge className={statusColors[task.status]}>{statusLabels[task.status]}</Badge>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Priority</label>
            {isEditing ? (
              <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
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
            ) : (
              <div className="flex items-center space-x-2">
                {task.priority && priorityIcons[task.priority]}
                <span className="text-sm capitalize">{task.priority || 'medium'}</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Project</label>
            {isEditing ? (
              <Select value={projectId || 'none'} onValueChange={(value) => setProjectId(value === 'none' ? null : value)}>
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
            ) : (
              <div className="flex items-center space-x-2">
                {task.project_id && projects.find(p => p.id === task.project_id) ? (
                  <>
                    <div
                      className="rounded-full"
                      style={{
                        backgroundColor: projects.find(p => p.id === task.project_id)?.color,
                        width: '12px',
                        height: '12px',
                        minWidth: '12px',
                        minHeight: '12px'
                      }}
                    />
                    <span className="text-sm">{projects.find(p => p.id === task.project_id)?.name}</span>
                  </>
                ) : (
                  <span className="text-sm text-slate-400">No project</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Description</label>
          {isEditing ? (
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Add a description..."
            />
          ) : (
            <p className="text-sm text-slate-600">{task.description || 'No description'}</p>
          )}
        </div>

        {/* Due Date */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Due Date</label>
          {isEditing ? (
            <Input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          ) : (
            <p className="text-sm text-slate-600">
              {task.due_date ? format(new Date(task.due_date), 'PPp') : 'No due date'}
            </p>
          )}
        </div>

        {/* Activity Timeline */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            Activity
          </h4>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="mb-4">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              disabled={loading}
            />
            <Button type="submit" size="sm" className="mt-2" disabled={loading || !newComment.trim()}>
              Add Comment
            </Button>
          </form>

          {/* Activity List */}
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="text-sm border-l-2 border-slate-200 pl-3 py-2">
                <div className="flex items-center space-x-2 mb-1">
                  {getActivityBadge(activity.activity_type)}
                  <p className="text-xs text-slate-400">
                    {format(new Date(activity.created_at), 'PPp')}
                  </p>
                </div>
                <p className="text-slate-700 mt-1">{getActivityMessage(activity)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        {saveError && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {saveError}
          </div>
        )}
        {isEditing ? (
          <div className="flex space-x-2">
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setSaveError(null)
                setTitle(task.title)
                setDescription(task.description || '')
                setStatus(task.status)
                setPriority(task.priority || 'medium')
                setProjectId(task.project_id)
                if (task.due_date) {
                  const date = new Date(task.due_date)
                  const year = date.getFullYear()
                  const month = String(date.getMonth() + 1).padStart(2, '0')
                  const day = String(date.getDate()).padStart(2, '0')
                  const hours = String(date.getHours()).padStart(2, '0')
                  const minutes = String(date.getMinutes()).padStart(2, '0')
                  setDueDate(`${year}-${month}-${day}T${hours}:${minutes}`)
                } else {
                  setDueDate('')
                }
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button onClick={() => {
            setIsEditing(true)
            setSaveError(null)
          }} className="w-full">
            Edit Task
          </Button>
        )}
        <Button variant="outline" onClick={handleDuplicate} disabled={loading} className="w-full">
          <Copy className="h-4 w-4 mr-2" />
          Duplicate Task
        </Button>
        <Button variant="destructive" onClick={handleDelete} disabled={loading} className="w-full">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Task
        </Button>
      </div>
    </div>
  )
}
