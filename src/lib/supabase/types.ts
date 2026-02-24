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
          notes: string | null
          quantity: number
          supplier: string | null
          type: string
          unit: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          factory_id?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          supplier?: string | null
          type: string
          unit?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          date?: string
          factory_id?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          supplier?: string | null
          type?: string
          unit?: string
          user_id?: string
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
          quantity: number
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
          quantity: number
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
          quantity?: number
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
// This section contains constraints, RLS policies, functions, triggers,
// indexes and materialized views not present in the type definitions above.

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

