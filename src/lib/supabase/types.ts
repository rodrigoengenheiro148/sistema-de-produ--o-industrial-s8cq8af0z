// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
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
      acidity_records: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          performed_times: string | null
          responsible: string
          tank: string
          time: string
          user_id: string
          volume: number
          weight: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          performed_times?: string | null
          responsible: string
          tank: string
          time: string
          user_id?: string
          volume?: number
          weight?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          performed_times?: string | null
          responsible?: string
          tank?: string
          time?: string
          user_id?: string
          volume?: number
          weight?: number
        }
        Relationships: []
      }
      factories: {
        Row: {
          created_at: string
          id: string
          location: string
          manager: string
          name: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location: string
          manager: string
          name: string
          status?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          manager?: string
          name?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      integration_configs: {
        Row: {
          base_url: string | null
          client_id: string | null
          client_secret: string | null
          created_at: string
          id: string
          is_active: boolean | null
          password: string | null
          sync_inventory: boolean | null
          sync_production: boolean | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          base_url?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          password?: string | null
          sync_inventory?: boolean | null
          sync_production?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Update: {
          base_url?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          password?: string | null
          sync_inventory?: boolean | null
          sync_production?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          brevo_api_key: string | null
          created_at: string
          email_enabled: boolean | null
          farinha_threshold: number | null
          farinheta_threshold: number | null
          id: string
          notification_email: string | null
          notification_phone: string | null
          sebo_threshold: number | null
          sms_enabled: boolean | null
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_user: string | null
          updated_at: string
          user_id: string
          yield_threshold: number | null
        }
        Insert: {
          brevo_api_key?: string | null
          created_at?: string
          email_enabled?: boolean | null
          farinha_threshold?: number | null
          farinheta_threshold?: number | null
          id?: string
          notification_email?: string | null
          notification_phone?: string | null
          sebo_threshold?: number | null
          sms_enabled?: boolean | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          updated_at?: string
          user_id?: string
          yield_threshold?: number | null
        }
        Update: {
          brevo_api_key?: string | null
          created_at?: string
          email_enabled?: boolean | null
          farinha_threshold?: number | null
          farinheta_threshold?: number | null
          id?: string
          notification_email?: string | null
          notification_phone?: string | null
          sebo_threshold?: number | null
          sms_enabled?: boolean | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          updated_at?: string
          user_id?: string
          yield_threshold?: number | null
        }
        Relationships: []
      }
      production: {
        Row: {
          created_at: string
          date: string
          farinheta_produced: number
          fco_produced: number
          id: string
          losses: number
          mp_used: number
          sebo_produced: number
          shift: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          farinheta_produced?: number
          fco_produced?: number
          id?: string
          losses?: number
          mp_used?: number
          sebo_produced?: number
          shift: string
          user_id?: string
        }
        Update: {
          created_at?: string
          date?: string
          farinheta_produced?: number
          fco_produced?: number
          id?: string
          losses?: number
          mp_used?: number
          sebo_produced?: number
          shift?: string
          user_id?: string
        }
        Relationships: []
      }
      quality_records: {
        Row: {
          acidity: number
          created_at: string
          date: string
          id: string
          notes: string | null
          product: string
          protein: number
          responsible: string
          user_id: string
        }
        Insert: {
          acidity?: number
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          product: string
          protein?: number
          responsible: string
          user_id?: string
        }
        Update: {
          acidity?: number
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          product?: string
          protein?: number
          responsible?: string
          user_id?: string
        }
        Relationships: []
      }
      raw_materials: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          quantity: number
          supplier: string
          type: string
          unit: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          quantity?: number
          supplier: string
          type: string
          unit?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          quantity?: number
          supplier?: string
          type?: string
          unit?: string
          user_id?: string
        }
        Relationships: []
      }
      shipping: {
        Row: {
          client: string
          created_at: string
          date: string
          doc_ref: string
          id: string
          product: string
          quantity: number
          unit_price: number
          user_id: string
        }
        Insert: {
          client: string
          created_at?: string
          date: string
          doc_ref: string
          id?: string
          product: string
          quantity?: number
          unit_price?: number
          user_id?: string
        }
        Update: {
          client?: string
          created_at?: string
          date?: string
          doc_ref?: string
          id?: string
          product?: string
          quantity?: number
          unit_price?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

