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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      certifications: {
        Row: {
          created_at: string | null
          credential_url: string | null
          date: string
          display_order: number | null
          expiration_date: string | null
          id: string
          image_url: string | null
          issuer: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credential_url?: string | null
          date: string
          display_order?: number | null
          expiration_date?: string | null
          id?: string
          image_url?: string | null
          issuer: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          credential_url?: string | null
          date?: string
          display_order?: number | null
          expiration_date?: string | null
          id?: string
          image_url?: string | null
          issuer?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      documentation: {
        Row: {
          category: string | null
          created_at: string | null
          description: string
          display_order: number | null
          id: string
          title: string
          url: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description: string
          display_order?: number | null
          id?: string
          title: string
          url: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string
          display_order?: number | null
          id?: string
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      experience: {
        Row: {
          company: string
          created_at: string
          description: string[] | null
          display_order: number | null
          end_date: string | null
          id: string
          is_current: boolean | null
          location: string | null
          skills: string[] | null
          start_date: string
          title: string
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string
          description?: string[] | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          skills?: string[] | null
          start_date: string
          title: string
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string
          description?: string[] | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          skills?: string[] | null
          start_date?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      github_content: {
        Row: {
          content_text: string | null
          created_at: string | null
          github_url: string
          id: string
          indexed_at: string | null
          repo_name: string | null
          source_id: string
          source_type: string
          updated_at: string | null
        }
        Insert: {
          content_text?: string | null
          created_at?: string | null
          github_url: string
          id?: string
          indexed_at?: string | null
          repo_name?: string | null
          source_id: string
          source_type: string
          updated_at?: string | null
        }
        Update: {
          content_text?: string | null
          created_at?: string | null
          github_url?: string
          id?: string
          indexed_at?: string | null
          repo_name?: string | null
          source_id?: string
          source_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      known_login_locations: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          first_seen_at: string
          id: string
          ip_address: string
          is_trusted: boolean
          last_seen_at: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          times_seen: number
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          first_seen_at?: string
          id?: string
          ip_address: string
          is_trusted?: boolean
          last_seen_at?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          times_seen?: number
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          first_seen_at?: string
          id?: string
          ip_address?: string
          is_trusted?: boolean
          last_seen_at?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          times_seen?: number
        }
        Relationships: []
      }
      llm_projects: {
        Row: {
          created_at: string
          demo_url: string | null
          description: string
          display_order: number | null
          documentation_url: string | null
          github_url: string | null
          id: string
          llm_provider: string | null
          project_type: string | null
          technologies: string[] | null
          title: string
          use_case: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          demo_url?: string | null
          description: string
          display_order?: number | null
          documentation_url?: string | null
          github_url?: string | null
          id?: string
          llm_provider?: string | null
          project_type?: string | null
          technologies?: string[] | null
          title: string
          use_case?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          demo_url?: string | null
          description?: string
          display_order?: number | null
          documentation_url?: string | null
          github_url?: string | null
          id?: string
          llm_provider?: string | null
          project_type?: string | null
          technologies?: string[] | null
          title?: string
          use_case?: string | null
          user_id?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      ml_models: {
        Row: {
          created_at: string
          dataset: string | null
          demo_url: string | null
          description: string
          display_order: number | null
          framework: string | null
          github_url: string | null
          id: string
          image_url: string | null
          metrics: Json | null
          model_type: string | null
          paper_url: string | null
          technologies: string[] | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dataset?: string | null
          demo_url?: string | null
          description: string
          display_order?: number | null
          framework?: string | null
          github_url?: string | null
          id?: string
          image_url?: string | null
          metrics?: Json | null
          model_type?: string | null
          paper_url?: string | null
          technologies?: string[] | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          dataset?: string | null
          demo_url?: string | null
          description?: string
          display_order?: number | null
          framework?: string | null
          github_url?: string | null
          id?: string
          image_url?: string | null
          metrics?: Json | null
          model_type?: string | null
          paper_url?: string | null
          technologies?: string[] | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          full_name: string
          github_url: string | null
          id: string
          linkedin_url: string | null
          major: string | null
          minor: string | null
          profile_image_url: string | null
          resume_url: string | null
          university: string | null
          university_logo_url: string | null
          updated_at: string | null
          years: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          full_name: string
          github_url?: string | null
          id: string
          linkedin_url?: string | null
          major?: string | null
          minor?: string | null
          profile_image_url?: string | null
          resume_url?: string | null
          university?: string | null
          university_logo_url?: string | null
          updated_at?: string | null
          years?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          full_name?: string
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          major?: string | null
          minor?: string | null
          profile_image_url?: string | null
          resume_url?: string | null
          university?: string | null
          university_logo_url?: string | null
          updated_at?: string | null
          years?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          category: string | null
          created_at: string | null
          description: string
          display_order: number | null
          end_date: string | null
          github_url: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          live_url: string | null
          start_date: string | null
          technologies: string[] | null
          title: string
          user_id: string
          youtube_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description: string
          display_order?: number | null
          end_date?: string | null
          github_url?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          live_url?: string | null
          start_date?: string | null
          technologies?: string[] | null
          title: string
          user_id: string
          youtube_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string
          display_order?: number | null
          end_date?: string | null
          github_url?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          live_url?: string | null
          start_date?: string | null
          technologies?: string[] | null
          title?: string
          user_id?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      resume_analytics: {
        Row: {
          created_at: string
          event_type: string
          id: string
          referrer: string | null
          user_agent: string | null
          viewer_ip: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          referrer?: string | null
          user_agent?: string | null
          viewer_ip?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          referrer?: string | null
          user_agent?: string | null
          viewer_ip?: string | null
        }
        Relationships: []
      }
      resumes: {
        Row: {
          created_at: string
          display_order: number | null
          file_url: string
          id: string
          is_primary: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          file_url: string
          id?: string
          is_primary?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          file_url?: string
          id?: string
          is_primary?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      risk_score_history: {
        Row: {
          created_at: string
          factors: string[] | null
          id: string
          login_attempts_failed: number | null
          login_attempts_total: number | null
          recommendation: string | null
          risk_level: string
          risk_score: number
          summary: string | null
          threats_count: number | null
          threats_high_severity: number | null
        }
        Insert: {
          created_at?: string
          factors?: string[] | null
          id?: string
          login_attempts_failed?: number | null
          login_attempts_total?: number | null
          recommendation?: string | null
          risk_level: string
          risk_score: number
          summary?: string | null
          threats_count?: number | null
          threats_high_severity?: number | null
        }
        Update: {
          created_at?: string
          factors?: string[] | null
          id?: string
          login_attempts_failed?: number | null
          login_attempts_total?: number | null
          recommendation?: string | null
          risk_level?: string
          risk_score?: number
          summary?: string | null
          threats_count?: number | null
          threats_high_severity?: number | null
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          level: string | null
          link: string | null
          name: string
          project_links: Json | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          level?: string | null
          link?: string | null
          name: string
          project_links?: Json | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          level?: string | null
          link?: string | null
          name?: string
          project_links?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitor_activity: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string
          email: string | null
          id: string
          ip_address: string | null
          session_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          session_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          session_id?: string
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
      match_portfolio_content: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content_id: string
          content_text: string
          content_type: string
          similarity: number
        }[]
      }
    }
    Enums: {
      app_role: "owner" | "viewer"
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
      app_role: ["owner", "viewer"],
    },
  },
} as const
