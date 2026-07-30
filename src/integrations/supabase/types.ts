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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      budgets: {
        Row: {
          category: string
          company_id: string
          created_at: string
          id: string
          limit_amount: number
          month_ref: string
          updated_at: string
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string
          id?: string
          limit_amount?: number
          month_ref?: string
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          id?: string
          limit_amount?: number
          month_ref?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          segment: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          segment?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          segment?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          company_id: string
          created_at: string
          description: string
          id: string
          spent_on: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string | null
          company_id: string
          created_at?: string
          description?: string
          id?: string
          spent_on?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          spent_on?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payables: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          due_on: string
          id: string
          notes: string | null
          status: string
          supplier: string
          updated_at: string
        }
        Insert: {
          amount?: number
          company_id: string
          created_at?: string
          due_on?: string
          id?: string
          notes?: string | null
          status?: string
          supplier: string
          updated_at?: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          due_on?: string
          id?: string
          notes?: string | null
          status?: string
          supplier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payables_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category: string | null
          company_id: string
          cost: number | null
          created_at: string
          id: string
          kind: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          company_id: string
          cost?: number | null
          created_at?: string
          id?: string
          kind?: string
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          company_id?: string
          cost?: number | null
          created_at?: string
          id?: string
          kind?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          updated_at?: string
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
      receivables: {
        Row: {
          amount: number
          client_id: string | null
          client_name: string
          company_id: string
          created_at: string
          due_on: string
          id: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          client_id?: string | null
          client_name: string
          company_id: string
          created_at?: string
          due_on?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          client_name?: string
          company_id?: string
          created_at?: string
          due_on?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receivables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          company_id: string
          created_at: string
          done: boolean
          due_on: string
          id: string
          kind: string
          notes: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          done?: boolean
          due_on?: string
          id?: string
          kind?: string
          notes?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          done?: boolean
          due_on?: string
          id?: string
          kind?: string
          notes?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          client_id: string | null
          client_name: string | null
          company_id: string
          created_at: string
          id: string
          payment_method: string | null
          product_id: string | null
          product_name: string
          quantity: number
          sold_on: string
          status: string
          total_amount: number
          unit_amount: number
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          client_name?: string | null
          company_id: string
          created_at?: string
          id?: string
          payment_method?: string | null
          product_id?: string | null
          product_name: string
          quantity?: number
          sold_on?: string
          status?: string
          total_amount?: number
          unit_amount?: number
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          client_name?: string | null
          company_id?: string
          created_at?: string
          id?: string
          payment_method?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          sold_on?: string
          status?: string
          total_amount?: number
          unit_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          company_id: string
          created_at: string
          description: string
          id: string
          kind: string
          notes: string | null
          occurred_on: string
          payment_method: string | null
          source_id: string | null
          source_type: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string | null
          company_id: string
          created_at?: string
          description?: string
          id?: string
          kind: string
          notes?: string | null
          occurred_on?: string
          payment_method?: string | null
          source_id?: string | null
          source_type?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          kind?: string
          notes?: string | null
          occurred_on?: string
          payment_method?: string | null
          source_id?: string | null
          source_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_company_id: { Args: never; Returns: string }
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
