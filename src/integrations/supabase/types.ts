export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      course_instances: {
        Row: {
          course_id: string | null
          created_at: string | null
          end_date: string | null
          grade_level: string | null
          id: string
          institution_id: string | null
          instructor_id: string | null
          max_participants: number | null
          price_for_customer: number | null
          price_for_instructor: number | null
          start_date: string | null
          days_of_week: number[] | null
          schedule_pattern: Json | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          end_date?: string | null
          grade_level?: string | null
          id?: string
          institution_id?: string | null
          instructor_id?: string | null
          max_participants?: number | null
          price_for_customer?: number | null
          price_for_instructor?: number | null
          start_date?: string | null
          days_of_week?: number[] | null
          schedule_pattern?: Json | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          end_date?: string | null
          grade_level?: string | null
          id?: string
          institution_id?: string | null
          instructor_id?: string | null
          max_participants?: number | null
          price_for_customer?: number | null
          price_for_instructor?: number | null
          start_date?: string | null
          days_of_week?: number[] | null
          schedule_pattern?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "course_instances_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_instances_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "educational_institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_instances_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_instances_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      course_instance_schedules: {
        Row: {
          id: string
          course_instance_id: string | null
          days_of_week: number[]
          time_slots: Json
          total_lessons: number | null
          lesson_duration_minutes: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          course_instance_id?: string | null
          days_of_week: number[]
          time_slots: Json
          total_lessons?: number | null
          lesson_duration_minutes?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          course_instance_id?: string | null
          days_of_week?: number[]
          time_slots?: Json
          total_lessons?: number | null
          lesson_duration_minutes?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_instance_schedules_course_instance_id_fkey"
            columns: ["course_instance_id"]
            isOneToOne: false
            referencedRelation: "course_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
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
          lesson_report_id: string | null
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
          lesson_report_id?: string | null
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
          lesson_report_id?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_files_lesson_report_id_fkey"
            columns: ["lesson_report_id"]
            isOneToOne: false
            referencedRelation: "lesson_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_reports: {
        Row: {
          completed_task_ids: string[] | null
          created_at: string
          feedback: string | null
          id: string
          instructor_id: string | null
          is_lesson_ok: boolean | null
          lesson_id: string | null
          lesson_schedule_id: string | null
          lesson_title: string
          marketing_consent: boolean | null
          notes: string | null
          participants_count: number | null
          updated_at: string
        }
        Insert: {
          completed_task_ids?: string[] | null
          created_at?: string
          feedback?: string | null
          id?: string
          instructor_id?: string | null
          is_lesson_ok?: boolean | null
          lesson_id?: string | null
          lesson_schedule_id?: string | null
          lesson_title: string
          marketing_consent?: boolean | null
          notes?: string | null
          participants_count?: number | null
          updated_at?: string
        }
        Update: {
          completed_task_ids?: string[] | null
          created_at?: string
          feedback?: string | null
          id?: string
          instructor_id?: string | null
          is_lesson_ok?: boolean | null
          lesson_id?: string | null
          lesson_schedule_id?: string | null
          lesson_title?: string
          marketing_consent?: boolean | null
          notes?: string | null
          participants_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_reports_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reports_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reports_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reports_lesson_schedule_id_fkey"
            columns: ["lesson_schedule_id"]
            isOneToOne: false
            referencedRelation: "lesson_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_schedules: {
        Row: {
          course_instance_id: string | null
          id: string
          instance_number: number | null
          lesson_id: string | null
          scheduled_end: string | null
          scheduled_start: string | null
        }
        Insert: {
          course_instance_id?: string | null
          id?: string
          instance_number?: number | null
          lesson_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
        }
        Update: {
          course_instance_id?: string | null
          id?: string
          instance_number?: number | null
          lesson_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_schedules_course_instance_id_fkey"
            columns: ["course_instance_id"]
            isOneToOne: false
            referencedRelation: "course_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_schedules_lesson_id_fkey"
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
        Relationships: []
      }
      lesson_tasks: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_duration: number | null
          id: string
          is_mandatory: boolean | null
          lesson_id: string
          lesson_number: number | null
          order_index: number
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          is_mandatory?: boolean | null
          lesson_id: string
          lesson_number?: number | null
          order_index: number
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          is_mandatory?: boolean | null
          lesson_id?: string
          lesson_number?: number | null
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_tasks_lesson_id_fkey"
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
          course_id: string
          created_at: string | null
          feedback: string | null
          id: string
          instructor_id: string | null
          notes: string | null
          participants_count: number | null
          scheduled_end: string
          scheduled_start: string
          status: string | null
          title: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          course_id: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          instructor_id?: string | null
          notes?: string | null
          participants_count?: number | null
          scheduled_end: string
          scheduled_start: string
          status?: string | null
          title: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          course_id?: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          instructor_id?: string | null
          notes?: string | null
          participants_count?: number | null
          scheduled_end?: string
          scheduled_start?: string
          status?: string | null
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
          {
            foreignKeyName: "lessons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          benefits: string | null
          birthdate: string | null
          created_at: string | null
          current_work_hours: number | null
          email: string | null
          full_name: string
          hourly_rate: number | null
          id: string
          img: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          benefits?: string | null
          birthdate?: string | null
          created_at?: string | null
          current_work_hours?: number | null
          email?: string | null
          full_name: string
          hourly_rate?: number | null
          id: string
          img?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          benefits?: string | null
          birthdate?: string | null
          created_at?: string | null
          current_work_hours?: number | null
          email?: string | null
          full_name?: string
          hourly_rate?: number | null
          id?: string
          img?: string | null
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
          {
            foreignKeyName: "sales_leads_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          course_instance_id: string | null
          created_at: string | null
          full_name: string
          id: string
        }
        Insert: {
          course_instance_id?: string | null
          created_at?: string | null
          full_name: string
          id?: string
        }
        Update: {
          course_instance_id?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_course_instance_id_fkey"
            columns: ["course_instance_id"]
            isOneToOne: false
            referencedRelation: "course_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          benefits: string | null
          birthdate: string | null
          created_at: string | null
          current_work_hours: number | null
          email: string | null
          full_name: string | null
          hourly_rate: number | null
          id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          benefits?: string | null
          birthdate?: string | null
          created_at?: string | null
          current_work_hours?: number | null
          email?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          benefits?: string | null
          birthdate?: string | null
          created_at?: string | null
          current_work_hours?: number | null
          email?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_by_course_instance_id: {
        Args: { p_uuid: string }
        Returns: number
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_role_text: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin_or_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
