export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      calendar_suggestions: {
        Row: {
          calendar_event_id: string
          created_at: string
          detected_location: string | null
          event_date: string
          event_title: string
          id: string
          status: string | null
          suggested_trip_id: string | null
          user_id: string
        }
        Insert: {
          calendar_event_id: string
          created_at?: string
          detected_location?: string | null
          event_date: string
          event_title: string
          id?: string
          status?: string | null
          suggested_trip_id?: string | null
          user_id: string
        }
        Update: {
          calendar_event_id?: string
          created_at?: string
          detected_location?: string | null
          event_date?: string
          event_title?: string
          id?: string
          status?: string | null
          suggested_trip_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_suggestions_suggested_trip_id_fkey"
            columns: ["suggested_trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          domain: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          document_type: string
          file_data: Json | null
          file_url: string | null
          id: string
          name: string
          trip_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_data?: Json | null
          file_url?: string | null
          id?: string
          name: string
          trip_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_data?: Json | null
          file_url?: string | null
          id?: string
          name?: string
          trip_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string
          company_id: string | null
          created_at: string
          currency: string | null
          description: string
          id: string
          receipt_url: string | null
          status: string
          submitted_at: string | null
          trip_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category: string
          company_id?: string | null
          created_at?: string
          currency?: string | null
          description: string
          id?: string
          receipt_url?: string | null
          status?: string
          submitted_at?: string | null
          trip_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          company_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string
          id?: string
          receipt_url?: string | null
          status?: string
          submitted_at?: string | null
          trip_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          company_id: string
          content: string
          created_at: string
          id: string
          message_type: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          id?: string
          message_type?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          message_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_2fa_verifications: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          phone_number: string
          session_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          phone_number: string
          session_token: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          phone_number?: string
          session_token?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auto_match_expenses: boolean
          avatar_url: string | null
          company_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          job_title: string | null
          notify_expense_approvals: boolean
          notify_flight_disruptions: boolean
          notify_trip_updates: boolean
          notify_weekly_summary: boolean
          phone: string | null
          theme_preference: string | null
          timezone: string | null
          two_factor_enabled: boolean | null
          two_factor_phone: string | null
          two_factor_verified_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_match_expenses?: boolean
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          notify_expense_approvals?: boolean
          notify_flight_disruptions?: boolean
          notify_trip_updates?: boolean
          notify_weekly_summary?: boolean
          phone?: string | null
          theme_preference?: string | null
          timezone?: string | null
          two_factor_enabled?: boolean | null
          two_factor_phone?: string | null
          two_factor_verified_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_match_expenses?: boolean
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          notify_expense_approvals?: boolean
          notify_flight_disruptions?: boolean
          notify_trip_updates?: boolean
          notify_weekly_summary?: boolean
          phone?: string | null
          theme_preference?: string | null
          timezone?: string | null
          two_factor_enabled?: boolean | null
          two_factor_phone?: string | null
          two_factor_verified_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          severity: string
          title: string
          trip_id: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          severity?: string
          title: string
          trip_id: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          severity?: string
          title?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_alerts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_preferences: {
        Row: {
          budget_threshold_per_day: number | null
          created_at: string
          dietary_restrictions: string | null
          id: string
          preferred_airlines: string[] | null
          preferred_class: string | null
          preferred_hotel_brands: string[] | null
          preferred_seat: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_threshold_per_day?: number | null
          created_at?: string
          dietary_restrictions?: string | null
          id?: string
          preferred_airlines?: string[] | null
          preferred_class?: string | null
          preferred_hotel_brands?: string[] | null
          preferred_seat?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_threshold_per_day?: number | null
          created_at?: string
          dietary_restrictions?: string | null
          id?: string
          preferred_airlines?: string[] | null
          preferred_class?: string | null
          preferred_hotel_brands?: string[] | null
          preferred_seat?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          ai_generated: boolean | null
          calendar_event_id: string | null
          company_id: string | null
          created_at: string
          destination: string
          destination_address: string | null
          end_date: string
          flight_details: Json | null
          ground_transport: Json | null
          hotel_details: Json | null
          id: string
          purpose: string | null
          start_date: string
          status: string
          title: string
          total_estimated_cost: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_generated?: boolean | null
          calendar_event_id?: string | null
          company_id?: string | null
          created_at?: string
          destination: string
          destination_address?: string | null
          end_date: string
          flight_details?: Json | null
          ground_transport?: Json | null
          hotel_details?: Json | null
          id?: string
          purpose?: string | null
          start_date: string
          status?: string
          title: string
          total_estimated_cost?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_generated?: boolean | null
          calendar_event_id?: string | null
          company_id?: string | null
          created_at?: string
          destination?: string
          destination_address?: string | null
          end_date?: string
          flight_details?: Json | null
          ground_transport?: Json | null
          hotel_details?: Json | null
          id?: string
          purpose?: string | null
          start_date?: string
          status?: string
          title?: string
          total_estimated_cost?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      two_factor_audit_log: {
        Row: {
          action: string
          created_at: string
          error_message: string | null
          id: string
          ip_address: string | null
          phone_number_masked: string | null
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          phone_number_masked?: string | null
          success: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          phone_number_masked?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_company_id: { Args: never; Returns: string }
      get_or_create_company: { Args: { email_input: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
