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
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: []
      }
      ai_generations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_used: boolean
          model: string | null
          prompt: string | null
          result: Json | null
          status: string
          type: string
          usage: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_used?: boolean
          model?: string | null
          prompt?: string | null
          result?: Json | null
          status?: string
          type: string
          usage?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_used?: boolean
          model?: string | null
          prompt?: string | null
          result?: Json | null
          status?: string
          type?: string
          usage?: Json | null
        }
        Relationships: []
      }
      card_section_items: {
        Row: {
          card_section_id: string
          created_at: string
          custom_description: string | null
          custom_title: string | null
          id: string
          is_suggestion: boolean
          position: number
          price: number
          recipe_id: string | null
          technical_sheet_id: string | null
        }
        Insert: {
          card_section_id: string
          created_at?: string
          custom_description?: string | null
          custom_title?: string | null
          id?: string
          is_suggestion?: boolean
          position: number
          price?: number
          recipe_id?: string | null
          technical_sheet_id?: string | null
        }
        Update: {
          card_section_id?: string
          created_at?: string
          custom_description?: string | null
          custom_title?: string | null
          id?: string
          is_suggestion?: boolean
          position?: number
          price?: number
          recipe_id?: string | null
          technical_sheet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_section_items_card_section_id_fkey"
            columns: ["card_section_id"]
            isOneToOne: false
            referencedRelation: "card_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_section_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_section_items_technical_sheet_id_fkey"
            columns: ["technical_sheet_id"]
            isOneToOne: false
            referencedRelation: "technical_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      card_sections: {
        Row: {
          card_id: string
          created_at: string
          description: string | null
          id: string
          position: number
          title: string
        }
        Insert: {
          card_id: string
          created_at?: string
          description?: string | null
          id?: string
          position: number
          title: string
        }
        Update: {
          card_id?: string
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_sections_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_balanced: boolean
          is_published: boolean
          season: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_balanced?: boolean
          is_published?: boolean
          season?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_balanced?: boolean
          is_published?: boolean
          season?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_email: string | null
          author_name: string
          content: string
          created_at: string
          id: string
          is_approved: boolean
          is_public: boolean
          mission_id: string | null
          rating: number | null
          recipe_id: string | null
          response: string | null
          source: string | null
          updated_at: string
        }
        Insert: {
          author_email?: string | null
          author_name: string
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean
          is_public?: boolean
          mission_id?: string | null
          rating?: number | null
          recipe_id?: string | null
          response?: string | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          author_email?: string | null
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          is_public?: boolean
          mission_id?: string | null
          rating?: number | null
          recipe_id?: string | null
          response?: string | null
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          phone: string | null
          replied_at: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone?: string | null
          replied_at?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone?: string | null
          replied_at?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      haccp_records: {
        Row: {
          checklist_items: Json
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          notes: string | null
          responsible_person: string | null
          status: string
          temperature: number | null
          temperature_max: number | null
          temperature_min: number | null
          title: string
          type: string
          updated_at: string
          zone: string | null
        }
        Insert: {
          checklist_items?: Json
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          responsible_person?: string | null
          status?: string
          temperature?: number | null
          temperature_max?: number | null
          temperature_min?: number | null
          title: string
          type?: string
          updated_at?: string
          zone?: string | null
        }
        Update: {
          checklist_items?: Json
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          responsible_person?: string | null
          status?: string
          temperature?: number | null
          temperature_max?: number | null
          temperature_min?: number | null
          title?: string
          type?: string
          updated_at?: string
          zone?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          created_at: string
          custom_description: string | null
          custom_title: string | null
          id: string
          item_type: string | null
          menu_id: string
          position: number
          recipe_id: string | null
          technical_sheet_id: string | null
        }
        Insert: {
          created_at?: string
          custom_description?: string | null
          custom_title?: string | null
          id?: string
          item_type?: string | null
          menu_id: string
          position: number
          recipe_id?: string | null
          technical_sheet_id?: string | null
        }
        Update: {
          created_at?: string
          custom_description?: string | null
          custom_title?: string | null
          id?: string
          item_type?: string | null
          menu_id?: string
          position?: number
          recipe_id?: string | null
          technical_sheet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_technical_sheet_id_fkey"
            columns: ["technical_sheet_id"]
            isOneToOne: false
            referencedRelation: "technical_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          avg_nutri_score: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_balanced: boolean
          is_published: boolean
          price: number
          season: string | null
          slug: string
          title: string
          total_calories: number
          updated_at: string
        }
        Insert: {
          avg_nutri_score?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_balanced?: boolean
          is_published?: boolean
          price?: number
          season?: string | null
          slug: string
          title: string
          total_calories?: number
          updated_at?: string
        }
        Update: {
          avg_nutri_score?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_balanced?: boolean
          is_published?: boolean
          price?: number
          season?: string | null
          slug?: string
          title?: string
          total_calories?: number
          updated_at?: string
        }
        Relationships: []
      }
      missions: {
        Row: {
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          daily_rate: number
          end_date: string | null
          id: string
          location: string | null
          notes: string | null
          start_date: string | null
          status: string
          title: string
          total_revenue: number
          type: string | null
          updated_at: string
        }
        Insert: {
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          daily_rate?: number
          end_date?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          start_date?: string | null
          status?: string
          title: string
          total_revenue?: number
          type?: string | null
          updated_at?: string
        }
        Update: {
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          daily_rate?: number
          end_date?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          start_date?: string | null
          status?: string
          title?: string
          total_revenue?: number
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          category: string
          client_name: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          is_published: boolean
          position: number
          project_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          client_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          position?: number
          project_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          client_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          position?: number
          project_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          hits: number
          key: string
          window_start: string
        }
        Insert: {
          hits?: number
          key: string
          window_start: string
        }
        Update: {
          hits?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          acides_gras_satures: number
          allergens: string[]
          calories: number
          cost: number
          created_at: string
          fibres: number
          glucides: number
          id: string
          lipides: number
          name: string
          proteines: number
          quantity: number
          recipe_id: string
          sel: number
          sucres: number
          unit: string
        }
        Insert: {
          acides_gras_satures?: number
          allergens?: string[]
          calories?: number
          cost?: number
          created_at?: string
          fibres?: number
          glucides?: number
          id?: string
          lipides?: number
          name: string
          proteines?: number
          quantity?: number
          recipe_id: string
          sel?: number
          sucres?: number
          unit?: string
        }
        Update: {
          acides_gras_satures?: number
          allergens?: string[]
          calories?: number
          cost?: number
          created_at?: string
          fibres?: number
          glucides?: number
          id?: string
          lipides?: number
          name?: string
          proteines?: number
          quantity?: number
          recipe_id?: string
          sel?: number
          sucres?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_steps: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          instruction: string
          recipe_id: string
          step_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          instruction: string
          recipe_id: string
          step_number: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          instruction?: string
          recipe_id?: string
          step_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_steps_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          acides_gras_satures: number
          calories_per_serving: number
          category: string
          cook_time: number
          cost_per_serving: number
          created_at: string
          description: string | null
          difficulty: string | null
          fibres: number
          fruits_legumes_pct: number
          glucides: number
          id: string
          image_url: string | null
          is_featured: boolean
          is_published: boolean
          lipides: number
          nutri_score: string | null
          plating: string | null
          portion_weight_g: number | null
          prep_time: number
          proteines: number
          season: string | null
          sel: number
          servings: number
          slug: string
          sucres: number
          title: string
          updated_at: string
        }
        Insert: {
          acides_gras_satures?: number
          calories_per_serving?: number
          category: string
          cook_time?: number
          cost_per_serving?: number
          created_at?: string
          description?: string | null
          difficulty?: string | null
          fibres?: number
          fruits_legumes_pct?: number
          glucides?: number
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          lipides?: number
          nutri_score?: string | null
          plating?: string | null
          portion_weight_g?: number | null
          prep_time?: number
          proteines?: number
          season?: string | null
          sel?: number
          servings?: number
          slug: string
          sucres?: number
          title: string
          updated_at?: string
        }
        Update: {
          acides_gras_satures?: number
          calories_per_serving?: number
          category?: string
          cook_time?: number
          cost_per_serving?: number
          created_at?: string
          description?: string | null
          difficulty?: string | null
          fibres?: number
          fruits_legumes_pct?: number
          glucides?: number
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          lipides?: number
          nutri_score?: string | null
          plating?: string | null
          portion_weight_g?: number | null
          prep_time?: number
          proteines?: number
          season?: string | null
          sel?: number
          servings?: number
          slug?: string
          sucres?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      revenues: {
        Row: {
          amount: number
          created_at: string
          date_received: string
          description: string | null
          id: string
          invoice_number: string | null
          mission_id: string | null
          payment_method: string | null
          source: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          date_received?: string
          description?: string | null
          id?: string
          invoice_number?: string | null
          mission_id?: string | null
          payment_method?: string | null
          source?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          date_received?: string
          description?: string | null
          id?: string
          invoice_number?: string | null
          mission_id?: string | null
          payment_method?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenues_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string
          created_at: string
          description: string | null
          features: Json
          id: string
          is_featured: boolean
          is_published: boolean
          position: number
          price: number | null
          price_unit: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_featured?: boolean
          is_published?: boolean
          position?: number
          price?: number | null
          price_unit?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_featured?: boolean
          is_published?: boolean
          position?: number
          price?: number | null
          price_unit?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          address: string
          banner_url: string | null
          created_at: string
          email: string
          facebook_url: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          logo_url: string | null
          phone: string
          seo_description: string
          seo_keywords: string
          seo_title: string
          singleton: boolean
          site_description: string
          site_name: string
          updated_at: string
        }
        Insert: {
          address?: string
          banner_url?: string | null
          created_at?: string
          email?: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          phone?: string
          seo_description?: string
          seo_keywords?: string
          seo_title?: string
          singleton?: boolean
          site_description?: string
          site_name?: string
          updated_at?: string
        }
        Update: {
          address?: string
          banner_url?: string | null
          created_at?: string
          email?: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          phone?: string
          seo_description?: string
          seo_keywords?: string
          seo_title?: string
          singleton?: boolean
          site_description?: string
          site_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      technical_sheet_ingredients: {
        Row: {
          acides_gras_satures: number
          allergens: string[]
          calories: number
          cost: number
          created_at: string
          fibres: number
          glucides: number
          id: string
          lipides: number
          name: string
          proteines: number
          quantity: number
          sel: number
          sucres: number
          technical_sheet_id: string
          unit: string
        }
        Insert: {
          acides_gras_satures?: number
          allergens?: string[]
          calories?: number
          cost?: number
          created_at?: string
          fibres?: number
          glucides?: number
          id?: string
          lipides?: number
          name: string
          proteines?: number
          quantity?: number
          sel?: number
          sucres?: number
          technical_sheet_id: string
          unit?: string
        }
        Update: {
          acides_gras_satures?: number
          allergens?: string[]
          calories?: number
          cost?: number
          created_at?: string
          fibres?: number
          glucides?: number
          id?: string
          lipides?: number
          name?: string
          proteines?: number
          quantity?: number
          sel?: number
          sucres?: number
          technical_sheet_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "technical_sheet_ingredients_technical_sheet_id_fkey"
            columns: ["technical_sheet_id"]
            isOneToOne: false
            referencedRelation: "technical_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_sheet_steps: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          instruction: string
          step_number: number
          technical_sheet_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          instruction: string
          step_number: number
          technical_sheet_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          instruction?: string
          step_number?: number
          technical_sheet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technical_sheet_steps_technical_sheet_id_fkey"
            columns: ["technical_sheet_id"]
            isOneToOne: false
            referencedRelation: "technical_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_sheets: {
        Row: {
          acides_gras_satures: number
          allergens: string[]
          calories_per_portion: number
          category: string
          cooking_time: number
          cost_per_portion: number
          created_at: string
          description: string | null
          fibres: number
          fruits_legumes_pct: number
          glucides: number
          id: string
          image_url: string | null
          is_published: boolean
          lipides: number
          margin_ratio: number
          nutri_score: string | null
          portion_weight_g: number | null
          portions: number
          preparation_time: number
          proteines: number
          sel: number
          selling_price: number
          slug: string
          sucres: number
          title: string
          total_cost: number
          updated_at: string
        }
        Insert: {
          acides_gras_satures?: number
          allergens?: string[]
          calories_per_portion?: number
          category: string
          cooking_time?: number
          cost_per_portion?: number
          created_at?: string
          description?: string | null
          fibres?: number
          fruits_legumes_pct?: number
          glucides?: number
          id?: string
          image_url?: string | null
          is_published?: boolean
          lipides?: number
          margin_ratio?: number
          nutri_score?: string | null
          portion_weight_g?: number | null
          portions?: number
          preparation_time?: number
          proteines?: number
          sel?: number
          selling_price?: number
          slug: string
          sucres?: number
          title: string
          total_cost?: number
          updated_at?: string
        }
        Update: {
          acides_gras_satures?: number
          allergens?: string[]
          calories_per_portion?: number
          category?: string
          cooking_time?: number
          cost_per_portion?: number
          created_at?: string
          description?: string | null
          fibres?: number
          fruits_legumes_pct?: number
          glucides?: number
          id?: string
          image_url?: string | null
          is_published?: boolean
          lipides?: number
          margin_ratio?: number
          nutri_score?: string | null
          portion_weight_g?: number | null
          portions?: number
          preparation_time?: number
          proteines?: number
          sel?: number
          selling_price?: number
          slug?: string
          sucres?: number
          title?: string
          total_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _insert_from_json: {
        Args: { p_data: Json; p_table: unknown }
        Returns: string
      }
      _replace_children: {
        Args: {
          p_fk: string
          p_parent: string
          p_position_col?: string
          p_rows: Json
          p_table: unknown
        }
        Returns: undefined
      }
      _update_from_json: {
        Args: { p_data: Json; p_id: string; p_table: unknown }
        Returns: undefined
      }
      _upsert_root: {
        Args: { p_data: Json; p_table: unknown }
        Returns: string
      }
      _writable_columns: {
        Args: { p_data: Json; p_table: unknown }
        Returns: string[]
      }
      consume_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
      dashboard_stats: { Args: never; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      save_card: { Args: { p_card: Json; p_sections: Json }; Returns: string }
      save_menu: { Args: { p_items: Json; p_menu: Json }; Returns: string }
      save_recipe: {
        Args: { p_ingredients: Json; p_recipe: Json; p_steps: Json }
        Returns: string
      }
      save_technical_sheet: {
        Args: { p_ingredients: Json; p_sheet: Json; p_steps: Json }
        Returns: string
      }
      slugify: { Args: { p_value: string }; Returns: string }
      unique_slug: {
        Args: { p_id: string; p_slug: string; p_table: unknown }
        Returns: string
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
