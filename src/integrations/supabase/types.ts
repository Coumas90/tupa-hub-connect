export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      cafes: {
        Row: {
          address: string | null
          brand_color: string | null
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          qr_code_url: string | null
          qr_generated_at: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          brand_color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          qr_code_url?: string | null
          qr_generated_at?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          brand_color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          qr_code_url?: string | null
          qr_generated_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      client_configs: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          pos_type: string
          pos_version: string | null
          simulation_mode: boolean | null
          sync_frequency: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          pos_type: string
          pos_version?: string | null
          simulation_mode?: boolean | null
          sync_frequency?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          pos_type?: string
          pos_version?: string | null
          simulation_mode?: boolean | null
          sync_frequency?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      consumptions: {
        Row: {
          average_order_value: number
          client_id: string
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          location_id: string | null
          metadata: Json | null
          payment_methods: Json | null
          top_categories: string[] | null
          total_amount: number
          total_items: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          average_order_value?: number
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          location_id?: string | null
          metadata?: Json | null
          payment_methods?: Json | null
          top_categories?: string[] | null
          total_amount?: number
          total_items?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          average_order_value?: number
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          location_id?: string | null
          metadata?: Json | null
          payment_methods?: Json | null
          top_categories?: string[] | null
          total_amount?: number
          total_items?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consumptions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          content: string | null
          course_id: string
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          order_index: number
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          order_index: number
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          difficulty: string
          duration_minutes: number
          id: string
          image_url: string | null
          instructor_id: string
          is_active: boolean
          module_count: number
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          difficulty: string
          duration_minutes: number
          id?: string
          image_url?: string | null
          instructor_id: string
          is_active?: boolean
          module_count?: number
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: string
          duration_minutes?: number
          id?: string
          image_url?: string | null
          instructor_id?: string
          is_active?: boolean
          module_count?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      feedbacks: {
        Row: {
          cafe_id: string
          comment: string | null
          comment_status: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          id: string
          rating: number | null
          sentiment: string | null
        }
        Insert: {
          cafe_id: string
          comment?: string | null
          comment_status?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          rating?: number | null
          sentiment?: string | null
        }
        Update: {
          cafe_id?: string
          comment?: string | null
          comment_status?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          rating?: number | null
          sentiment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaway_participants: {
        Row: {
          cafe_id: string
          campaign_id: string | null
          created_at: string | null
          customer_email: string
          customer_name: string
          id: string
          metadata: Json | null
          participated_at: string | null
          phone: string | null
        }
        Insert: {
          cafe_id: string
          campaign_id?: string | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          id?: string
          metadata?: Json | null
          participated_at?: string | null
          phone?: string | null
        }
        Update: {
          cafe_id?: string
          campaign_id?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          id?: string
          metadata?: Json | null
          participated_at?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_participants_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaway_winners: {
        Row: {
          cafe_id: string
          created_at: string
          created_by: string | null
          email_sent_at: string | null
          email_status: string | null
          id: string
          participant_id: string
          prize_code: string
          prize_description: string | null
          region: string | null
          selected_at: string
          updated_at: string
          updated_by: string | null
          week_of: string
        }
        Insert: {
          cafe_id: string
          created_at?: string
          created_by?: string | null
          email_sent_at?: string | null
          email_status?: string | null
          id?: string
          participant_id: string
          prize_code: string
          prize_description?: string | null
          region?: string | null
          selected_at?: string
          updated_at?: string
          updated_by?: string | null
          week_of: string
        }
        Update: {
          cafe_id?: string
          created_at?: string
          created_by?: string | null
          email_sent_at?: string | null
          email_status?: string | null
          id?: string
          participant_id?: string
          prize_code?: string
          prize_description?: string | null
          region?: string | null
          selected_at?: string
          updated_at?: string
          updated_by?: string | null
          week_of?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_giveaway_winners_cafe"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_giveaway_winners_participant"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "giveaway_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      instructors: {
        Row: {
          bio: string | null
          created_at: string
          created_by: string | null
          email: string | null
          expertise: string[] | null
          id: string
          image_url: string | null
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          expertise?: string[] | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          expertise?: string[] | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      integration_logs: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          error_message: string | null
          events_count: number | null
          id: string
          operation: string
          pos_type: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          events_count?: number | null
          id?: string
          operation: string
          pos_type: string
          status: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          events_count?: number | null
          id?: string
          operation?: string
          pos_type?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string | null
          created_at: string | null
          created_by: string | null
          group_id: string
          id: string
          is_main: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          created_by?: string | null
          group_id: string
          id?: string
          is_main?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          created_by?: string | null
          group_id?: string
          id?: string
          is_main?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          id: string
          location_id: string | null
          order_date: string
          status: string
          total_amount: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location_id?: string | null
          order_date?: string
          status?: string
          total_amount?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location_id?: string | null
          order_date?: string
          status?: string
          total_amount?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_reviews: {
        Row: {
          auto_approved: boolean
          created_at: string
          created_by: string | null
          feedback_id: string
          id: string
          is_approved: boolean | null
          moderation_reason: string | null
          needs_validation: boolean
          original_comment: string
          reviewed_at: string | null
          reviewed_by: string | null
          sentiment_result: string | null
          toxicity_score: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auto_approved?: boolean
          created_at?: string
          created_by?: string | null
          feedback_id: string
          id?: string
          is_approved?: boolean | null
          moderation_reason?: string | null
          needs_validation?: boolean
          original_comment: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sentiment_result?: string | null
          toxicity_score?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auto_approved?: boolean
          created_at?: string
          created_by?: string | null
          feedback_id?: string
          id?: string
          is_approved?: boolean | null
          moderation_reason?: string | null
          needs_validation?: boolean
          original_comment?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sentiment_result?: string | null
          toxicity_score?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_reviews_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedbacks"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sync_logs: {
        Row: {
          backoff_seconds: number | null
          client_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          duration_ms: number | null
          error_code: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          next_retry_at: string | null
          operation: string
          pos_type: string
          records_failed: number | null
          records_processed: number | null
          records_success: number | null
          retry_count: number | null
          started_at: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          backoff_seconds?: number | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          next_retry_at?: string | null
          operation: string
          pos_type: string
          records_failed?: number | null
          records_processed?: number | null
          records_success?: number | null
          retry_count?: number | null
          started_at?: string
          status: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          backoff_seconds?: number | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          next_retry_at?: string | null
          operation?: string
          pos_type?: string
          records_failed?: number | null
          records_processed?: number | null
          records_success?: number | null
          retry_count?: number | null
          started_at?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      pos_sync_status: {
        Row: {
          client_id: string
          consecutive_failures: number | null
          created_at: string
          created_by: string | null
          id: string
          is_paused: boolean | null
          last_failure_at: string | null
          last_success_at: string | null
          last_sync_at: string | null
          next_allowed_sync_at: string | null
          pause_reason: string | null
          paused_at: string | null
          pos_type: string
          total_failures: number | null
          total_syncs: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          client_id: string
          consecutive_failures?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_paused?: boolean | null
          last_failure_at?: string | null
          last_success_at?: string | null
          last_sync_at?: string | null
          next_allowed_sync_at?: string | null
          pause_reason?: string | null
          paused_at?: string | null
          pos_type: string
          total_failures?: number | null
          total_syncs?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          client_id?: string
          consecutive_failures?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_paused?: boolean | null
          last_failure_at?: string | null
          last_success_at?: string | null
          last_sync_at?: string | null
          next_allowed_sync_at?: string | null
          pause_reason?: string | null
          paused_at?: string | null
          pos_type?: string
          total_failures?: number | null
          total_syncs?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_answer_index: number
          created_at: string
          created_by: string | null
          explanation: string | null
          id: string
          options: Json
          order_index: number
          question: string
          quiz_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          correct_answer_index: number
          created_at?: string
          created_by?: string | null
          explanation?: string | null
          id?: string
          options: Json
          order_index: number
          question: string
          quiz_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          correct_answer_index?: number
          created_at?: string
          created_by?: string | null
          explanation?: string | null
          id?: string
          options?: Json
          order_index?: number
          question?: string
          quiz_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          passing_score: number
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          passing_score?: number
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          passing_score?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          location_id: string | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          location_id?: string | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          location_id?: string | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_tokens: {
        Row: {
          created_at: string
          device_info: Json | null
          expires_at: string
          id: string
          is_revoked: boolean
          last_used_at: string | null
          parent_token_hash: string | null
          revoked_at: string | null
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          expires_at: string
          id?: string
          is_revoked?: boolean
          last_used_at?: string | null
          parent_token_hash?: string | null
          revoked_at?: string | null
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          expires_at?: string
          id?: string
          is_revoked?: boolean
          last_used_at?: string | null
          parent_token_hash?: string | null
          revoked_at?: string | null
          token_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      role_audit_log: {
        Row: {
          action: string
          changed_by: string
          created_at: string | null
          id: string
          role_changed: string
          user_id: string
        }
        Insert: {
          action: string
          changed_by: string
          created_at?: string | null
          id?: string
          role_changed: string
          user_id: string
        }
        Update: {
          action?: string
          changed_by?: string
          created_at?: string | null
          id?: string
          role_changed?: string
          user_id?: string
        }
        Relationships: []
      }
      user_course_progress: {
        Row: {
          certificate_url: string | null
          completed_at: string | null
          course_id: string
          created_at: string
          created_by: string | null
          id: string
          last_accessed_at: string | null
          progress_percentage: number
          started_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          completed_at?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number
          started_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          completed_at?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number
          started_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_attempts: {
        Row: {
          answers: Json
          attempt_number: number
          completed_at: string
          created_at: string
          created_by: string | null
          id: string
          passed: boolean
          quiz_id: string
          score: number
          total_questions: number
          updated_by: string | null
          user_id: string
        }
        Insert: {
          answers: Json
          attempt_number?: number
          completed_at?: string
          created_at?: string
          created_by?: string | null
          id?: string
          passed: boolean
          quiz_id: string
          score: number
          total_questions: number
          updated_by?: string | null
          user_id: string
        }
        Update: {
          answers?: Json
          attempt_number?: number
          completed_at?: string
          created_at?: string
          created_by?: string | null
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          total_questions?: number
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          created_by: string | null
          group_id: string | null
          id: string
          location_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          group_id?: string | null
          id?: string
          location_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          group_id?: string | null
          id?: string
          location_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      giveaway_winner_stats: {
        Row: {
          emails_failed: number | null
          emails_pending: number | null
          emails_sent: number | null
          regions_count: number | null
          week_start: string | null
          winners_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      enforce_session_limit: {
        Args: { target_user_id: string; max_sessions?: number }
        Returns: undefined
      }
      generate_prize_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_cafe_id: {
        Args: { _user_id: string }
        Returns: string
      }
      get_user_location_id: {
        Args: { _user_id?: string }
        Returns: string
      }
      is_admin: {
        Args: { _user_id?: string }
        Returns: boolean
      }
      is_cafe_owner: {
        Args: { _user_id: string; _cafe_id: string }
        Returns: boolean
      }
      revoke_all_user_sessions: {
        Args: { target_user_id: string }
        Returns: undefined
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
