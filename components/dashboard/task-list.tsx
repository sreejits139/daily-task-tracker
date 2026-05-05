'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Search, Eye, EyeOff, Clock, AlertCircle, Columns, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, XCircle, Pause, Ban, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { TaskDialog } from './task-dialog'
import { TaskDetailPanel } from './task-detail-panel'
import { getNotificationService } from '@/lib/notifications'
import { format } from 'date-fns'
import type { Database, TaskStatus } from '@/lib/database.types'

type Task = Database['public']['Tables']['tasks']['Row']
type Activity = Database['public']['Tables']['task_activities']['Row']
type Project = Database['public']['Tables']['projects']['Row']

interface TaskWithLastComment extends Task {
  lastComment?: Activity
}

interface TaskListProps {
  userId: string
  projectId?: string | null
}

const statusColors = {
  not_started: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  in_progress: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  complete: 'bg-green-100 text-green-700 hover:bg-green-200',
  blocked: 'bg-red-100 text-red-700 hover:bg-red-200',
  on_hold: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
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

export function TaskList({ userId, projectId }: TaskListProps) {
  const [tasks, setTasks] = useState<TaskWithLastComment[]>([])
  const [filteredTasks, setFilteredTasks] = useState<TaskWithLastComment[]>([])
  const [loading, setLoading] = useState(true)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [visibleColumns, setVisibleColumns] = useState({
    priority: true,
    project: true,
    dueDate: true,
    lastComment: true,
  })
  const [sortBy, setSortBy] = useState<'title' | 'status' | 'priority' | 'project' | 'dueDate' | 'created'>('created')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [quickTaskTitle, setQuickTaskTitle] = useState('')
  const [isCreatingQuickTask, setIsCreatingQuickTask] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState<'status' | 'project' | 'delete' | null>(null)
  const [bulkStatus, setBulkStatus] = useState<TaskStatus>('not_started')
  const [bulkProject, setBulkProject] = useState<string | null>(null)
  const [showOverview, setShowOverview] = useState(false) // Collapsed by default on mobile
  const supabase = createClient()

  // Check if a task is overdue
  const isTaskOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'complete') return false
    const now = new Date()
    const dueDate = new Date(task.due_date)
    return dueDate < now
  }

  // Load column preferences from localStorage
  useEffect(() => {
    try {
      const savedColumns = localStorage.getItem('taskListColumns')
      if (savedColumns) {
        setVisibleColumns(JSON.parse(savedColumns))
      }
    } catch (error) {
      console.warn('Failed to load column preferences from localStorage:', error)
    }

    try {
      const savedSort = localStorage.getItem('taskListSort')
      if (savedSort) {
        const { sortBy: savedSortBy, sortOrder: savedSortOrder } = JSON.parse(savedSort)
        setSortBy(savedSortBy)
        setSortOrder(savedSortOrder)
      }
    } catch (error) {
      console.warn('Failed to load sort preferences from localStorage:', error)
    }

    // Load overview visibility preference (default collapsed on mobile)
    try {
      const savedShowOverview = localStorage.getItem('taskListShowOverview')
      if (savedShowOverview !== null) {
        setShowOverview(JSON.parse(savedShowOverview))
      }
    } catch (error) {
      console.warn('Failed to load overview preference from localStorage:', error)
    }
  }, [])

  // Save column preferences to localStorage
  const toggleColumn = (column: keyof typeof visibleColumns) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [column]: !visibleColumns[column],
    }
    setVisibleColumns(newVisibleColumns)
    try {
      localStorage.setItem('taskListColumns', JSON.stringify(newVisibleColumns))
    } catch (error) {
      console.warn('Failed to save column preferences to localStorage:', error)
    }
  }

  // Handle column header click for sorting
  const handleSort = (column: typeof sortBy) => {
    let newSortOrder: 'asc' | 'desc' = 'asc'

    // If clicking the same column, toggle the order
    if (sortBy === column) {
      newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
      // Different column - default to desc for created/dueDate, asc for others
      newSortOrder = (column === 'created' || column === 'dueDate') ? 'desc' : 'asc'
    }

    setSortBy(column)
    setSortOrder(newSortOrder)
    try {
      localStorage.setItem('taskListSort', JSON.stringify({ sortBy: column, sortOrder: newSortOrder }))
    } catch (error) {
      console.warn('Failed to save sort preferences to localStorage:', error)
    }
  }

  // Get sort icon for column header
  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 text-slate-400" />
    }
    return sortOrder === 'asc'
      ? <ArrowUp className="h-4 w-4 text-slate-700" />
      : <ArrowDown className="h-4 w-4 text-slate-700" />
  }

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
    fetchProjects()
  }, [userId])

  const fetchTasks = async () => {
    if (!userId) {
      console.error('No userId provided to TaskList')
      setError('No user ID provided')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Try using the optimized database function first
      const { data, error: fetchError } = await supabase
        .rpc('get_tasks_with_last_comment', { p_user_id: userId })

      if (fetchError) {
        // Fallback to regular queries if RPC function doesn't exist (migration not run)
        console.log('Using standard query method (RPC function not available)')

        // Build query with conditional project filter
        let query = supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)

        if (projectId) {
          query = query.eq('project_id', projectId)
        }

        const { data: tasksData, error: tasksError } = await query
          .order('created_at', { ascending: false })

        if (tasksError) {
          console.error('Error fetching tasks:', tasksError)
          setError(tasksError.message || 'Failed to fetch tasks')
          return
        }

        if (tasksData && tasksData.length > 0) {
          const taskIds = tasksData.map(task => task.id)

          const { data: allComments } = await supabase
            .from('task_activities')
            .select('*')
            .in('task_id', taskIds)
            .eq('activity_type', 'comment')
            .order('created_at', { ascending: false })

          const lastCommentByTask = new Map<string, Activity>()
          allComments?.forEach((comment) => {
            if (!lastCommentByTask.has(comment.task_id)) {
              lastCommentByTask.set(comment.task_id, comment)
            }
          })

          const tasksWithComments = tasksData.map((task) => ({
            ...task,
            lastComment: lastCommentByTask.get(task.id) || undefined,
          }))

          setTasks(tasksWithComments)
        } else {
          setTasks(tasksData || [])
        }
      } else if (data) {
        // Filter by project if needed (RPC function doesn't filter by project)
        let filteredData = data
        if (projectId) {
          filteredData = data.filter((row: any) => row.project_id === projectId)
        }

        // Transform the RPC result into our expected structure
        const tasksWithComments = filteredData.map((row: any) => ({
          id: row.id,
          user_id: row.user_id,
          project_id: row.project_id,
          title: row.title,
          description: row.description,
          status: row.status,
          priority: row.priority,
          due_date: row.due_date,
          reminder_date: row.reminder_date,
          completed_at: row.completed_at,
          created_at: row.created_at,
          updated_at: row.updated_at,
          lastComment: row.last_comment_id ? {
            id: row.last_comment_id,
            content: row.last_comment_content,
            created_at: row.last_comment_created_at,
            task_id: row.id,
            user_id: row.user_id,
            activity_type: 'comment' as const,
            old_value: null,
            new_value: null,
          } : undefined,
        }))
        setTasks(tasksWithComments)
      }
    } catch (err) {
      console.error('Exception fetching tasks:', err)
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()

    // Subscribe to real-time changes for tasks
    const tasksChannel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchTasks()
        }
      )
      .subscribe()

    // Subscribe to real-time changes for task activities (comments)
    const activitiesChannel = supabase
      .channel('activities-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_activities',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchTasks()
        }
      )
      .subscribe()

    // Subscribe to real-time changes for projects
    const projectsChannel = supabase
      .channel('projects-changes-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchProjects()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(tasksChannel)
      supabase.removeChannel(activitiesChannel)
      supabase.removeChannel(projectsChannel)
    }
  }, [userId])

  // Separate effect to refetch tasks when projectId changes
  useEffect(() => {
    fetchTasks()
  }, [projectId])

  useEffect(() => {
    let filtered = tasks

    // Filter by status (if not "all")
    if (statusFilter !== 'all') {
      filtered = filtered.filter((task) => task.status === statusFilter)
    }

    // Filter completed tasks (if hide completed is active)
    if (!showCompleted) {
      filtered = filtered.filter((task) => task.status !== 'complete')
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      )
    }

    // Sort the filtered tasks
    const sorted = [...filtered].sort((a, b) => {
      let compareA: any
      let compareB: any

      switch (sortBy) {
        case 'title':
          compareA = a.title.toLowerCase()
          compareB = b.title.toLowerCase()
          break
        case 'status':
          const statusOrder = { not_started: 0, in_progress: 1, blocked: 2, on_hold: 3, complete: 4 }
          compareA = statusOrder[a.status]
          compareB = statusOrder[b.status]
          break
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
          compareA = priorityOrder[a.priority || 'medium']
          compareB = priorityOrder[b.priority || 'medium']
          break
        case 'project':
          const projectA = projects.find(p => p.id === a.project_id)
          const projectB = projects.find(p => p.id === b.project_id)
          compareA = projectA?.name.toLowerCase() || 'zzz' // Put unassigned at end
          compareB = projectB?.name.toLowerCase() || 'zzz'
          break
        case 'dueDate':
          compareA = a.due_date ? new Date(a.due_date).getTime() : Infinity
          compareB = b.due_date ? new Date(b.due_date).getTime() : Infinity
          break
        case 'created':
        default:
          compareA = new Date(a.created_at).getTime()
          compareB = new Date(b.created_at).getTime()
          break
      }

      if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1
      if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredTasks(sorted)
  }, [tasks, showCompleted, searchQuery, statusFilter, sortBy, sortOrder, projects])

  // Update selectedTask when tasks refresh
  useEffect(() => {
    if (selectedTask) {
      const updatedTask = tasks.find((t) => t.id === selectedTask.id)
      if (updatedTask) {
        setSelectedTask(updatedTask)
      } else {
        setSelectedTask(null) // Close panel if task was deleted
      }
    }
  }, [tasks])

  // Notification system integration
  useEffect(() => {
    const notificationService = getNotificationService()

    // Check tasks for notifications whenever tasks change
    if (tasks.length > 0) {
      notificationService.checkTasks(tasks)
    }

    // Start periodic checking
    notificationService.startChecking(tasks, fetchTasks)

    // Listen for notification clicks to open task detail
    const handleOpenTask = (event: Event) => {
      const customEvent = event as CustomEvent<{ taskId: string }>
      const task = tasks.find((t) => t.id === customEvent.detail.taskId)
      if (task) {
        setSelectedTask(task)
      }
    }

    window.addEventListener('open-task', handleOpenTask)

    return () => {
      notificationService.stopChecking()
      window.removeEventListener('open-task', handleOpenTask)
    }
  }, [tasks])

  // Clear notification state when task is completed
  useEffect(() => {
    const notificationService = getNotificationService()
    tasks.forEach((task) => {
      if (task.status === 'complete') {
        notificationService.clearTaskNotification(task.id)
      }
    })
  }, [tasks])

  const handleTaskCreated = () => {
    setIsDialogOpen(false)
    fetchTasks()
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
  }

  const handleTaskUpdated = () => {
    fetchTasks()
  }

  const handleQuickTaskCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickTaskTitle.trim() || isCreatingQuickTask) return

    setIsCreatingQuickTask(true)

    try {
      const { error } = await supabase.from('tasks').insert({
        user_id: userId,
        title: quickTaskTitle.trim(),
        status: 'not_started',
        priority: 'medium',
        project_id: projectId || null, // Assign to current project if filtered
      })

      if (error) throw error

      // Clear input and refresh
      setQuickTaskTitle('')
      fetchTasks()
    } catch (err) {
      console.error('Failed to create quick task:', err)
      setError('Failed to create task')
    } finally {
      setIsCreatingQuickTask(false)
    }
  }

  const getPageTitle = () => {
    if (projectId) {
      const project = projects.find(p => p.id === projectId)
      return project ? project.name : 'Project Tasks'
    }
    return 'All Tasks'
  }

  // Bulk operation handlers
  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTaskIds)
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId)
    } else {
      newSelected.add(taskId)
    }
    setSelectedTaskIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedTaskIds.size === filteredTasks.length) {
      setSelectedTaskIds(new Set())
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map(t => t.id)))
    }
  }

  const handleBulkStatusChange = async () => {
    if (selectedTaskIds.size === 0) return

    setBulkLoading(true)
    try {
      const taskIds = Array.from(selectedTaskIds)
      const { error } = await supabase
        .from('tasks')
        .update({ status: bulkStatus })
        .in('id', taskIds)

      if (error) throw error

      setSelectedTaskIds(new Set())
      setBulkAction(null)
      fetchTasks()
    } catch (err) {
      console.error('Failed to update tasks:', err)
      setError('Failed to update tasks')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkProjectChange = async () => {
    if (selectedTaskIds.size === 0) return

    setBulkLoading(true)
    try {
      const taskIds = Array.from(selectedTaskIds)
      const { error } = await supabase
        .from('tasks')
        .update({ project_id: bulkProject })
        .in('id', taskIds)

      if (error) throw error

      setSelectedTaskIds(new Set())
      setBulkAction(null)
      fetchTasks()
    } catch (err) {
      console.error('Failed to update tasks:', err)
      setError('Failed to update tasks')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedTaskIds.size === 0) return

    if (!confirm(`Are you sure you want to delete ${selectedTaskIds.size} task${selectedTaskIds.size > 1 ? 's' : ''}?`)) {
      return
    }

    setBulkLoading(true)
    try {
      const taskIds = Array.from(selectedTaskIds)
      const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', taskIds)

      if (error) throw error

      setSelectedTaskIds(new Set())
      setBulkAction(null)
      fetchTasks()
    } catch (err) {
      console.error('Failed to delete tasks:', err)
      setError('Failed to delete tasks')
    } finally {
      setBulkLoading(false)
    }
  }

  const completedCount = tasks.filter((t) => t.status === 'complete').length
  const totalCount = tasks.length

  // Calculate statistics
  const getStatistics = () => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // Sunday
    startOfWeek.setHours(0, 0, 0, 0)

    const completedThisWeek = tasks.filter(t => {
      if (t.status !== 'complete' || !t.updated_at) return false
      const updatedDate = new Date(t.updated_at)
      return updatedDate >= startOfWeek
    }).length

    const overdueCount = tasks.filter(t => {
      if (!t.due_date || t.status === 'complete') return false
      return new Date(t.due_date) < now
    }).length

    const statusCounts = {
      not_started: tasks.filter(t => t.status === 'not_started').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      complete: tasks.filter(t => t.status === 'complete').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      on_hold: tasks.filter(t => t.status === 'on_hold').length,
    }

    return {
      total: totalCount,
      completedThisWeek,
      overdue: overdueCount,
      statusCounts
    }
  }

  const stats = getStatistics()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Loading tasks...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <Button onClick={fetchTasks}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-2 sm:p-4 pl-12 sm:pl-4">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="flex-1">
              <h2 className="text-lg sm:text-2xl font-semibold text-slate-900">{getPageTitle()}</h2>
              <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
                {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
                {statusFilter !== 'all' && ` (filtered by ${statusLabels[statusFilter as TaskStatus]})`}
                {!showCompleted && statusFilter === 'all' && ` (${completedCount} completed hidden)`}
              </p>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            {/* Search and filters - single row on mobile */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 sm:pl-9 h-8 sm:h-10 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | 'all')}>
                <SelectTrigger className="w-[100px] sm:w-[140px] h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action buttons row */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
                className="h-8 px-2 sm:px-3 text-xs sm:text-sm"
              >
                {showCompleted ? (
                  <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" />
                )}
                <span className="hidden sm:inline">{showCompleted ? 'Hide' : 'Show'}</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3 text-xs sm:text-sm">
                    <Columns className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Columns</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.priority}
                    onCheckedChange={() => toggleColumn('priority')}
                  >
                    Priority
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.project}
                    onCheckedChange={() => toggleColumn('project')}
                  >
                    Project
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.dueDate}
                    onCheckedChange={() => toggleColumn('dueDate')}
                  >
                    Due Date
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.lastComment}
                    onCheckedChange={() => toggleColumn('lastComment')}
                  >
                    Last Comment
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => setIsDialogOpen(true)} size="sm" className="h-8 px-2 sm:px-3 text-xs sm:text-sm">
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">New Task</span>
              </Button>
            </div>
          </div>

          {/* Quick Task Entry - Hidden on small mobile, shown on larger screens */}
          <form onSubmit={handleQuickTaskCreate} className="mt-2 hidden sm:block">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Plus className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Quick add: Type task title and press Enter..."
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  disabled={isCreatingQuickTask}
                  className="pl-9 h-9"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={!quickTaskTitle.trim() || isCreatingQuickTask}
                className="h-9"
              >
                {isCreatingQuickTask ? 'Adding...' : 'Add Task'}
              </Button>
            </div>
          </form>

          {/* Task Statistics - Collapsible on mobile */}
          {tasks.length > 0 && (
            <div className="mt-2 sm:mt-4">
              {/* Toggle button for mobile */}
              <button
                onClick={() => {
                  const newValue = !showOverview
                  setShowOverview(newValue)
                  try {
                    localStorage.setItem('taskListShowOverview', JSON.stringify(newValue))
                  } catch (error) {
                    console.warn('Failed to save overview preference to localStorage:', error)
                  }
                }}
                className="w-full sm:hidden flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 mb-2 hover:bg-slate-100 transition-colors"
              >
                <span className="text-xs font-semibold text-slate-700">Overview</span>
                {showOverview ? (
                  <ChevronUp className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                )}
              </button>

              {/* Overview content - always shown on desktop, collapsible on mobile */}
              <div className={`bg-white rounded-lg border border-slate-200 p-3 sm:p-4 ${showOverview ? 'block' : 'hidden sm:block'}`}>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3 hidden sm:block">Overview</h3>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-8">
                  {/* Total Tasks */}
                  <div className="flex items-center space-x-1.5 sm:space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900">{stats.total}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 whitespace-nowrap">Total Tasks</p>
                    </div>
                  </div>

                  {/* Completed This Week */}
                  <div className="flex items-center space-x-1.5 sm:space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900">{stats.completedThisWeek}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 whitespace-nowrap">Done This Week</p>
                    </div>
                  </div>

                  {/* Overdue */}
                  <div className="flex items-center space-x-1.5 sm:space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <AlertCircle className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900">{stats.overdue}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 whitespace-nowrap">Overdue</p>
                    </div>
                  </div>

                  {/* In Progress */}
                  <div className="flex items-center space-x-1.5 sm:space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <Clock className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900">{stats.statusCounts.in_progress}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 whitespace-nowrap">In Progress</p>
                    </div>
                  </div>

                  {/* Vertical Divider */}
                  <div className="hidden lg:block h-12 w-px bg-slate-200"></div>

                  {/* Status Breakdown - Inline */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4 text-[10px] sm:text-xs w-full lg:w-auto">
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-400"></div>
                      <span className="text-slate-600 whitespace-nowrap">Not Started: {stats.statusCounts.not_started}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500"></div>
                      <span className="text-slate-600 whitespace-nowrap">Complete: {stats.statusCounts.complete}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500"></div>
                      <span className="text-slate-600 whitespace-nowrap">Blocked: {stats.statusCounts.blocked}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-500"></div>
                      <span className="text-slate-600 whitespace-nowrap">On Hold: {stats.statusCounts.on_hold}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedTaskIds.size > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 px-2 sm:px-4 py-2 sm:py-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="text-xs sm:text-sm font-medium text-blue-900">
                  {selectedTaskIds.size} task{selectedTaskIds.size > 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTaskIds(new Set())}
                  className="text-blue-700 hover:text-blue-900 h-7 px-2 text-xs"
                >
                  Clear
                </Button>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
                {/* Change Status */}
                <Select value={bulkStatus} onValueChange={(value) => setBulkStatus(value as TaskStatus)}>
                  <SelectTrigger className="w-[100px] sm:w-[130px] h-7 sm:h-9 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleBulkStatusChange} disabled={bulkLoading} className="h-7 px-2 text-xs whitespace-nowrap">
                  Update
                </Button>

                {/* Assign Project */}
                <Select value={bulkProject || 'none'} onValueChange={(value) => setBulkProject(value === 'none' ? null : value)}>
                  <SelectTrigger className="w-[100px] sm:w-[130px] h-7 sm:h-9 text-xs">
                    <SelectValue placeholder="Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleBulkProjectChange} disabled={bulkLoading} className="h-7 px-2 text-xs whitespace-nowrap">
                  Assign
                </Button>

                {/* Delete */}
                <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={bulkLoading} className="h-7 px-2 text-xs">
                  <Trash2 className="h-3 w-3 sm:mr-1" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-1.5 sm:p-4">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="text-slate-400 mb-2 text-xs sm:text-sm">
                {searchQuery
                  ? 'No tasks found matching your search'
                  : statusFilter !== 'all'
                  ? `No tasks with status "${statusLabels[statusFilter as TaskStatus]}"`
                  : 'No tasks yet'}
              </div>
              {!searchQuery && statusFilter === 'all' && (
                <Button variant="outline" onClick={() => setIsDialogOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first task
                </Button>
              )}
              {(searchQuery || statusFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                  }}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
              <table className="w-full table-auto sm:table-fixed min-w-[600px]">
                <colgroup>
                  <col className="w-10 sm:w-12" />
                  <col className="sm:w-auto" />
                  <col className="w-28 sm:w-36" />
                  {visibleColumns.priority && <col className="w-24 sm:w-36 hidden sm:table-column" />}
                  {visibleColumns.project && <col className="w-28 sm:w-40 hidden sm:table-column" />}
                  {visibleColumns.dueDate && <col className="w-32 sm:w-48" />}
                  {visibleColumns.lastComment && <col className="w-28 sm:w-40 hidden lg:table-column" />}
                </colgroup>
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="pl-1.5 sm:pl-4 pr-1 sm:pr-2 py-2 sm:py-3 w-10 sm:w-12">
                      <Checkbox
                        checked={selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="pl-1.5 sm:pl-2 pr-1.5 sm:pr-4 py-2 sm:py-3 text-left text-[10px] sm:text-sm font-medium text-slate-700">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleSort('title')}
                          className="flex items-center space-x-0.5 sm:space-x-1 hover:text-slate-900 transition-colors"
                        >
                          <span>Task</span>
                          {getSortIcon('title')}
                        </button>
                      </div>
                    </th>
                    <th className="px-1 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm font-medium text-slate-700 w-28 sm:w-36">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleSort('status')}
                          className="flex items-center space-x-0.5 sm:space-x-1 hover:text-slate-900 transition-colors"
                        >
                          <span>Status</span>
                          {getSortIcon('status')}
                        </button>
                      </div>
                    </th>
                    {visibleColumns.priority && (
                      <th className="px-1 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm font-medium text-slate-700 w-24 sm:w-36 hidden sm:table-cell">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleSort('priority')}
                            className="flex items-center space-x-0.5 sm:space-x-1 hover:text-slate-900 transition-colors"
                          >
                            <span>Priority</span>
                            {getSortIcon('priority')}
                          </button>
                        </div>
                      </th>
                    )}
                    {visibleColumns.project && (
                      <th className="px-1 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm font-medium text-slate-700 w-28 sm:w-40 hidden sm:table-cell">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleSort('project')}
                            className="flex items-center space-x-0.5 sm:space-x-1 hover:text-slate-900 transition-colors"
                          >
                            <span>Project</span>
                            {getSortIcon('project')}
                          </button>
                        </div>
                      </th>
                    )}
                    {visibleColumns.dueDate && (
                      <th className="px-1 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm font-medium text-slate-700 w-32 sm:w-48">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleSort('dueDate')}
                            className="flex items-center space-x-0.5 sm:space-x-1 hover:text-slate-900 transition-colors"
                          >
                            <span>Due</span>
                            {getSortIcon('dueDate')}
                          </button>
                        </div>
                      </th>
                    )}
                    {visibleColumns.lastComment && (
                      <th className="px-1 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm font-medium text-slate-700 w-28 sm:w-40 hidden lg:table-cell">
                        <div className="flex items-center">Comment</div>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => {
                    const isOverdue = isTaskOverdue(task)
                    return (
                      <tr
                        key={task.id}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors border-b ${
                          isOverdue
                            ? 'border-red-200 bg-red-50 hover:bg-red-100'
                            : 'border-slate-200'
                        }`}
                      >
                      <td className="pl-1.5 sm:pl-4 pr-1 sm:pr-2 py-1.5 sm:py-3 align-top" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedTaskIds.has(task.id)}
                          onCheckedChange={() => toggleTaskSelection(task.id)}
                        />
                      </td>
                      <td className="pl-1.5 sm:pl-2 pr-1.5 sm:pr-4 py-1.5 sm:py-3 align-top" onClick={() => handleTaskClick(task)}>
                        <h3 className="text-[11px] sm:text-sm font-medium text-slate-900 line-clamp-2">{task.title}</h3>
                      </td>
                      <td className="px-1 sm:px-4 py-1.5 sm:py-3 align-top" onClick={() => handleTaskClick(task)}>
                        <div className="flex justify-center">
                          <Badge className={`${statusColors[task.status]} text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5`}>
                            {statusLabels[task.status]}
                          </Badge>
                        </div>
                      </td>
                      {visibleColumns.priority && (
                        <td className="px-1 sm:px-4 py-1.5 sm:py-3 align-top hidden sm:table-cell" onClick={() => handleTaskClick(task)}>
                          <div className="flex justify-center items-center space-x-2">
                            {task.priority && priorityIcons[task.priority]}
                            <span className="text-xs sm:text-sm capitalize text-slate-600">
                              {task.priority || 'medium'}
                            </span>
                          </div>
                        </td>
                      )}
                      {visibleColumns.project && (
                        <td className="px-1 sm:px-4 py-1.5 sm:py-3 align-top hidden sm:table-cell" onClick={() => handleTaskClick(task)}>
                          {task.project_id && projects.find(p => p.id === task.project_id) ? (
                            <div className="flex items-center space-x-2">
                              <div
                                className="rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor: projects.find(p => p.id === task.project_id)?.color,
                                  width: '12px',
                                  height: '12px',
                                  minWidth: '12px',
                                  minHeight: '12px'
                                }}
                              />
                              <span className="text-xs sm:text-sm text-slate-600 truncate">
                                {projects.find(p => p.id === task.project_id)?.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs sm:text-sm text-slate-400">No project</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.dueDate && (
                        <td className="px-1 sm:px-4 py-1.5 sm:py-3 align-top" onClick={() => handleTaskClick(task)}>
                          {task.due_date ? (
                            <div className={`flex items-center space-x-0.5 sm:space-x-2 ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                              {isOverdue && <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />}
                              <span className={`text-[10px] sm:text-sm ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                                {format(new Date(task.due_date), 'MMM d, yyyy')}
                                {isOverdue && <span className="ml-0.5 sm:ml-2 text-[9px] sm:text-xs">(Overdue)</span>}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] sm:text-sm text-slate-400">No due date</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.lastComment && (
                        <td className="px-1 sm:px-4 py-1.5 sm:py-3 align-top hidden lg:table-cell" onClick={() => handleTaskClick(task)}>
                          {task.lastComment ? (
                            <p className="text-xs sm:text-sm text-slate-600 line-clamp-1">
                              {task.lastComment.content}
                            </p>
                          ) : (
                            <span className="text-xs sm:text-sm text-slate-400">No comments</span>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdated}
        />
      )}

      {/* Create Task Dialog */}
      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onTaskCreated={handleTaskCreated}
        userId={userId}
        currentProjectId={projectId}
      />
    </div>
  )
}
