export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      courses: {
        Row: {
          created_at: string | null
          curriculum_id: string | null
          grade_level: string | null
          id: string
          institution_id: string | null
          instructor_id: string | null
          max_participants: number | null
          name: string
          price_per_lesson: number | null
        }
        Insert: {
          created_at?: string | null
          curriculum_id?: string | null
          grade_level?: string | null
          id?: string
          institution_id?: string | null
          instructor_id?: string | null
          max_participants?: number | null
          name: string
          price_per_lesson?: number | null
        }
        Update: {
          created_at?: string | null
          curriculum_id?: string | null
          grade_level?: string | null
          id?: string
          institution_id?: string | null
          instructor_id?: string | null
          max_participants?: number | null
          name?: string
          price_per_lesson?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curricula"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "educational_institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      curricula: {
        Row: {
          age_group: string | null
          created_at: string | null
          description: string | null
          duration_weeks: number | null
          id: string
          name: string
        }
        Insert: {
          age_group?: string | null
          created_at?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          name: string
        }
        Update: {
          age_group?: string | null
          created_at?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      curriculum_tasks: {
        Row: {
          created_at: string | null
          curriculum_id: string | null
          description: string | null
          estimated_duration: number | null
          id: string
          is_mandatory: boolean | null
          lesson_number: number
          order_index: number
          title: string
        }
        Insert: {
          created_at?: string | null
          curriculum_id?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          is_mandatory?: boolean | null
          lesson_number: number
          order_index: number
          title: string
        }
        Update: {
          created_at?: string | null
          curriculum_id?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          is_mandatory?: boolean | null
          lesson_number?: number
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_tasks_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curricula"
            referencedColumns: ["id"]
          },
        ]
      }
      educational_institutions: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      lesson_files: {
        Row: {
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          is_for_marketing: boolean | null
          lesson_id: string | null
          uploaded_at: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_for_marketing?: boolean | null
          lesson_id?: string | null
          uploaded_at?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_for_marketing?: boolean | null
          lesson_id?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_files_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_task_completions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          curriculum_task_id: string | null
          id: string
          instructor_notes: string | null
          lesson_id: string | null
          status: Database["public"]["Enums"]["task_status"] | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          curriculum_task_id?: string | null
          id?: string
          instructor_notes?: string | null
          lesson_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          curriculum_task_id?: string | null
          id?: string
          instructor_notes?: string | null
          lesson_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_task_completions_curriculum_task_id_fkey"
            columns: ["curriculum_task_id"]
            isOneToOne: false
            referencedRelation: "curriculum_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_task_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          course_id: string | null
          created_at: string | null
          feedback: string | null
          id: string
          instructor_id: string | null
          notes: string | null
          participants_count: number | null
          scheduled_end: string
          scheduled_start: string
          status: Database["public"]["Enums"]["lesson_status"] | null
          title: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          course_id?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          instructor_id?: string | null
          notes?: string | null
          participants_count?: number | null
          scheduled_end: string
          scheduled_start: string
          status?: Database["public"]["Enums"]["lesson_status"] | null
          title: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          course_id?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          instructor_id?: string | null
          notes?: string | null
          participants_count?: number | null
          scheduled_end?: string
          scheduled_start?: string
          status?: Database["public"]["Enums"]["lesson_status"] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string
          hourly_rate: number | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          hourly_rate?: number | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          hourly_rate?: number | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      sales_leads: {
        Row: {
          closed_at: string | null
          commission_percentage: number | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          institution_name: string
          instructor_id: string | null
          notes: string | null
          potential_value: number | null
          status: string | null
        }
        Insert: {
          closed_at?: string | null
          commission_percentage?: number | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          institution_name: string
          instructor_id?: string | null
          notes?: string | null
          potential_value?: number | null
          status?: string | null
        }
        Update: {
          closed_at?: string | null
          commission_percentage?: number | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          institution_name?: string
          instructor_id?: string | null
          notes?: string | null
          potential_value?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_leads_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      lesson_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      task_status: "pending" | "completed" | "delayed"
      user_role: "instructor" | "pedagogical_manager" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      lesson_status: ["scheduled", "in_progress", "completed", "cancelled"],
      task_status: ["pending", "completed", "delayed"],
      user_role: ["instructor", "pedagogical_manager", "admin"],
    },
  },
} as const
