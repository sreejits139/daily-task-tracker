'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getNotificationService } from '@/lib/notifications'

export function NotificationBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return
    }

    setPermission(Notification.permission)

    // Check if user has dismissed the banner before
    let dismissed = false
    try {
      dismissed = localStorage.getItem('notification_banner_dismissed') === 'true'
    } catch (error) {
      console.warn('Failed to read notification banner state from localStorage:', error)
    }

    // Show banner if permission is default (not yet asked) and not dismissed
    if (Notification.permission === 'default' && !dismissed) {
      // Show banner after a short delay to not overwhelm user on page load
      const timer = setTimeout(() => {
        setShowBanner(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleEnable = async () => {
    const service = getNotificationService()
    const granted = await service.requestPermission()

    if (granted) {
      setPermission('granted')
      setShowBanner(false)
    } else {
      setPermission('denied')
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    try {
      localStorage.setItem('notification_banner_dismissed', 'true')
    } catch (error) {
      console.warn('Failed to save notification banner state to localStorage:', error)
    }
  }

  if (!showBanner || permission !== 'default') {
    return null
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3 flex-1">
          <Bell className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              Enable notifications to get reminders for upcoming and overdue tasks
            </p>
            <p className="text-xs text-blue-700 mt-0.5">
              You'll be notified 1 hour before tasks are due and for overdue tasks
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <Button
            size="sm"
            onClick={handleEnable}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Enable
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
