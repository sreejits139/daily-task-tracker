'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectCreated: () => void
  userId: string
}

const COLOR_OPTIONS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Teal', value: '#14b8a6' },
]

export function ProjectDialog({ open, onOpenChange, onProjectCreated, userId }: ProjectDialogProps) {
  const [projectName, setProjectName] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setProjectName('')
      setSelectedColor(COLOR_OPTIONS[0].value)
      setError(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!projectName.trim()) {
      setError('Project name is required')
      return
    }

    setLoading(true)

    try {
      const { error: insertError } = await supabase.from('projects').insert({
        user_id: userId,
        name: projectName.trim(),
        color: selectedColor,
      })

      if (insertError) throw insertError

      // Reset form
      setProjectName('')
      setSelectedColor(COLOR_OPTIONS[0].value)
      setError(null)
      onProjectCreated()
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to create project:', err)
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !loading) {
      // Reset form when closing
      setProjectName('')
      setSelectedColor(COLOR_OPTIONS[0].value)
      setError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a new project to organize your tasks.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="projectName" className="text-sm font-medium">
              Project Name
            </label>
            <Input
              id="projectName"
              placeholder="Enter project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Project Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_OPTIONS.map((color) => (
                <div
                  key={color.value}
                  role="button"
                  tabIndex={0}
                  className={`rounded flex-shrink-0 cursor-pointer ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{
                    backgroundColor: color.value,
                    width: '32px',
                    height: '32px',
                    minWidth: '32px',
                    minHeight: '32px',
                    border: selectedColor === color.value ? '3px solid #0f172a' : '2px solid #cbd5e1',
                    boxShadow: selectedColor === color.value ? '0 0 0 2px white, 0 0 0 4px #0f172a' : 'none'
                  }}
                  onClick={() => !loading && setSelectedColor(color.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !loading) {
                      e.preventDefault()
                      setSelectedColor(color.value)
                    }
                  }}
                  title={color.name}
                  aria-label={`Select ${color.name} color`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
