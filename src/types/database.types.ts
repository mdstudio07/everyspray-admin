export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          variables?: Json
          extensions?: Json
          query?: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          after_data: Json | null
          before_data: Json | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: number
          metadata: Json | null
          reason: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: number
          metadata?: Json | null
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: number
          metadata?: Json | null
          reason?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          country: string | null
          cover_image_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          founded_year: number | null
          founder: string | null
          id: string
          instagram_url: string | null
          logo_image_id: string | null
          name: string
          public_brand_id: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_note: string | null
          slug: string
          specialty: string | null
          status: string
          story: string | null
          updated_at: string | null
          website_url: string | null
          wikipedia_url: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          country?: string | null
          cover_image_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          founded_year?: number | null
          founder?: string | null
          id?: string
          instagram_url?: string | null
          logo_image_id?: string | null
          name: string
          public_brand_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_note?: string | null
          slug: string
          specialty?: string | null
          status?: string
          story?: string | null
          updated_at?: string | null
          website_url?: string | null
          wikipedia_url?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          country?: string | null
          cover_image_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          founded_year?: number | null
          founder?: string | null
          id?: string
          instagram_url?: string | null
          logo_image_id?: string | null
          name?: string
          public_brand_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_note?: string | null
          slug?: string
          specialty?: string | null
          status?: string
          story?: string | null
          updated_at?: string | null
          website_url?: string | null
          wikipedia_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brands_logo_image_id_fkey"
            columns: ["logo_image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_brands_public_brand_id"
            columns: ["public_brand_id"]
            isOneToOne: false
            referencedRelation: "brands_public"
            referencedColumns: ["id"]
          },
        ]
      }
      brands_public: {
        Row: {
          brand_id: string
          id: string
          name: string
          published_at: string | null
          published_by: string | null
          slug: string
          thumbnail_url: string | null
        }
        Insert: {
          brand_id: string
          id?: string
          name: string
          published_at?: string | null
          published_by?: string | null
          slug: string
          thumbnail_url?: string | null
        }
        Update: {
          brand_id?: string
          id?: string
          name?: string
          published_at?: string | null
          published_by?: string | null
          slug?: string
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_public_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      contributor_perfume_suggestions: {
        Row: {
          assigned_to_team_member: string | null
          brand_name: string | null
          contributor_id: string
          contributor_notes: string | null
          created_at: string | null
          estimated_launch_year: number | null
          id: number
          perfume_name: string
          processed_at: string | null
          processed_by: string | null
          reference_url: string | null
          rejection_note: string | null
          rough_notes: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_to_team_member?: string | null
          brand_name?: string | null
          contributor_id: string
          contributor_notes?: string | null
          created_at?: string | null
          estimated_launch_year?: number | null
          id?: number
          perfume_name: string
          processed_at?: string | null
          processed_by?: string | null
          reference_url?: string | null
          rejection_note?: string | null
          rough_notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_to_team_member?: string | null
          brand_name?: string | null
          contributor_id?: string
          contributor_notes?: string | null
          created_at?: string | null
          estimated_launch_year?: number | null
          id?: number
          perfume_name?: string
          processed_at?: string | null
          processed_by?: string | null
          reference_url?: string | null
          rejection_note?: string | null
          rough_notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          file_size: number
          height: number | null
          id: string
          mime_type: string
          original_filename: string
          sha256_hash: string | null
          storage_path: string
          thumbnail_url: string | null
          updated_at: string | null
          uploaded_by: string | null
          url: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          file_size: number
          height?: number | null
          id?: string
          mime_type: string
          original_filename: string
          sha256_hash?: string | null
          storage_path: string
          thumbnail_url?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          url: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          file_size?: number
          height?: number | null
          id?: string
          mime_type?: string
          original_filename?: string
          sha256_hash?: string | null
          storage_path?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string | null
          characteristics: string[] | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          image_id: string | null
          name: string
          origin: string | null
          public_note_id: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_note: string | null
          slug: string
          status: string
          subcategory: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          characteristics?: string[] | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          image_id?: string | null
          name: string
          origin?: string | null
          public_note_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_note?: string | null
          slug: string
          status?: string
          subcategory?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          characteristics?: string[] | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          image_id?: string | null
          name?: string
          origin?: string | null
          public_note_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_note?: string | null
          slug?: string
          status?: string
          subcategory?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_notes_public_note_id"
            columns: ["public_note_id"]
            isOneToOne: false
            referencedRelation: "notes_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_public: {
        Row: {
          id: string
          name: string
          note_id: string
          published_at: string | null
          published_by: string | null
          slug: string
          thumbnail_url: string | null
        }
        Insert: {
          id?: string
          name: string
          note_id: string
          published_at?: string | null
          published_by?: string | null
          slug: string
          thumbnail_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          note_id?: string
          published_at?: string | null
          published_by?: string | null
          slug?: string
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_public_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      perfumes: {
        Row: {
          additional_image_ids: string[] | null
          approved_at: string | null
          approved_by: string | null
          base_note_ids: string[] | null
          brand_id: string
          concentration: string | null
          created_at: string | null
          created_by: string
          description: string | null
          gender: string | null
          id: string
          launch_year: number | null
          longevity: string | null
          main_image_id: string | null
          middle_note_ids: string[] | null
          name: string
          occasion: string[] | null
          perfumer: string | null
          price_range: string | null
          public_perfume_id: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_note: string | null
          season: string[] | null
          sillage: string | null
          slug: string
          source_url: string | null
          status: string
          suggestion_id: number | null
          top_note_ids: string[] | null
          updated_at: string | null
          verified_data: boolean | null
        }
        Insert: {
          additional_image_ids?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          base_note_ids?: string[] | null
          brand_id: string
          concentration?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          gender?: string | null
          id?: string
          launch_year?: number | null
          longevity?: string | null
          main_image_id?: string | null
          middle_note_ids?: string[] | null
          name: string
          occasion?: string[] | null
          perfumer?: string | null
          price_range?: string | null
          public_perfume_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_note?: string | null
          season?: string[] | null
          sillage?: string | null
          slug: string
          source_url?: string | null
          status?: string
          suggestion_id?: number | null
          top_note_ids?: string[] | null
          updated_at?: string | null
          verified_data?: boolean | null
        }
        Update: {
          additional_image_ids?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          base_note_ids?: string[] | null
          brand_id?: string
          concentration?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          gender?: string | null
          id?: string
          launch_year?: number | null
          longevity?: string | null
          main_image_id?: string | null
          middle_note_ids?: string[] | null
          name?: string
          occasion?: string[] | null
          perfumer?: string | null
          price_range?: string | null
          public_perfume_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_note?: string | null
          season?: string[] | null
          sillage?: string | null
          slug?: string
          source_url?: string | null
          status?: string
          suggestion_id?: number | null
          top_note_ids?: string[] | null
          updated_at?: string | null
          verified_data?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_perfumes_public_perfume_id"
            columns: ["public_perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfumes_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfumes_main_image_id_fkey"
            columns: ["main_image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfumes_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "contributor_perfume_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      perfumes_public: {
        Row: {
          brand_name: string
          id: string
          name: string
          notes: string
          perfume_id: string
          published_at: string | null
          published_by: string | null
          slug: string
          thumbnail_url: string | null
        }
        Insert: {
          brand_name: string
          id?: string
          name: string
          notes: string
          perfume_id: string
          published_at?: string | null
          published_by?: string | null
          slug: string
          thumbnail_url?: string | null
        }
        Update: {
          brand_name?: string
          id?: string
          name?: string
          notes?: string
          perfume_id?: string
          published_at?: string | null
          published_by?: string | null
          slug?: string
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfumes_public_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
      }
      role_audit_log: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: number
          new_role: Database["public"]["Enums"]["app_role"] | null
          old_role: Database["public"]["Enums"]["app_role"] | null
          reason: string | null
          user_id: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: number
          new_role?: Database["public"]["Enums"]["app_role"] | null
          old_role?: Database["public"]["Enums"]["app_role"] | null
          reason?: string | null
          user_id: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: number
          new_role?: Database["public"]["Enums"]["app_role"] | null
          old_role?: Database["public"]["Enums"]["app_role"] | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          id?: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          id?: number
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: number
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users_profile: {
        Row: {
          approval_rate: number | null
          avatar_url: string | null
          bio: string | null
          contribution_count: number | null
          country: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_suspended: boolean | null
          last_login: string | null
          trust_level: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          approval_rate?: number | null
          avatar_url?: string | null
          bio?: string | null
          contribution_count?: number | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          is_suspended?: boolean | null
          last_login?: string | null
          trust_level?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          approval_rate?: number | null
          avatar_url?: string | null
          bio?: string | null
          contribution_count?: number | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_suspended?: boolean | null
          last_login?: string | null
          trust_level?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      role_permissions_summary: {
        Row: {
          permission_count: number | null
          permissions: Database["public"]["Enums"]["app_permission"][] | null
          role: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: []
      }
      users_profile_public: {
        Row: {
          avatar_url: string | null
          contribution_count: number | null
          created_at: string | null
          id: string | null
          trust_level: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          contribution_count?: number | null
          created_at?: string | null
          id?: string | null
          trust_level?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          contribution_count?: number | null
          created_at?: string | null
          id?: string | null
          trust_level?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_suggestion_to_review: {
        Args: { p_team_member_id: string; p_suggestion_id: number }
        Returns: string
      }
      approve_and_publish_brand: {
        Args: { p_brand_id: string; p_super_admin_id: string }
        Returns: string
      }
      approve_and_publish_note: {
        Args: { p_note_id: string; p_super_admin_id: string }
        Returns: string
      }
      approve_and_publish_perfume: {
        Args: { p_super_admin_id: string; p_perfume_id: string }
        Returns: string
      }
      audit_function_ownership: {
        Args: Record<PropertyKey, never>
        Returns: {
          function_name: string
          owner: unknown
          is_security_definer: boolean
          is_safe: boolean
          risk_level: string
        }[]
      }
      authorize: {
        Args: {
          requested_permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
      check_email_exists: {
        Args: { p_email: string }
        Returns: boolean
      }
      check_security_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          details: string
          status: string
        }[]
      }
      check_username_exists: {
        Args: { p_username: string }
        Returns: boolean
      }
      create_audit_log_entry: {
        Args: {
          p_before_data?: Json
          p_metadata?: Json
          p_reason?: string
          p_after_data?: Json
          p_user_id: string
          p_action: string
          p_entity_id: string
          p_entity_type: string
        }
        Returns: number
      }
      custom_access_token_hook: {
        Args: { event: Json }
        Returns: Json
      }
      detect_unusual_service_role_activity: {
        Args: Record<PropertyKey, never>
        Returns: {
          alert_level: string
          date: string
          operation_count: number
          avg_30day: number
          is_unusual: boolean
        }[]
      }
      generate_slug: {
        Args: { p_text: string }
        Returns: string
      }
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_index_usage_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          index_name: string
          index_size: string
          index_scans: number
          tuples_read: number
          tuples_fetched: number
          usage_ratio: number
        }[]
      }
      get_role_permissions: {
        Args: { check_role: Database["public"]["Enums"]["app_role"] }
        Returns: Database["public"]["Enums"]["app_permission"][]
      }
      get_unused_indexes: {
        Args: Record<PropertyKey, never>
        Returns: {
          index_size: string
          table_name: string
          suggestion: string
          index_name: string
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin_catalog: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_team_member_or_higher: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_team_member_or_higher_catalog: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      reject_brand: {
        Args: {
          p_super_admin_id: string
          p_rejection_note: string
          p_brand_id: string
        }
        Returns: boolean
      }
      reject_note: {
        Args: {
          p_note_id: string
          p_super_admin_id: string
          p_rejection_note: string
        }
        Returns: boolean
      }
      reject_perfume: {
        Args: {
          p_perfume_id: string
          p_super_admin_id: string
          p_rejection_note: string
        }
        Returns: boolean
      }
      reject_suggestion: {
        Args: {
          p_team_member_id: string
          p_rejection_note: string
          p_suggestion_id: number
        }
        Returns: boolean
      }
      role_has_permission: {
        Args: {
          check_role: Database["public"]["Enums"]["app_role"]
          check_permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      submit_brand_for_approval: {
        Args: { p_team_member_id: string; p_brand_id: string }
        Returns: boolean
      }
      submit_note_for_approval: {
        Args: { p_team_member_id: string; p_note_id: string }
        Returns: boolean
      }
      submit_perfume_for_approval: {
        Args: { p_team_member_id: string; p_perfume_id: string }
        Returns: boolean
      }
      test_auth_hook: {
        Args: { test_user_id: string }
        Returns: Json
      }
      test_auth_hook_scenarios: {
        Args: Record<PropertyKey, never>
        Returns: {
          scenario: string
          is_valid: boolean
          result: Json
        }[]
      }
      test_authorization: {
        Args: {
          test_permission: Database["public"]["Enums"]["app_permission"]
          test_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      test_rls_policies: {
        Args: Record<PropertyKey, never>
        Returns: {
          test_status: string
          expected_result: string
          policy_name: string
          table_name: string
          operation: string
        }[]
      }
      test_user_creation_trigger: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      unpublish_brand: {
        Args: { p_reason: string; p_super_admin_id: string; p_brand_id: string }
        Returns: boolean
      }
      unpublish_note: {
        Args: { p_super_admin_id: string; p_note_id: string; p_reason: string }
        Returns: boolean
      }
      unpublish_perfume: {
        Args: {
          p_perfume_id: string
          p_reason: string
          p_super_admin_id: string
        }
        Returns: boolean
      }
      validate_jwt_claims: {
        Args: { test_claims: Json }
        Returns: boolean
      }
      validate_rbac_indexes: {
        Args: Record<PropertyKey, never>
        Returns: {
          index_count: number
          status: string
          index_category: string
        }[]
      }
      verify_rls_enabled: {
        Args: Record<PropertyKey, never>
        Returns: {
          rls_enabled: boolean
          table_name: string
          status: string
        }[]
      }
    }
    Enums: {
      app_permission:
        | "perfumes.create"
        | "perfumes.update"
        | "perfumes.delete"
        | "perfumes.approve"
        | "brands.create"
        | "brands.update"
        | "brands.delete"
        | "brands.approve"
        | "notes.create"
        | "notes.update"
        | "notes.delete"
        | "notes.approve"
        | "suggestions.create"
        | "suggestions.review"
        | "suggestions.moderate"
        | "users.manage"
        | "users.suspend"
        | "analytics.view"
      app_role: "super_admin" | "team_member" | "contributor"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_permission: [
        "perfumes.create",
        "perfumes.update",
        "perfumes.delete",
        "perfumes.approve",
        "brands.create",
        "brands.update",
        "brands.delete",
        "brands.approve",
        "notes.create",
        "notes.update",
        "notes.delete",
        "notes.approve",
        "suggestions.create",
        "suggestions.review",
        "suggestions.moderate",
        "users.manage",
        "users.suspend",
        "analytics.view",
      ],
      app_role: ["super_admin", "team_member", "contributor"],
    },
  },
} as const

