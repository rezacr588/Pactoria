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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      analytics_events: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          event_data: Json | null
          event_name: string
          event_type: string
          id: string
          ip_address: unknown | null
          os: string | null
          page_url: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_name: string
          event_type: string
          id?: string
          ip_address?: unknown | null
          os?: string | null
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_name?: string
          event_type?: string
          id?: string
          ip_address?: unknown | null
          os?: string | null
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          organization_id: string | null
          rate_limit: number | null
          revoked: boolean | null
          revoked_at: string | null
          scopes: string[] | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          organization_id?: string | null
          rate_limit?: number | null
          revoked?: boolean | null
          revoked_at?: string | null
          scopes?: string[] | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          organization_id?: string | null
          rate_limit?: number | null
          revoked?: boolean | null
          revoked_at?: string | null
          scopes?: string[] | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage: {
        Row: {
          api_key_id: string | null
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          method: string
          request_size_bytes: number | null
          response_size_bytes: number | null
          response_time_ms: number | null
          status_code: number | null
          user_id: string | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          method: string
          request_size_bytes?: number | null
          response_size_bytes?: number | null
          response_time_ms?: number | null
          status_code?: number | null
          user_id?: string | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          method?: string
          request_size_bytes?: number | null
          response_size_bytes?: number | null
          response_time_ms?: number | null
          status_code?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      collab_sessions: {
        Row: {
          contract_id: string
          ended_at: string | null
          id: string
          participants: Json
          provider: string
          room_id: string
          started_at: string
          started_by: string | null
        }
        Insert: {
          contract_id: string
          ended_at?: string | null
          id?: string
          participants?: Json
          provider: string
          room_id: string
          started_at?: string
          started_by?: string | null
        }
        Update: {
          contract_id?: string
          ended_at?: string | null
          id?: string
          participants?: Json
          provider?: string
          room_id?: string
          started_at?: string
          started_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collab_sessions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contract_stats"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "collab_sessions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_activity: {
        Row: {
          action: string
          contract_id: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          contract_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          contract_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_activity_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contract_stats"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "contract_activity_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_analytics: {
        Row: {
          contract_id: string | null
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          contract_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          contract_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_analytics_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contract_stats"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "contract_analytics_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_approvals: {
        Row: {
          approver_id: string
          comment: string | null
          contract_id: string
          created_at: string
          decided_at: string | null
          id: string
          status: string
          version_id: string
        }
        Insert: {
          approver_id: string
          comment?: string | null
          contract_id: string
          created_at?: string
          decided_at?: string | null
          id?: string
          status?: string
          version_id: string
        }
        Update: {
          approver_id?: string
          comment?: string | null
          contract_id?: string
          created_at?: string
          decided_at?: string | null
          id?: string
          status?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_approvals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contract_stats"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "contract_approvals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_approvals_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "contract_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_collaborators: {
        Row: {
          added_at: string
          added_by: string
          contract_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          contract_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          contract_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_collaborators_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contract_stats"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "contract_collaborators_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_metadata: {
        Row: {
          contract_id: string
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
          value_type: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
          value_type?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
          value_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_metadata_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contract_stats"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "contract_metadata_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_parties: {
        Row: {
          contact_info: Json | null
          contract_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          party_email: string | null
          party_name: string
          party_role: string
          party_type: string
          updated_at: string | null
        }
        Insert: {
          contact_info?: Json | null
          contract_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          party_email?: string | null
          party_name: string
          party_role?: string
          party_type?: string
          updated_at?: string | null
        }
        Update: {
          contact_info?: Json | null
          contract_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          party_email?: string | null
          party_name?: string
          party_role?: string
          party_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_parties_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contract_stats"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "contract_parties_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_versions: {
        Row: {
          content_json: Json | null
          content_md: string | null
          contract_id: string
          created_at: string
          created_by: string | null
          id: string
          version_number: number
          ydoc_state: string | null
        }
        Insert: {
          content_json?: Json | null
          content_md?: string | null
          contract_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          version_number: number
          ydoc_state?: string | null
        }
        Update: {
          content_json?: Json | null
          content_md?: string | null
          contract_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          version_number?: number
          ydoc_state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_versions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contract_stats"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "contract_versions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string
          id: string
          latest_version_number: number
          metadata: Json | null
          owner_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          latest_version_number?: number
          metadata?: Json | null
          owner_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          latest_version_number?: number
          metadata?: Json | null
          owner_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          created_at: string | null
          error: Json | null
          id: string
          recipient_id: string | null
          retry_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          template_data: Json
          template_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error?: Json | null
          id?: string
          recipient_id?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          template_data: Json
          template_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error?: Json | null
          id?: string
          recipient_id?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          template_data?: Json
          template_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string | null
          error_message: string
          error_stack: string | null
          error_type: string
          id: string
          metadata: Json | null
          page_url: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message: string
          error_stack?: string | null
          error_type: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string
          error_stack?: string | null
          error_type?: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          created_at: string | null
          currency: string | null
          id: string
          organization_id: string | null
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          status: string
          stripe_invoice_id: string | null
          stripe_invoice_url: string | null
          stripe_pdf_url: string | null
          user_id: string
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          organization_id?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status: string
          stripe_invoice_id?: string | null
          stripe_invoice_url?: string | null
          stripe_pdf_url?: string | null
          user_id: string
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          organization_id?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_invoice_url?: string | null
          stripe_pdf_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          channel: string
          content: Json | null
          created_at: string | null
          id: string
          metadata: Json | null
          notification_type: string
          status: string | null
          subject: string | null
          user_id: string | null
        }
        Insert: {
          channel: string
          content?: Json | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          status?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          channel?: string
          content?: Json | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          status?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string
          settings: Json | null
          slug: string
          stripe_customer_id: string | null
          subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id: string
          settings?: Json | null
          slug: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
          settings?: Json | null
          slug?: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          status: string
          stripe_payment_intent_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          connection_type: string | null
          created_at: string | null
          device_memory: number | null
          hardware_concurrency: number | null
          id: string
          metadata: Json | null
          name: string
          session_id: string | null
          timestamp: string
          unit: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
          value: number
          viewport_height: number | null
          viewport_width: number | null
        }
        Insert: {
          connection_type?: string | null
          created_at?: string | null
          device_memory?: number | null
          hardware_concurrency?: number | null
          id?: string
          metadata?: Json | null
          name: string
          session_id?: string | null
          timestamp: string
          unit?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
          value: number
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Update: {
          connection_type?: string | null
          created_at?: string | null
          device_memory?: number | null
          hardware_concurrency?: number | null
          id?: string
          metadata?: Json | null
          name?: string
          session_id?: string | null
          timestamp?: string
          unit?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
          value?: number
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          organization_id: string | null
          phone: string | null
          stripe_customer_id: string | null
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          organization_id?: string | null
          phone?: string | null
          stripe_customer_id?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          organization_id?: string | null
          phone?: string | null
          stripe_customer_id?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number | null
          created_at: string | null
          id: string
          key: string
          reset_time: string
          updated_at: string | null
        }
        Insert: {
          count?: number | null
          created_at?: string | null
          id?: string
          key: string
          reset_time: string
          updated_at?: string | null
        }
        Update: {
          count?: number | null
          created_at?: string | null
          id?: string
          key?: string
          reset_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          tier_id: string
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier_id?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier_id?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      template_purchases: {
        Row: {
          currency: string | null
          id: string
          payment_id: string | null
          price_paid: number
          purchased_at: string | null
          template_id: string
          user_id: string
        }
        Insert: {
          currency?: string | null
          id?: string
          payment_id?: string | null
          price_paid: number
          purchased_at?: string | null
          template_id: string
          user_id: string
        }
        Update: {
          currency?: string | null
          id?: string
          payment_id?: string | null
          price_paid?: number
          purchased_at?: string | null
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_purchases_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_purchases_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_ratings: {
        Row: {
          created_at: string
          id: string
          rating: number
          review: string | null
          template_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          review?: string | null
          template_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          review?: string | null
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_ratings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          author_id: string | null
          category: string
          content: Json | null
          content_json: Json | null
          content_md: string | null
          created_at: string
          created_by: string
          currency: string | null
          description: string | null
          id: string
          industry: string | null
          is_featured: boolean | null
          is_premium: boolean | null
          is_public: boolean | null
          jurisdiction: string | null
          metadata: Json | null
          name: string | null
          organization_id: string | null
          price: number | null
          published: boolean | null
          published_at: string | null
          rating: number | null
          reviews_count: number | null
          slug: string | null
          tags: string[] | null
          thumbnail_url: string | null
          tier_required: string | null
          title: string
          updated_at: string
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          author_id?: string | null
          category: string
          content?: Json | null
          content_json?: Json | null
          content_md?: string | null
          created_at?: string
          created_by: string
          currency?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          is_public?: boolean | null
          jurisdiction?: string | null
          metadata?: Json | null
          name?: string | null
          organization_id?: string | null
          price?: number | null
          published?: boolean | null
          published_at?: string | null
          rating?: number | null
          reviews_count?: number | null
          slug?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          tier_required?: string | null
          title: string
          updated_at?: string
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          author_id?: string | null
          category?: string
          content?: Json | null
          content_json?: Json | null
          content_md?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          is_public?: boolean | null
          jurisdiction?: string | null
          metadata?: Json | null
          name?: string | null
          organization_id?: string | null
          price?: number | null
          published?: boolean | null
          published_at?: string | null
          rating?: number | null
          reviews_count?: number | null
          slug?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          tier_required?: string | null
          title?: string
          updated_at?: string
          usage_count?: number | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_limits: {
        Row: {
          ai_requests_limit: number | null
          ai_requests_used: number | null
          api_calls_limit: number | null
          api_calls_used: number | null
          contracts_limit: number | null
          contracts_used: number | null
          created_at: string | null
          id: string
          organization_id: string | null
          period_end: string | null
          period_start: string | null
          storage_limit_bytes: number | null
          storage_used_bytes: number | null
          subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_requests_limit?: number | null
          ai_requests_used?: number | null
          api_calls_limit?: number | null
          api_calls_used?: number | null
          contracts_limit?: number | null
          contracts_used?: number | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          period_end?: string | null
          period_start?: string | null
          storage_limit_bytes?: number | null
          storage_used_bytes?: number | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_requests_limit?: number | null
          ai_requests_used?: number | null
          api_calls_limit?: number | null
          api_calls_used?: number | null
          contracts_limit?: number | null
          contracts_used?: number | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          period_end?: string | null
          period_start?: string | null
          storage_limit_bytes?: number | null
          storage_used_bytes?: number | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_limits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_limits_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          email_frequency: string | null
          id: string
          notification_preferences: Json | null
          timezone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_frequency?: string | null
          id?: string
          notification_preferences?: Json | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_frequency?: string | null
          id?: string
          notification_preferences?: Json | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          duration_seconds: number | null
          ended_at: string | null
          events_count: number | null
          id: string
          ip_address: unknown | null
          os: string | null
          page_views: number | null
          referrer: string | null
          started_at: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          events_count?: number | null
          id: string
          ip_address?: unknown | null
          os?: string | null
          page_views?: number | null
          referrer?: string | null
          started_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          events_count?: number | null
          id?: string
          ip_address?: unknown | null
          os?: string | null
          page_views?: number | null
          referrer?: string | null
          started_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      user_templates: {
        Row: {
          id: string
          last_used_at: string | null
          purchased_at: string | null
          template_id: string
          user_id: string
        }
        Insert: {
          id?: string
          last_used_at?: string | null
          purchased_at?: string | null
          template_id: string
          user_id: string
        }
        Update: {
          id?: string
          last_used_at?: string | null
          purchased_at?: string | null
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_templates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      contract_stats: {
        Row: {
          contract_id: string | null
          created_at: string | null
          last_version_date: string | null
          latest_version_number: number | null
          pending_approvals: number | null
          status: string | null
          title: string | null
          total_approvals: number | null
          total_versions: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      dashboard_metrics: {
        Row: {
          active_users_week: number | null
          avg_api_response_time: number | null
          avg_template_rating: number | null
          contracts_with_collaborators: number | null
          last_updated: string | null
          new_contracts_week: number | null
          new_users_week: number | null
          signed_contracts: number | null
          total_collaborations: number | null
          total_contracts: number | null
          total_template_usage: number | null
          total_templates: number | null
          total_users: number | null
          unresolved_errors: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_contract_statistics: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          avg_completion_time: unknown
          contracts_by_status: Json
          total_collaborations: number
          total_contracts: number
        }[]
      }
      get_user_engagement_metrics: {
        Args: { p_period?: string }
        Returns: {
          active_users: number
          avg_session_duration: unknown
          engagement_rate: number
          new_users: number
          total_users: number
        }[]
      }
      has_contract_access: {
        Args: { c: string; u: string }
        Returns: boolean
      }
      increment_template_usage: {
        Args: { template_id: string }
        Returns: undefined
      }
      increment_usage: {
        Args: { p_amount?: number; p_usage_type: string; p_user_id: string }
        Returns: boolean
      }
      log_contract_activity: {
        Args: {
          p_action: string
          p_contract_id: string
          p_description?: string
          p_metadata?: Json
        }
        Returns: string
      }
      log_error: {
        Args: {
          p_error_message: string
          p_error_stack?: string
          p_error_type: string
          p_metadata?: Json
          p_severity?: string
        }
        Returns: string
      }
      log_notification: {
        Args: {
          p_channel: string
          p_content: Json
          p_metadata?: Json
          p_notification_type: string
          p_subject: string
          p_user_id: string
        }
        Returns: string
      }
      queue_notification_email: {
        Args: {
          p_recipient_id: string
          p_scheduled_for?: string
          p_template_data: Json
          p_template_name: string
        }
        Returns: string
      }
      refresh_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      send_weekly_digests: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      take_snapshot: {
        Args: {
          p_content_json: Json
          p_content_md: string
          p_contract_id: string
          p_ydoc_state_base64: string
        }
        Returns: {
          content_json: Json | null
          content_md: string | null
          contract_id: string
          created_at: string
          created_by: string | null
          id: string
          version_number: number
          ydoc_state: string | null
        }
      }
      track_api_performance: {
        Args: {
          p_endpoint: string
          p_method: string
          p_response_time_ms: number
          p_status_code: number
          p_user_id?: string
        }
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
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          format: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          format?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          format?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            isOneToOne: false
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          level: number | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefixes_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _bucket_id: string; _name: string }
        Returns: boolean
      }
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_level: {
        Args: { name: string }
        Returns: number
      }
      get_prefix: {
        Args: { name: string }
        Returns: string
      }
      get_prefixes: {
        Args: { name: string }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          start_after?: string
        }
        Returns: {
          id: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v1_optimised: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS"
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
    Enums: {},
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS"],
    },
  },
} as const

