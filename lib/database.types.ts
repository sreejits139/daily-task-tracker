export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type TaskStatus = 'not_started' | 'in_progress' | 'complete' | 'blocked' | 'on_hold'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ActivityType = 'comment' | 'status_change' | 'created' | 'updated' | 'completed' | 'reopened'

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          title: string
          description: string | null
          status: TaskStatus
          priority: TaskPriority | null
          due_date: string | null
          reminder_date: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          title: string
          description?: string | null
          status?: TaskStatus
          priority?: TaskPriority | null
          due_date?: string | null
          reminder_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          title?: string
          description?: string | null
          status?: TaskStatus
          priority?: TaskPriority | null
          due_date?: string | null
          reminder_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      task_activities: {
        Row: {
          id: string
          task_id: string
          user_id: string
          activity_type: ActivityType
          content: string | null
          old_value: string | null
          new_value: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          activity_type: ActivityType
          content?: string | null
          old_value?: string | null
          new_value?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          activity_type?: ActivityType
          content?: string | null
          old_value?: string | null
          new_value?: string | null
          created_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          task_id: string
          user_id: string
          reminder_date: string
          is_sent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          reminder_date: string
          is_sent?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          reminder_date?: string
          is_sent?: boolean
          created_at?: string
        }
      }
    }
  }
}
