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
      feeds: {
        Row: {
          id: string
          title: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string | null
          created_at?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          id: string
          feed_id: string
          storage_path: string
          caption: string | null
          tags: string[] | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          feed_id: string
          storage_path: string
          caption?: string | null
          tags?: string[] | null
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          feed_id?: string
          storage_path?: string
          caption?: string | null
          tags?: string[] | null
          order_index?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_feed_id_fkey"
            columns: ["feed_id"]
            referencedRelation: "feeds"
            referencedColumns: ["id"]
          }
        ]
      }
      previews: {
        Row: {
          id: string
          feed_id: string
          token: string
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          feed_id: string
          token: string
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          feed_id?: string
          token?: string
          expires_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "previews_feed_id_fkey"
            columns: ["feed_id"]
            referencedRelation: "feeds"
            referencedColumns: ["id"]
          }
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