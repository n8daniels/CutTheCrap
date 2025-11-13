/**
 * Supabase Database Types
 *
 * Normally generated with: supabase gen types typescript --local
 * Run that command after applying migrations to get accurate types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          name: string
          role: 'admin' | 'verified_author' | 'user'
          party: 'democratic' | 'republican' | 'independent' | null
          title: string | null
          bio: string | null
          verified: boolean
          verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          role?: 'admin' | 'verified_author' | 'user'
          party?: 'democratic' | 'republican' | 'independent' | null
          title?: string | null
          bio?: string | null
          verified?: boolean
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: 'admin' | 'verified_author' | 'user'
          party?: 'democratic' | 'republican' | 'independent' | null
          title?: string | null
          bio?: string | null
          verified?: boolean
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bills: {
        Row: {
          id: string
          number: string
          title: string
          sponsor: string
          status: string
          congress: number
          chamber: string
          introduced_date: string | null
          last_action_date: string | null
          summary: string | null
          big_picture: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          number: string
          title: string
          sponsor: string
          status: string
          congress: number
          chamber: string
          introduced_date?: string | null
          last_action_date?: string | null
          summary?: string | null
          big_picture?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          number?: string
          title?: string
          sponsor?: string
          status?: string
          congress?: number
          chamber?: string
          introduced_date?: string | null
          last_action_date?: string | null
          summary?: string | null
          big_picture?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      bill_sections: {
        Row: {
          id: string
          bill_id: string
          section_number: string
          title: string
          preview: string | null
          simplified_summary: string
          deep_dive: Json | null
          ideology_score: number | null
          political_lean: number | null
          economic_tags: string[] | null
          risk_notes: string[] | null
          raw_text: string | null
          content_hash: string
          section_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bill_id: string
          section_number: string
          title: string
          preview?: string | null
          simplified_summary: string
          deep_dive?: Json | null
          ideology_score?: number | null
          political_lean?: number | null
          economic_tags?: string[] | null
          risk_notes?: string[] | null
          raw_text?: string | null
          content_hash: string
          section_order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bill_id?: string
          section_number?: string
          title?: string
          preview?: string | null
          simplified_summary?: string
          deep_dive?: Json | null
          ideology_score?: number | null
          political_lean?: number | null
          economic_tags?: string[] | null
          risk_notes?: string[] | null
          raw_text?: string | null
          content_hash?: string
          section_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          bill_id: string
          chamber: string
          vote_date: string
          result: string
          yeas: number
          nays: number
          present: number
          not_voting: number
          breakdown: Json
          created_at: string
        }
        Insert: {
          id?: string
          bill_id: string
          chamber: string
          vote_date: string
          result: string
          yeas: number
          nays: number
          present?: number
          not_voting?: number
          breakdown: Json
          created_at?: string
        }
        Update: {
          id?: string
          bill_id?: string
          chamber?: string
          vote_date?: string
          result?: string
          yeas?: number
          nays?: number
          present?: number
          not_voting?: number
          breakdown?: Json
          created_at?: string
        }
      }
      partisan_perspectives: {
        Row: {
          id: string
          bill_id: string
          author_id: string
          party: string
          perspective: string
          key_points: string[] | null
          concerns: string[] | null
          supports: string[] | null
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bill_id: string
          author_id: string
          party: string
          perspective: string
          key_points?: string[] | null
          concerns?: string[] | null
          supports?: string[] | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bill_id?: string
          author_id?: string
          party?: string
          perspective?: string
          key_points?: string[] | null
          concerns?: string[] | null
          supports?: string[] | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      content_cache: {
        Row: {
          id: string
          content_hash: string
          content: string
          analysis_type: string
          result: Json
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          content_hash: string
          content: string
          analysis_type: string
          result: Json
          created_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          content_hash?: string
          content?: string
          analysis_type?: string
          result?: Json
          created_at?: string
          expires_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          ip_address: string | null
          user_agent: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          details?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      is_verified_author: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      clean_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
