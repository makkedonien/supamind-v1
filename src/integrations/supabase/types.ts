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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      microcasts: {
        Row: {
          audio_expires_at: string | null
          audio_url: string | null
          created_at: string
          generation_status: string | null
          id: string
          source_ids: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_expires_at?: string | null
          audio_url?: string | null
          created_at?: string
          generation_status?: string | null
          id?: string
          source_ids?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_expires_at?: string | null
          audio_url?: string | null
          created_at?: string
          generation_status?: string | null
          id?: string
          source_ids?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "microcasts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      notebooks: {
        Row: {
          audio_overview_generation_status: string | null
          audio_overview_url: string | null
          audio_url_expires_at: string | null
          color: string | null
          created_at: string
          description: string | null
          example_questions: string[] | null
          generation_status: string | null
          icon: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_overview_generation_status?: string | null
          audio_overview_url?: string | null
          audio_url_expires_at?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          example_questions?: string[] | null
          generation_status?: string | null
          icon?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_overview_generation_status?: string | null
          audio_overview_url?: string | null
          audio_url_expires_at?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          example_questions?: string[] | null
          generation_status?: string | null
          icon?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notebooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          extracted_text: string | null
          id: string
          notebook_id: string
          source_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          extracted_text?: string | null
          id?: string
          notebook_id: string
          source_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          extracted_text?: string | null
          id?: string
          notebook_id?: string
          source_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "notebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      podcast_episodes: {
        Row: {
          assemblyai_transcription_id: string | null
          audio_duration: string | null
          audio_file_size: number | null
          audio_url: string | null
          content: string | null
          created_at: string
          file_path: string | null
          id: string
          link: string | null
          podcast_name: string
          processing_status: string | null
          pubdate: string
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assemblyai_transcription_id?: string | null
          audio_duration?: string | null
          audio_file_size?: number | null
          audio_url?: string | null
          content?: string | null
          created_at?: string
          file_path?: string | null
          id: string
          link?: string | null
          podcast_name: string
          processing_status?: string | null
          pubdate: string
          summary?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assemblyai_transcription_id?: string | null
          audio_duration?: string | null
          audio_file_size?: number | null
          audio_url?: string | null
          content?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          link?: string | null
          podcast_name?: string
          processing_status?: string | null
          pubdate?: string
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "podcast_episodes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          categorization_prompt: string | null
          created_at: string
          deep_dive_prompt: string | null
          email: string
          full_name: string | null
          id: string
          onboarding_completed_feed: boolean | null
          onboarding_completed_microcasts: boolean | null
          onboarding_completed_notebooks: boolean | null
          summary_prompt: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          categorization_prompt?: string | null
          created_at?: string
          deep_dive_prompt?: string | null
          email: string
          full_name?: string | null
          id: string
          onboarding_completed_feed?: boolean | null
          onboarding_completed_microcasts?: boolean | null
          onboarding_completed_notebooks?: boolean | null
          summary_prompt?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          categorization_prompt?: string | null
          created_at?: string
          deep_dive_prompt?: string | null
          email?: string
          full_name?: string | null
          id?: string
          onboarding_completed_feed?: boolean | null
          onboarding_completed_microcasts?: boolean | null
          onboarding_completed_notebooks?: boolean | null
          summary_prompt?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          category: string[] | null
          content: string | null
          created_at: string
          deep_summary: string | null
          display_name: string | null
          file_path: string | null
          file_size: number | null
          id: string
          image_url: string | null
          is_favorite: boolean
          metadata: Json | null
          notebook_id: string | null
          processing_status: string | null
          publisher_name: string | null
          short_description: string | null
          summary: string | null
          title: string
          type: Database["public"]["Enums"]["source_type"]
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          category?: string[] | null
          content?: string | null
          created_at?: string
          deep_summary?: string | null
          display_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          image_url?: string | null
          is_favorite?: boolean
          metadata?: Json | null
          notebook_id?: string | null
          processing_status?: string | null
          publisher_name?: string | null
          short_description?: string | null
          summary?: string | null
          title: string
          type: Database["public"]["Enums"]["source_type"]
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          category?: string[] | null
          content?: string | null
          created_at?: string
          deep_summary?: string | null
          display_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          image_url?: string | null
          is_favorite?: boolean
          metadata?: Json | null
          notebook_id?: string | null
          processing_status?: string | null
          publisher_name?: string | null
          short_description?: string | null
          summary?: string | null
          title?: string
          type?: Database["public"]["Enums"]["source_type"]
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sources_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "notebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_categories_user_id_fkey"
            columns: ["user_id"]
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
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      get_user_sources: {
        Args: { target_user_id: string }
        Returns: {
          content: string
          created_at: string
          file_path: string
          id: string
          notebook_id: string
          notebook_title: string
          processing_status: string
          summary: string
          title: string
          type: Database["public"]["Enums"]["source_type"]
          url: string
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_notebook_owner: {
        Args: { notebook_id_param: string }
        Returns: boolean
      }
      is_notebook_owner_for_document: {
        Args: { doc_metadata: Json }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      user_owns_source: {
        Args: { source_id_param: string }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      source_type: "pdf" | "text" | "website" | "youtube" | "audio"
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
      source_type: ["pdf", "text", "website", "youtube", "audio"],
    },
  },
} as const
