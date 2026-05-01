'use client'

import type { Database } from './database.types'

type Task = Database['public']['Tables']['tasks']['Row']

interface NotificationState {
  [taskId: string]: {
    lastNotified: number
    type: 'upcoming' | 'overdue'
  }
}

const NOTIFICATION_COOLDOWN = 60 * 60 * 1000 // 1 hour - don't spam the same notification
const CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes - check for due tasks every 5 minutes

// Notification time options (in milliseconds)
export const NOTIFICATION_TIMES = {
  '15min': 15 * 60 * 1000,
  '30min': 30 * 60 * 1000,
  '1hour': 60 * 60 * 1000,
  '1day': 24 * 60 * 60 * 1000,
} as const

export type NotificationTime = keyof typeof NOTIFICATION_TIMES

export const NOTIFICATION_TIME_LABELS = {
  '15min': '15 minutes before',
  '30min': '30 minutes before',
  '1hour': '1 hour before',
  '1day': '1 day before',
} as const

const DEFAULT_NOTIFICATION_TIME: NotificationTime = '1hour'

export class TaskNotificationService {
  private notificationState: NotificationState = {}
  private checkInterval: NodeJS.Timeout | null = null
  private notificationTime: NotificationTime = DEFAULT_NOTIFICATION_TIME

  constructor() {
    // Load notification state from localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('task_notifications_state')
        if (stored) {
          this.notificationState = JSON.parse(stored)
        }
      } catch (error) {
        console.warn('Failed to load notification state from localStorage:', error)
        this.notificationState = {}
      }

      // Load notification preference
      try {
        const timePreference = localStorage.getItem('notification_time_preference') as NotificationTime
        if (timePreference && NOTIFICATION_TIMES[timePreference]) {
          this.notificationTime = timePreference
        }
      } catch (error) {
        console.warn('Failed to load notification preference from localStorage:', error)
      }
    }
  }

  // Get current notification time preference
  getNotificationTime(): NotificationTime {
    return this.notificationTime
  }

  // Set notification time preference
  setNotificationTime(time: NotificationTime) {
    this.notificationTime = time
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('notification_time_preference', time)
      } catch (error) {
        console.warn('Failed to save notification preference to localStorage:', error)
      }
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  // Check if notifications are enabled
  isEnabled(): boolean {
    return typeof window !== 'undefined' &&
           'Notification' in window &&
           Notification.permission === 'granted'
  }

  // Save notification state to localStorage
  private saveState() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('task_notifications_state', JSON.stringify(this.notificationState))
      } catch (error) {
        console.warn('Failed to save notification state to localStorage:', error)
      }
    }
  }

  // Check if we should notify for this task
  private shouldNotify(task: Task, type: 'upcoming' | 'overdue'): boolean {
    // Don't notify for completed tasks
    if (task.status === 'complete') {
      return false
    }

    // Don't notify if no due date
    if (!task.due_date) {
      return false
    }

    const state = this.notificationState[task.id]

    // If never notified before, allow
    if (!state) {
      return true
    }

    // If notification type changed (e.g., upcoming -> overdue), allow
    if (state.type !== type) {
      return true
    }

    // Check cooldown period
    const now = Date.now()
    const timeSinceLastNotification = now - state.lastNotified
    return timeSinceLastNotification > NOTIFICATION_COOLDOWN
  }

  // Mark task as notified
  private markNotified(taskId: string, type: 'upcoming' | 'overdue') {
    this.notificationState[taskId] = {
      lastNotified: Date.now(),
      type,
    }
    this.saveState()
  }

  // Clear notification state for a task (e.g., when completed)
  clearTaskNotification(taskId: string) {
    delete this.notificationState[taskId]
    this.saveState()
  }

  // Send a notification for a task
  private async sendNotification(task: Task, type: 'upcoming' | 'overdue') {
    if (!this.isEnabled()) {
      return
    }

    if (!this.shouldNotify(task, type)) {
      return
    }

    const dueDate = new Date(task.due_date!)
    const now = new Date()

    let title = ''
    let body = ''
    let icon = '/favicon.ico' // You can customize this

    if (type === 'overdue') {
      const overdueDuration = now.getTime() - dueDate.getTime()
      const hoursOverdue = Math.floor(overdueDuration / (1000 * 60 * 60))
      const daysOverdue = Math.floor(hoursOverdue / 24)

      title = `⚠️ Task Overdue: ${task.title}`
      if (daysOverdue > 0) {
        body = `This task was due ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago`
      } else if (hoursOverdue > 0) {
        body = `This task was due ${hoursOverdue} hour${hoursOverdue > 1 ? 's' : ''} ago`
      } else {
        body = `This task is overdue`
      }
    } else {
      const timeUntilDue = dueDate.getTime() - now.getTime()
      const minutesUntilDue = Math.floor(timeUntilDue / (1000 * 60))

      title = `⏰ Task Due Soon: ${task.title}`
      if (minutesUntilDue < 15) {
        body = `Due in ${minutesUntilDue} minutes`
      } else {
        const hoursUntilDue = Math.floor(minutesUntilDue / 60)
        const remainingMinutes = minutesUntilDue % 60
        body = remainingMinutes > 0
          ? `Due in ${hoursUntilDue}h ${remainingMinutes}m`
          : `Due in ${hoursUntilDue} hour${hoursUntilDue > 1 ? 's' : ''}`
      }
    }

    try {
      const notification = new Notification(title, {
        body,
        icon,
        badge: icon,
        tag: `task-${task.id}-${type}`, // Prevents duplicate notifications
        requireInteraction: type === 'overdue', // Overdue notifications stay until dismissed
        data: {
          taskId: task.id,
          type,
        },
      })

      // Handle notification click - could be used to open the task
      notification.onclick = () => {
        window.focus()
        // Dispatch custom event to open task detail
        window.dispatchEvent(new CustomEvent('open-task', { detail: { taskId: task.id } }))
        notification.close()
      }

      this.markNotified(task.id, type)
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }

  // Check all tasks and send notifications as needed
  checkTasks(tasks: Task[]) {
    if (!this.isEnabled()) {
      return
    }

    const now = new Date()
    const upcomingThreshold = NOTIFICATION_TIMES[this.notificationTime]

    tasks.forEach((task) => {
      // Skip if no due date or task is completed
      if (!task.due_date || task.status === 'complete') {
        return
      }

      const dueDate = new Date(task.due_date)
      const timeUntilDue = dueDate.getTime() - now.getTime()

      // Check if overdue
      if (timeUntilDue < 0) {
        this.sendNotification(task, 'overdue')
      }
      // Check if due soon (within the configured threshold)
      else if (timeUntilDue <= upcomingThreshold) {
        this.sendNotification(task, 'upcoming')
      }
    })
  }

  // Start periodic checking
  startChecking(tasks: Task[], updateCallback: () => void) {
    if (this.checkInterval) {
      return // Already checking
    }

    // Initial check
    this.checkTasks(tasks)

    // Set up periodic checking
    this.checkInterval = setInterval(() => {
      updateCallback() // Trigger a data refresh
    }, CHECK_INTERVAL)
  }

  // Stop periodic checking
  stopChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }
}

// Singleton instance
let notificationService: TaskNotificationService | null = null

export function getNotificationService(): TaskNotificationService {
  if (!notificationService) {
    notificationService = new TaskNotificationService()
  }
  return notificationService
}
