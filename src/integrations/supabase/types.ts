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
      analytics_events: {
        Row: {
          created_at: string
          device_type: string | null
          event_type: string
          id: number
          ip_hash: string | null
          metadata: Json | null
          path: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          event_type: string
          id?: number
          ip_hash?: string | null
          metadata?: Json | null
          path?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          device_type?: string | null
          event_type?: string
          id?: number
          ip_hash?: string | null
          metadata?: Json | null
          path?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          color: string | null
          created_at: string
          credential_id: string | null
          credential_url: string | null
          dark_color: string | null
          description: string
          id: number
          image: string | null
          issuer: string
          order_index: number
          title: string
          year: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          dark_color?: string | null
          description?: string
          id?: number
          image?: string | null
          issuer: string
          order_index?: number
          title: string
          year?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          dark_color?: string | null
          description?: string
          id?: number
          image?: string | null
          issuer?: string
          order_index?: number
          title?: string
          year?: string
        }
        Relationships: []
      }
      chatbot_knowledge: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: number
          order_index: number
          question: string
          trigger_keywords: string
        }
        Insert: {
          answer: string
          category: string
          created_at?: string
          id?: number
          order_index?: number
          question: string
          trigger_keywords?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: number
          order_index?: number
          question?: string
          trigger_keywords?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          estimated_budget: string | null
          id: number
          message: string
          name: string
          phone: string | null
          project_type: string | null
          source: string
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          estimated_budget?: string | null
          id?: number
          message: string
          name: string
          phone?: string | null
          project_type?: string | null
          source?: string
          status?: string
          subject?: string
        }
        Update: {
          created_at?: string
          email?: string
          estimated_budget?: string | null
          id?: number
          message?: string
          name?: string
          phone?: string | null
          project_type?: string | null
          source?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          achievements: string[]
          company_or_school: string
          created_at: string
          description: string
          icon: string | null
          id: number
          location: string | null
          order_index: number
          period: string
          technologies: string[]
          title: string
          type: string
        }
        Insert: {
          achievements?: string[]
          company_or_school: string
          created_at?: string
          description?: string
          icon?: string | null
          id?: number
          location?: string | null
          order_index?: number
          period?: string
          technologies?: string[]
          title: string
          type?: string
        }
        Update: {
          achievements?: string[]
          company_or_school?: string
          created_at?: string
          description?: string
          icon?: string | null
          id?: number
          location?: string | null
          order_index?: number
          period?: string
          technologies?: string[]
          title?: string
          type?: string
        }
        Relationships: []
      }
      profile: {
        Row: {
          about_philosophy: string | null
          about_story: string | null
          available_for_hire: boolean
          avatar_url: string | null
          bio: string | null
          discord: string | null
          email: string | null
          github: string | null
          happy_clients: string | null
          id: number
          linkedin: string | null
          location: string | null
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          name: string
          phone: string | null
          projects_completed: string | null
          resume_url: string | null
          satisfaction_rate: string | null
          tagline: string | null
          titles: string[]
          twitter: string | null
          updated_at: string
          whatsapp: string | null
          years_experience: string | null
        }
        Insert: {
          about_philosophy?: string | null
          about_story?: string | null
          available_for_hire?: boolean
          avatar_url?: string | null
          bio?: string | null
          discord?: string | null
          email?: string | null
          github?: string | null
          happy_clients?: string | null
          id: number
          linkedin?: string | null
          location?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          name: string
          phone?: string | null
          projects_completed?: string | null
          resume_url?: string | null
          satisfaction_rate?: string | null
          tagline?: string | null
          titles?: string[]
          twitter?: string | null
          updated_at?: string
          whatsapp?: string | null
          years_experience?: string | null
        }
        Update: {
          about_philosophy?: string | null
          about_story?: string | null
          available_for_hire?: boolean
          avatar_url?: string | null
          bio?: string | null
          discord?: string | null
          email?: string | null
          github?: string | null
          happy_clients?: string | null
          id?: number
          linkedin?: string | null
          location?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          name?: string
          phone?: string | null
          projects_completed?: string | null
          resume_url?: string | null
          satisfaction_rate?: string | null
          tagline?: string | null
          titles?: string[]
          twitter?: string | null
          updated_at?: string
          whatsapp?: string | null
          years_experience?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          category: string
          challenges: string | null
          created_at: string
          featured: boolean
          full_description: string
          gallery_images: string[]
          github_url: string | null
          id: number
          image: string
          likes: number
          live_url: string | null
          order_index: number
          outcomes: string | null
          short_description: string
          solutions: string | null
          technologies: string[]
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          category: string
          challenges?: string | null
          created_at?: string
          featured?: boolean
          full_description?: string
          gallery_images?: string[]
          github_url?: string | null
          id?: number
          image?: string
          likes?: number
          live_url?: string | null
          order_index?: number
          outcomes?: string | null
          short_description?: string
          solutions?: string | null
          technologies?: string[]
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          category?: string
          challenges?: string | null
          created_at?: string
          featured?: boolean
          full_description?: string
          gallery_images?: string[]
          github_url?: string | null
          id?: number
          image?: string
          likes?: number
          live_url?: string | null
          order_index?: number
          outcomes?: string | null
          short_description?: string
          solutions?: string | null
          technologies?: string[]
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string
          features: string[]
          icon: string
          id: number
          order_index: number
          starting_price: string | null
          timeline_estimate: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          features?: string[]
          icon?: string
          id?: number
          order_index?: number
          starting_price?: string | null
          timeline_estimate?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          features?: string[]
          icon?: string
          id?: number
          order_index?: number
          starting_price?: string | null
          timeline_estimate?: string | null
          title?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string
          color: string | null
          created_at: string
          featured: boolean
          icon: string | null
          id: number
          level: string
          name: string
          order_index: number
          percentage: number
          years_experience: string | null
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string
          featured?: boolean
          icon?: string | null
          id?: number
          level?: string
          name: string
          order_index?: number
          percentage?: number
          years_experience?: string | null
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string
          featured?: boolean
          icon?: string | null
          id?: number
          level?: string
          name?: string
          order_index?: number
          percentage?: number
          years_experience?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar: string | null
          company: string
          created_at: string
          id: number
          is_featured: boolean
          name: string
          project_name: string | null
          rating: number
          role: string
          status: string
          text: string
        }
        Insert: {
          avatar?: string | null
          company?: string
          created_at?: string
          id?: number
          is_featured?: boolean
          name: string
          project_name?: string | null
          rating?: number
          role?: string
          status?: string
          text: string
        }
        Update: {
          avatar?: string | null
          company?: string
          created_at?: string
          id?: number
          is_featured?: boolean
          name?: string
          project_name?: string | null
          rating?: number
          role?: string
          status?: string
          text?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_project_like: { Args: { _project_id: number }; Returns: number }
      increment_project_view: { Args: { _project_id: number }; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      resync_identity: { Args: { _table: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin"
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
    Enums: {
      app_role: ["admin"],
    },
  },
} as const
