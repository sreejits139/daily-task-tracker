'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { User, Mail, Lock, Bell } from 'lucide-react'
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
  const supabase = createClient()

  // Load notification preference on mount
  useEffect(() => {
    const notificationService = getNotificationService()
    setNotificationTime(notificationService.getNotificationTime())
  }, [])

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
