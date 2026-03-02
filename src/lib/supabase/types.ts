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
          acidity: number | null
          created_at: string
          date: string
          factory_id: string | null
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
          acidity?: number | null
          created_at?: string
          date: string
          factory_id?: string | null
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
          acidity?: number | null
          created_at?: string
          date?: string
          factory_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "acidity_records_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      boiler_control_records: {
        Row: {
          cald_01_m3: number | null
          cald_01_pct: number | null
          cald_02_m3: number | null
          cald_02_pct: number | null
          created_at: string | null
          date: string
          factory_id: string
          id: string
          initial_stock_m3: number | null
          initial_stock_pct: number | null
          user_id: string | null
          wood_entry_m3: number | null
          wood_entry_pct: number | null
        }
        Insert: {
          cald_01_m3?: number | null
          cald_01_pct?: number | null
          cald_02_m3?: number | null
          cald_02_pct?: number | null
          created_at?: string | null
          date: string
          factory_id: string
          id?: string
          initial_stock_m3?: number | null
          initial_stock_pct?: number | null
          user_id?: string | null
          wood_entry_m3?: number | null
          wood_entry_pct?: number | null
        }
        Update: {
          cald_01_m3?: number | null
          cald_01_pct?: number | null
          cald_02_m3?: number | null
          cald_02_pct?: number | null
          created_at?: string | null
          date?: string
          factory_id?: string
          id?: string
          initial_stock_m3?: number | null
          initial_stock_pct?: number | null
          user_id?: string | null
          wood_entry_m3?: number | null
          wood_entry_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "boiler_control_records_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      cooking_time_records: {
        Row: {
          created_at: string
          date: string
          end_time: string | null
          factory_id: string
          id: string
          start_time: string | null
          total_hours: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string | null
          factory_id: string
          id?: string
          start_time?: string | null
          total_hours?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string | null
          factory_id?: string
          id?: string
          start_time?: string | null
          total_hours?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cooking_time_records_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_production_forecasts: {
        Row: {
          created_at: string
          date: string
          factory_id: string
          id: string
          material_type: string
          mp_forecast: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          factory_id: string
          id?: string
          material_type?: string
          mp_forecast?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          factory_id?: string
          id?: string
          material_type?: string
          mp_forecast?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_production_forecasts_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      digester_records: {
        Row: {
          created_at: string | null
          date: string
          digester_name: string
          duration_seconds: number
          factory_id: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          digester_name: string
          duration_seconds: number
          factory_id: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          digester_name?: string
          duration_seconds?: number
          factory_id?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digester_records_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      downtime_records: {
        Row: {
          created_at: string
          date: string
          duration_hours: number
          end_time: string | null
          factory_id: string
          id: string
          reason: string
          start_time: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          duration_hours?: number
          end_time?: string | null
          factory_id: string
          id?: string
          reason: string
          start_time?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          duration_hours?: number
          end_time?: string | null
          factory_id?: string
          id?: string
          reason?: string
          start_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "downtime_records_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
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
          api_documentation_url: string | null
          api_token: string | null
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
          api_documentation_url?: string | null
          api_token?: string | null
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
          api_documentation_url?: string | null
          api_token?: string | null
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
          fco_threshold: number | null
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
          fco_threshold?: number | null
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
          fco_threshold?: number | null
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
          blood_meal_bags: number | null
          blood_meal_produced: number
          created_at: string
          date: string
          factory_id: string | null
          farinheta_produced: number
          fco_produced: number
          feather_meal_produced: number
          fish_meal_produced: number
          id: string
          losses: number
          mp_used: number
          sebo_produced: number
          shift: string
          user_id: string
          visceras_meal_produced: number
          visceras_oil_produced: number
        }
        Insert: {
          blood_meal_bags?: number | null
          blood_meal_produced?: number
          created_at?: string
          date: string
          factory_id?: string | null
          farinheta_produced?: number
          fco_produced?: number
          feather_meal_produced?: number
          fish_meal_produced?: number
          id?: string
          losses?: number
          mp_used?: number
          sebo_produced?: number
          shift: string
          user_id?: string
          visceras_meal_produced?: number
          visceras_oil_produced?: number
        }
        Update: {
          blood_meal_bags?: number | null
          blood_meal_produced?: number
          created_at?: string
          date?: string
          factory_id?: string | null
          farinheta_produced?: number
          fco_produced?: number
          feather_meal_produced?: number
          fish_meal_produced?: number
          id?: string
          losses?: number
          mp_used?: number
          sebo_produced?: number
          shift?: string
          user_id?: string
          visceras_meal_produced?: number
          visceras_oil_produced?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_records: {
        Row: {
          acidity: number
          created_at: string
          date: string
          factory_id: string | null
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
          factory_id?: string | null
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
          factory_id?: string | null
          id?: string
          notes?: string | null
          product?: string
          protein?: number
          responsible?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_records_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_materials: {
        Row: {
          created_at: string
          date: string
          factory_id: string | null
          id: string
          invoice_weight: number | null
          notes: string | null
          quantity: number
          supplier: string | null
          type: string
          unit: string
          user_id: string
          vehicle_plate: string | null
        }
        Insert: {
          created_at?: string
          date: string
          factory_id?: string | null
          id?: string
          invoice_weight?: number | null
          notes?: string | null
          quantity?: number
          supplier?: string | null
          type: string
          unit?: string
          user_id?: string
          vehicle_plate?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          factory_id?: string | null
          id?: string
          invoice_weight?: number | null
          notes?: string | null
          quantity?: number
          supplier?: string | null
          type?: string
          unit?: string
          user_id?: string
          vehicle_plate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raw_materials_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      returns: {
        Row: {
          created_at: string | null
          date: string
          description: string
          factory_id: string
          id: string
          outbound_freight: number
          quantity: number
          return_freight: number
          supplier: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string | null
          date: string
          description: string
          factory_id: string
          id?: string
          outbound_freight?: number
          quantity: number
          return_freight?: number
          supplier: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string
          factory_id?: string
          id?: string
          outbound_freight?: number
          quantity?: number
          return_freight?: number
          supplier?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "returns_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      sebo_inventory_records: {
        Row: {
          acidity: number | null
          category: string
          created_at: string
          date: string
          description: string | null
          factory_id: string
          id: string
          impurity: number | null
          iodine: number | null
          label: string | null
          moisture: number | null
          quantity_kg: number | null
          quantity_lt: number | null
          soaps: number | null
          tank_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acidity?: number | null
          category: string
          created_at?: string
          date: string
          description?: string | null
          factory_id: string
          id?: string
          impurity?: number | null
          iodine?: number | null
          label?: string | null
          moisture?: number | null
          quantity_kg?: number | null
          quantity_lt?: number | null
          soaps?: number | null
          tank_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acidity?: number | null
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          factory_id?: string
          id?: string
          impurity?: number | null
          iodine?: number | null
          label?: string | null
          moisture?: number | null
          quantity_kg?: number | null
          quantity_lt?: number | null
          soaps?: number | null
          tank_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sebo_inventory_records_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping: {
        Row: {
          client: string
          created_at: string
          date: string
          doc_ref: string
          factory_id: string | null
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
          factory_id?: string | null
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
          factory_id?: string | null
          id?: string
          product?: string
          quantity?: number
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      steam_control_records: {
        Row: {
          created_at: string | null
          date: string
          factory_id: string
          firewood: number | null
          id: string
          meter_end: number | null
          meter_start: number | null
          package_count: number | null
          rice_husk: number | null
          soy_waste: number | null
          steam_consumption: number | null
          supplier: string | null
          user_id: string | null
          value: number | null
          volume_m3: number | null
          weight_kg: number | null
          wood_chips: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          factory_id: string
          firewood?: number | null
          id?: string
          meter_end?: number | null
          meter_start?: number | null
          package_count?: number | null
          rice_husk?: number | null
          soy_waste?: number | null
          steam_consumption?: number | null
          supplier?: string | null
          user_id?: string | null
          value?: number | null
          volume_m3?: number | null
          weight_kg?: number | null
          wood_chips?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          factory_id?: string
          firewood?: number | null
          id?: string
          meter_end?: number | null
          meter_start?: number | null
          package_count?: number | null
          rice_husk?: number | null
          soy_waste?: number | null
          steam_consumption?: number | null
          supplier?: string | null
          user_id?: string | null
          value?: number | null
          volume_m3?: number | null
          weight_kg?: number | null
          wood_chips?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "steam_control_records_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_balance_records: {
        Row: {
          description: string
          factory_id: string
          id: string
          is_filial_row: boolean
          product_code: string
          quantity_units: number
          updated_at: string
          user_id: string | null
          weight_kg: number
        }
        Insert: {
          description: string
          factory_id: string
          id?: string
          is_filial_row?: boolean
          product_code: string
          quantity_units?: number
          updated_at?: string
          user_id?: string | null
          weight_kg?: number
        }
        Update: {
          description?: string
          factory_id?: string
          id?: string
          is_filial_row?: boolean
          product_code?: string
          quantity_units?: number
          updated_at?: string
          user_id?: string | null
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_balance_records_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
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


// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: acidity_records
//   id: uuid (not null, default: gen_random_uuid())
//   date: timestamp with time zone (not null)
//   time: text (not null)
//   responsible: text (not null)
//   weight: numeric (not null, default: 0)
//   volume: numeric (not null, default: 0)
//   tank: text (not null)
//   performed_times: text (nullable)
//   notes: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   user_id: uuid (not null, default: auth.uid())
//   factory_id: uuid (nullable)
//   acidity: numeric (nullable, default: 0)
// Table: boiler_control_records
//   id: uuid (not null, default: gen_random_uuid())
//   factory_id: uuid (not null)
//   user_id: uuid (nullable)
//   date: date (not null)
//   cald_01_pct: numeric (nullable, default: 0)
//   cald_01_m3: numeric (nullable, default: 0)
//   cald_02_pct: numeric (nullable, default: 0)
//   cald_02_m3: numeric (nullable, default: 0)
//   wood_entry_pct: numeric (nullable, default: 0)
//   wood_entry_m3: numeric (nullable, default: 0)
//   initial_stock_pct: numeric (nullable, default: 0)
//   initial_stock_m3: numeric (nullable, default: 0)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: cooking_time_records
//   id: uuid (not null, default: gen_random_uuid())
//   factory_id: uuid (not null)
//   user_id: uuid (not null)
//   date: date (not null)
//   start_time: time without time zone (nullable)
//   end_time: time without time zone (nullable)
//   created_at: timestamp with time zone (not null, default: timezone('utc'::text, now()))
//   total_hours: numeric (nullable)
// Table: daily_production_forecasts
//   id: uuid (not null, default: gen_random_uuid())
//   factory_id: uuid (not null)
//   date: date (not null)
//   mp_forecast: numeric (not null, default: 0)
//   created_at: timestamp with time zone (not null, default: now())
//   user_id: uuid (nullable)
//   material_type: text (not null, default: 'Geral'::text)
// Table: digester_records
//   id: uuid (not null, default: gen_random_uuid())
//   factory_id: uuid (not null)
//   user_id: uuid (nullable)
//   date: date (not null)
//   digester_name: text (not null)
//   duration_seconds: integer (not null)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: downtime_records
//   id: uuid (not null, default: gen_random_uuid())
//   factory_id: uuid (not null)
//   user_id: uuid (not null)
//   date: date (not null)
//   duration_hours: numeric (not null, default: 0)
//   reason: text (not null)
//   created_at: timestamp with time zone (not null, default: timezone('utc'::text, now()))
//   start_time: timestamp with time zone (nullable)
//   end_time: timestamp with time zone (nullable)
// Table: factories
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   location: text (not null)
//   manager: text (not null)
//   status: text (not null, default: 'active'::text)
//   created_at: timestamp with time zone (not null, default: now())
//   user_id: uuid (not null, default: auth.uid())
// Table: integration_configs
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null, default: auth.uid())
//   base_url: text (nullable)
//   username: text (nullable)
//   password: text (nullable)
//   client_id: text (nullable)
//   client_secret: text (nullable)
//   sync_inventory: boolean (nullable, default: false)
//   sync_production: boolean (nullable, default: false)
//   is_active: boolean (nullable, default: false)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
//   api_token: text (nullable)
//   api_documentation_url: text (nullable)
// Table: notification_settings
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null, default: auth.uid())
//   email_enabled: boolean (nullable, default: false)
//   sms_enabled: boolean (nullable, default: false)
//   yield_threshold: numeric (nullable, default: 0)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
//   sebo_threshold: numeric (nullable, default: 0)
//   farinheta_threshold: numeric (nullable, default: 0)
//   farinha_threshold: numeric (nullable, default: 0)
//   notification_email: text (nullable, default: ''::text)
//   notification_phone: text (nullable, default: ''::text)
//   brevo_api_key: text (nullable)
//   smtp_host: text (nullable)
//   smtp_port: integer (nullable)
//   smtp_user: text (nullable)
//   smtp_password: text (nullable)
//   fco_threshold: numeric (nullable, default: 0)
// Table: production
//   id: uuid (not null, default: gen_random_uuid())
//   date: timestamp with time zone (not null)
//   shift: text (not null)
//   mp_used: numeric (not null, default: 0)
//   sebo_produced: numeric (not null, default: 0)
//   fco_produced: numeric (not null, default: 0)
//   farinheta_produced: numeric (not null, default: 0)
//   losses: numeric (not null, default: 0)
//   created_at: timestamp with time zone (not null, default: now())
//   user_id: uuid (not null, default: auth.uid())
//   factory_id: uuid (nullable)
//   blood_meal_produced: numeric (not null, default: 0)
//   blood_meal_bags: integer (nullable, default: 0)
//   visceras_meal_produced: numeric (not null, default: 0)
//   feather_meal_produced: numeric (not null, default: 0)
//   fish_meal_produced: numeric (not null, default: 0)
//   visceras_oil_produced: numeric (not null, default: 0)
// Table: quality_records
//   id: uuid (not null, default: gen_random_uuid())
//   date: timestamp with time zone (not null)
//   product: text (not null)
//   acidity: numeric (not null, default: 0)
//   protein: numeric (not null, default: 0)
//   responsible: text (not null)
//   notes: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   user_id: uuid (not null, default: auth.uid())
//   factory_id: uuid (nullable)
// Table: raw_materials
//   id: uuid (not null, default: gen_random_uuid())
//   date: timestamp with time zone (not null)
//   supplier: text (nullable)
//   type: text (not null)
//   quantity: numeric (not null, default: 0)
//   unit: text (not null, default: 'kg'::text)
//   notes: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   user_id: uuid (not null, default: auth.uid())
//   factory_id: uuid (nullable)
//   vehicle_plate: text (nullable)
//   invoice_weight: numeric (nullable)
// Table: returns
//   id: uuid (not null, default: gen_random_uuid())
//   created_at: timestamp with time zone (nullable, default: now())
//   date: date (not null)
//   supplier: text (not null)
//   quantity: numeric (not null)
//   description: text (not null)
//   value: numeric (not null)
//   factory_id: uuid (not null)
//   user_id: uuid (not null)
//   outbound_freight: numeric (not null, default: 0)
//   return_freight: numeric (not null, default: 0)
// Table: sebo_inventory_records
//   id: uuid (not null, default: gen_random_uuid())
//   factory_id: uuid (not null)
//   user_id: uuid (not null)
//   date: date (not null)
//   tank_number: text (nullable)
//   quantity_lt: numeric (nullable, default: 0)
//   quantity_kg: numeric (nullable, default: 0)
//   acidity: numeric (nullable)
//   moisture: numeric (nullable)
//   impurity: numeric (nullable)
//   soaps: numeric (nullable)
//   iodine: numeric (nullable)
//   label: text (nullable)
//   category: text (not null)
//   description: text (nullable)
//   created_at: timestamp with time zone (not null, default: timezone('utc'::text, now()))
//   updated_at: timestamp with time zone (not null, default: timezone('utc'::text, now()))
// Table: shipping
//   id: uuid (not null, default: gen_random_uuid())
//   date: timestamp with time zone (not null)
//   client: text (not null)
//   product: text (not null)
//   quantity: numeric (not null, default: 0)
//   unit_price: numeric (not null, default: 0)
//   doc_ref: text (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   user_id: uuid (not null, default: auth.uid())
//   factory_id: uuid (nullable)
// Table: steam_control_records
//   id: uuid (not null, default: gen_random_uuid())
//   date: date (not null)
//   soy_waste: numeric (nullable, default: 0)
//   firewood: numeric (nullable, default: 0)
//   rice_husk: numeric (nullable, default: 0)
//   wood_chips: numeric (nullable, default: 0)
//   steam_consumption: numeric (nullable, default: 0)
//   factory_id: uuid (not null)
//   user_id: uuid (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   meter_start: numeric (nullable, default: 0)
//   meter_end: numeric (nullable, default: 0)
//   weight_kg: numeric (nullable, default: 0)
//   package_count: numeric (nullable, default: 0)
//   volume_m3: numeric (nullable, default: 0)
//   supplier: text (nullable)
//   value: numeric (nullable, default: 0)
// Table: stock_balance_records
//   id: uuid (not null, default: gen_random_uuid())
//   factory_id: uuid (not null)
//   product_code: text (not null)
//   description: text (not null)
//   weight_kg: numeric (not null, default: 0)
//   quantity_units: integer (not null, default: 0)
//   is_filial_row: boolean (not null, default: false)
//   user_id: uuid (nullable)
//   updated_at: timestamp with time zone (not null, default: now())

// --- CONSTRAINTS ---
// Table: acidity_records
//   FOREIGN KEY acidity_records_factory_id_fkey: FOREIGN KEY (factory_id) REFERENCES factories(id)
//   PRIMARY KEY acidity_records_pkey: PRIMARY KEY (id)
// Table: boiler_control_records
//   UNIQUE boiler_control_records_date_factory_id_key: UNIQUE (date, factory_id)
//   FOREIGN KEY boiler_control_records_factory_id_fkey: FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE
//   PRIMARY KEY boiler_control_records_pkey: PRIMARY KEY (id)
//   FOREIGN KEY boiler_control_records_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id)
// Table: cooking_time_records
//   FOREIGN KEY cooking_time_records_factory_id_fkey: FOREIGN KEY (factory_id) REFERENCES factories(id)
//   PRIMARY KEY cooking_time_records_pkey: PRIMARY KEY (id)
//   FOREIGN KEY cooking_time_records_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id)
// Table: daily_production_forecasts
//   UNIQUE daily_production_forecasts_factory_id_date_material_type_key: UNIQUE (factory_id, date, material_type)
//   FOREIGN KEY daily_production_forecasts_factory_id_fkey: FOREIGN KEY (factory_id) REFERENCES factories(id)
//   PRIMARY KEY daily_production_forecasts_pkey: PRIMARY KEY (id)
//   FOREIGN KEY daily_production_forecasts_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id)
// Table: digester_records
//   FOREIGN KEY digester_records_factory_id_fkey: FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE
//   PRIMARY KEY digester_records_pkey: PRIMARY KEY (id)
//   FOREIGN KEY digester_records_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id)
// Table: downtime_records
//   FOREIGN KEY downtime_records_factory_id_fkey: FOREIGN KEY (factory_id) REFERENCES factories(id)
//   PRIMARY KEY downtime_records_pkey: PRIMARY KEY (id)
//   FOREIGN KEY downtime_records_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id)
// Table: factories
//   PRIMARY KEY factories_pkey: PRIMARY KEY (id)
// Table: integration_configs
//   PRIMARY KEY integration_configs_pkey: PRIMARY KEY (id)
// Table: notification_settings
//   PRIMARY KEY notification_settings_pkey: PRIMARY KEY (id)
// Table: production
//   FOREIGN KEY production_factory_id_fkey: FOREIGN KEY (factory_id) REFERENCES factories(id)
//   PRIMARY KEY production_pkey: PRIMARY KEY (id)
// Table: quality_records
//   FOREIGN KEY quality_records_factory_id_fkey: FOREIGN KEY (factory_id) REFERENCES factories(id)
//   PRIMARY KEY quality_records_pkey: PRIMARY KEY (id)
// Table: raw_materials
//   FOREIGN KEY raw_materials_factory_id_fkey: FOREIGN KEY (factory_id) REFERENCES factories(id)
//   PRIMARY KEY raw_materials_pkey: PRIMARY KEY (id)
// Table: returns
//   FOREIGN KEY returns_factory_id_fkey: FOREIGN KEY (factory_id) REFERENCES factories(id)
//   PRIMARY KEY returns_pkey: PRIMARY KEY (id)
//   FOREIGN KEY returns_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id)
// Table: sebo_inventory_records
//   CHECK sebo_inventory_records_category_check: CHECK ((category = ANY (ARRAY['tank'::text, 'extra'::text, 'Sebo'::text, 'Óleo'::text, 'Farinha de Sangue'::text, 'Farinha de Penas'::text, 'Torta de Carne'::text, 'Farinha de Vísceras'::text, 'Farinha de Peixe'::text])))
//   FOREIGN KEY sebo_inventory_records_factory_id_fkey: FOREIGN KEY (factory_id) REFERENCES factories(id)
//   PRIMARY KEY sebo_inventory_records_pkey: PRIMARY KEY (id)
//   FOREIGN KEY sebo_inventory_records_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id)
// Table: shipping
//   FOREIGN KEY shipping_factory_id_fkey: FOREIGN KEY (factory_id) REFERENCES factories(id)
//   PRIMARY KEY shipping_pkey: PRIMARY KEY (id)
// Table: steam_control_records
//   UNIQUE steam_control_records_date_factory_id_key: UNIQUE (date, factory_id)
//   FOREIGN KEY steam_control_records_factory_id_fkey: FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE
//   PRIMARY KEY steam_control_records_pkey: PRIMARY KEY (id)
//   FOREIGN KEY steam_control_records_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id)
// Table: stock_balance_records
//   FOREIGN KEY stock_balance_records_factory_id_fkey: FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE
//   PRIMARY KEY stock_balance_records_pkey: PRIMARY KEY (id)
//   FOREIGN KEY stock_balance_records_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id)

// --- ROW LEVEL SECURITY POLICIES ---
// Table: acidity_records
//   Policy "Enable delete access for authenticated users" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable insert access for authenticated users" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Enable read access for authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable update access for authenticated users" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable write access for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "Users can manage their own acidity records" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
// Table: boiler_control_records
//   Policy "Enable all for authenticated users on boiler control" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: cooking_time_records
//   Policy "Enable all for authenticated users based on factory access" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
//   Policy "Enable delete access for authenticated users" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable insert access for authenticated users" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Enable read access for authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable update access for authenticated users" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable write access for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: daily_production_forecasts
//   Policy "Users can manage their own forecasts" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
// Table: digester_records
//   Policy "Enable all for authenticated users on digester records" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: downtime_records
//   Policy "Enable all for authenticated users based on factory access" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
//   Policy "Enable delete access for authenticated users" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable insert access for authenticated users" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Enable read access for authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable update access for authenticated users" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable write access for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: factories
//   Policy "Enable read access for authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//   Policy "Users can delete own factories" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//   Policy "Users can insert own factories" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (auth.uid() = user_id)
//   Policy "Users can manage their own factories" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
//   Policy "Users can update own factories" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//   Policy "Users can view own factories" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
// Table: integration_configs
//   Policy "Users can manage their own integration configs" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
// Table: notification_settings
//   Policy "Users can manage their own notification settings" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
// Table: production
//   Policy "Enable delete access for authenticated users" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable insert access for authenticated users" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Enable read access for authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable update access for authenticated users" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable write access for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "Users can manage their own production" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
// Table: quality_records
//   Policy "Enable delete access for authenticated users" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable insert access for authenticated users" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Enable read access for authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable update access for authenticated users" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable write access for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "Users can manage their own quality records" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
// Table: raw_materials
//   Policy "Enable all access for authenticated users" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
//   Policy "Enable delete access for authenticated users" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable insert access for authenticated users" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Enable read access for authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable update access for authenticated users" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable write access for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "Users can manage their own raw materials" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
// Table: returns
//   Policy "Enable delete for users based on user_id" (DELETE, PERMISSIVE) roles={public}
//     USING: (auth.uid() = user_id)
//   Policy "Enable insert for authenticated users" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (auth.uid() = user_id)
//   Policy "Enable read access for authenticated users" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
//   Policy "Enable update for users based on user_id" (UPDATE, PERMISSIVE) roles={public}
//     USING: (auth.uid() = user_id)
// Table: sebo_inventory_records
//   Policy "Enable all for authenticated users" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
//   Policy "Enable delete access for authenticated users" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable insert access for authenticated users" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Enable read access for authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable update access for authenticated users" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable write access for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: shipping
//   Policy "Enable delete access for authenticated users" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable insert access for authenticated users" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Enable read access for authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable update access for authenticated users" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable write access for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "Users can manage their own shipping" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
// Table: steam_control_records
//   Policy "Enable delete access for authenticated users" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable insert access for authenticated users" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Enable read access for authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable update access for authenticated users" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable write access for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: stock_balance_records
//   Policy "Enable delete access for authenticated users" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable insert access for authenticated users" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Enable read access for authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable update access for authenticated users" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true

// --- DATABASE FUNCTIONS ---
// FUNCTION check_production_yields()
//   CREATE OR REPLACE FUNCTION public.check_production_yields()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       settings RECORD;
//       sebo_yield NUMERIC := 0;
//       fco_yield NUMERIC := 0;
//       farinheta_yield NUMERIC := 0;
//       total_yield NUMERIC := 0;
//       mp NUMERIC := 0;
//       payload JSONB;
//       violation_found BOOLEAN := FALSE;
//   BEGIN
//       -- Get MP Used (avoid division by zero)
//       mp := COALESCE(NEW.mp_used, 0);
//       IF mp <= 0 THEN
//           RETURN NEW;
//       END IF;
//   
//       -- Calculate Yields
//       sebo_yield := (COALESCE(NEW.sebo_produced, 0) / mp) * 100;
//       fco_yield := (COALESCE(NEW.fco_produced, 0) / mp) * 100;
//       farinheta_yield := (COALESCE(NEW.farinheta_produced, 0) / mp) * 100;
//       total_yield := ((COALESCE(NEW.sebo_produced, 0) + COALESCE(NEW.fco_produced, 0) + COALESCE(NEW.farinheta_produced, 0)) / mp) * 100;
//   
//       -- Get Notification Settings for the User
//       SELECT * INTO settings FROM notification_settings WHERE user_id = NEW.user_id LIMIT 1;
//   
//       -- If no settings or everything disabled, exit
//       IF NOT FOUND THEN
//           RETURN NEW;
//       END IF;
//   
//       -- Check Thresholds (Only if threshold is set > 0)
//       IF (settings.sebo_threshold > 0 AND sebo_yield < settings.sebo_threshold) OR
//          (settings.fco_threshold > 0 AND fco_yield < settings.fco_threshold) OR
//          (settings.farinheta_threshold > 0 AND farinheta_yield < settings.farinheta_threshold) OR
//          (settings.yield_threshold > 0 AND total_yield < settings.yield_threshold) THEN
//           violation_found := TRUE;
//       END IF;
//   
//       -- If violation found, trigger Edge Function via pg_net
//       IF violation_found THEN
//           payload := jsonb_build_object(
//               'productionData', row_to_json(NEW),
//               'user_id', NEW.user_id,
//               'source', 'database_trigger'
//           );
//   
//           -- Perform HTTP POST to the Edge Function
//           -- Note: The URL is specific to this project context
//           PERFORM net.http_post(
//               url := 'https://cbmpujaahiqcehapnboj.supabase.co/functions/v1/send-brevo-alert',
//               body := payload,
//               headers := '{"Content-Type": "application/json"}'::jsonb
//           );
//       END IF;
//   
//       RETURN NEW;
//   END;
//   $function$
//   

// --- TRIGGERS ---
// Table: production
//   trg_check_yield_on_production: CREATE TRIGGER trg_check_yield_on_production AFTER INSERT OR UPDATE ON public.production FOR EACH ROW EXECUTE FUNCTION check_production_yields()

// --- INDEXES ---
// Table: acidity_records
//   CREATE INDEX idx_acidity_records_factory_id ON public.acidity_records USING btree (factory_id)
// Table: boiler_control_records
//   CREATE UNIQUE INDEX boiler_control_records_date_factory_id_key ON public.boiler_control_records USING btree (date, factory_id)
// Table: cooking_time_records
//   CREATE INDEX idx_cooking_time_date_factory ON public.cooking_time_records USING btree (date, factory_id)
// Table: daily_production_forecasts
//   CREATE UNIQUE INDEX daily_production_forecasts_factory_id_date_material_type_key ON public.daily_production_forecasts USING btree (factory_id, date, material_type)
// Table: downtime_records
//   CREATE INDEX idx_downtime_date_factory ON public.downtime_records USING btree (date, factory_id)
// Table: integration_configs
//   CREATE INDEX idx_integration_configs_user_id ON public.integration_configs USING btree (user_id)
// Table: notification_settings
//   CREATE INDEX idx_notification_settings_user_id ON public.notification_settings USING btree (user_id)
// Table: production
//   CREATE INDEX idx_production_factory_id ON public.production USING btree (factory_id)
// Table: quality_records
//   CREATE INDEX idx_quality_records_factory_id ON public.quality_records USING btree (factory_id)
// Table: raw_materials
//   CREATE INDEX idx_raw_materials_factory_id ON public.raw_materials USING btree (factory_id)
// Table: sebo_inventory_records
//   CREATE INDEX idx_sebo_inventory_date_factory ON public.sebo_inventory_records USING btree (date, factory_id)
// Table: shipping
//   CREATE INDEX idx_shipping_factory_id ON public.shipping USING btree (factory_id)
// Table: steam_control_records
//   CREATE UNIQUE INDEX steam_control_records_date_factory_id_key ON public.steam_control_records USING btree (date, factory_id)

