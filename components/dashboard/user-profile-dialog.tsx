'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { User, Mail, Lock, Bell, AlertCircle } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { getNotificationService, NOTIFICATION_TIME_LABELS, type NotificationTime } from '@/lib/notifications'

interface UserProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: SupabaseUser
}

export function UserProfileDialog({ open, onOpenChange, user }: UserProfileDialogProps) {
  const [displayName, setDisplayName] = useState(user.user_metadata?.display_name || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [notificationTime, setNotificationTime] = useState<NotificationTime>('1hour')
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true) // App-level preference
  const supabase = createClient()

  // Check notification permission status
  const checkNotificationPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }

  // Load notification preference on mount and when dialog opens
  useEffect(() => {
    if (open) {
      const notificationService = getNotificationService()
      setNotificationTime(notificationService.getNotificationTime())
      setNotificationsEnabled(notificationService.getNotificationsEnabled())
      checkNotificationPermission()
    }
  }, [open])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      })

      if (updateError) throw updateError

      setSuccess('Profile updated successfully!')
    } catch (err) {
      console.error('Failed to update profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validation
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    setLoading(true)

    try {
      // Update to new password (Supabase validates current session)
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        // Common error is that password is too weak or same as current
        throw updateError
      }

      setSuccess('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error('Failed to update password:', err)
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationTimeChange = (time: NotificationTime) => {
    setNotificationTime(time)
    const notificationService = getNotificationService()
    notificationService.setNotificationTime(time)
    setSuccess('Notification preferences updated!')
    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleEnableNotifications = async () => {
    setError(null)
    setSuccess(null)

    const notificationService = getNotificationService()
    const granted = await notificationService.requestPermission()

    if (granted) {
      setNotificationPermission('granted')
      setNotificationsEnabled(true)
      setSuccess('Browser notifications enabled! You will receive alerts for upcoming tasks.')
      setTimeout(() => setSuccess(null), 3000)
    } else {
      // Check if it was denied
      checkNotificationPermission()
      if (Notification.permission === 'denied') {
        setError('Notification permission denied. Please enable notifications in your browser settings.')
      } else {
        setError('Failed to enable notifications. Please try again.')
      }
    }
  }

  const handleToggleNotifications = (checked: boolean) => {
    const notificationService = getNotificationService()
    notificationService.setNotificationsEnabled(checked)
    setNotificationsEnabled(checked)

    if (checked) {
      setSuccess('Notifications enabled! You will receive task reminders.')
    } else {
      setSuccess('Notifications disabled. You will not receive task reminders.')
    }
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleClose = (newOpen: boolean) => {
    if (!newOpen && !loading) {
      // Reset form when closing
      setError(null)
      setSuccess(null)
      setNewPassword('')
      setConfirmPassword('')
    }
    onOpenChange(newOpen)
  }

  const getInitials = () => {
    if (displayName) {
      return displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return user.email?.substring(0, 2).toUpperCase() || 'U'
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage your account details and preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1 min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Profile Avatar */}
          <div className="flex items-center">
            <div
              className="flex items-center justify-center font-semibold"
              style={{
                width: '64px',
                height: '64px',
                backgroundColor: 'rgb(51, 65, 85)',
                border: '4px solid rgb(226, 232, 240)',
                borderRadius: '50%',
                flexShrink: 0,
                color: 'white',
                fontSize: '1.25rem'
              }}
            >
              {getInitials()}
            </div>
            <div className="flex-1 min-w-0" style={{ marginLeft: '24px' }}>
              <p className="text-base font-semibold text-slate-900 truncate">
                {displayName || 'No name set'}
              </p>
            </div>
          </div>

          {/* Profile Information */}
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm font-medium flex items-center space-x-2">
                <User className="h-4 w-4 text-slate-500" />
                <span>Display Name</span>
              </label>
              <Input
                id="displayName"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center space-x-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <span>Email</span>
              </label>
              <Input
                value={user.email || ''}
                disabled
                className="bg-slate-50 text-slate-500"
              />
              <p className="text-xs text-slate-500">Email cannot be changed</p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>

          {/* Notification Preferences */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-sm font-medium flex items-center space-x-2 mb-4">
              <Bell className="h-4 w-4 text-slate-500" />
              <span>Notification Preferences</span>
            </h3>

            {/* Browser Permission Status */}
            {notificationPermission !== 'granted' ? (
              // Show permission request UI when browser permission not granted
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="notificationsGranted"
                      checked={false}
                      disabled
                      className="cursor-not-allowed"
                    />
                    <div>
                      <label
                        htmlFor="notificationsGranted"
                        className="text-sm font-medium text-slate-700 cursor-default"
                      >
                        Browser Notifications
                      </label>
                      <p className="text-xs text-slate-500">
                        {notificationPermission === 'default' && 'Not enabled - Click below to enable'}
                        {notificationPermission === 'denied' && 'Blocked - Enable in browser settings'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={notificationPermission === 'denied' ? 'outline' : 'default'}
                    onClick={handleEnableNotifications}
                    disabled={loading}
                  >
                    {notificationPermission === 'denied' ? 'Settings' : 'Enable'}
                  </Button>
                </div>

                {notificationPermission === 'denied' && (
                  <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800">
                      <p className="font-medium">Notifications are blocked</p>
                      <p className="mt-1">To enable notifications, you need to allow them in your browser settings:</p>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        <li>Chrome/Edge: Click the lock icon in the address bar → Site settings → Notifications</li>
                        <li>Safari: Safari menu → Settings → Websites → Notifications</li>
                        <li>Firefox: Click the shield icon → Permissions → Notifications</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Show toggle when browser permission is granted
              <div className="space-y-4 mb-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="notificationsEnabled"
                      checked={notificationsEnabled}
                      onCheckedChange={handleToggleNotifications}
                    />
                    <div>
                      <label
                        htmlFor="notificationsEnabled"
                        className="text-sm font-medium text-slate-700 cursor-pointer"
                      >
                        Enable Notifications
                      </label>
                      <p className="text-xs text-slate-500">
                        {notificationsEnabled
                          ? 'You will receive browser notifications for upcoming tasks'
                          : 'Notifications are turned off'}
                      </p>
                    </div>
                  </div>
                  {notificationsEnabled && (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                      Active
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Notification Timing (only show if notifications are enabled) */}
            {notificationPermission === 'granted' && notificationsEnabled && (
              <div className="space-y-2">
                <label htmlFor="notificationTime" className="text-sm font-medium text-slate-700">
                  Notify me before tasks are due
                </label>
                <Select value={notificationTime} onValueChange={handleNotificationTimeChange}>
                  <SelectTrigger id="notificationTime">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15min">{NOTIFICATION_TIME_LABELS['15min']}</SelectItem>
                    <SelectItem value="30min">{NOTIFICATION_TIME_LABELS['30min']}</SelectItem>
                    <SelectItem value="1hour">{NOTIFICATION_TIME_LABELS['1hour']}</SelectItem>
                    <SelectItem value="1day">{NOTIFICATION_TIME_LABELS['1day']}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  You'll receive browser notifications when tasks are approaching their due date
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-sm font-medium flex items-center space-x-2 mb-4">
              <Lock className="h-4 w-4 text-slate-500" />
              <span>Change Password</span>
            </h3>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">
                  New Password
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm New Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full"
                variant="outline"
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </Button>
            </form>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
              {success}
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={loading}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
