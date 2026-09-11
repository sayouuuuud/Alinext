export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type GeneratedTable<Row extends Record<string, unknown>> = {
  Row: Row
  Insert: Partial<Row>
  Update: Partial<Row>
  Relationships: []
}

type ContentRow = {
  id: number
  payload: Json
  version: number
  updated_by: string | null
  updated_at: string
}

type ProfileRow = {
  id: string
  email: string
  display_name: string
  username: string | null
  phone: string | null
  preferred_locale: string
  avatar_url: string | null
  status: string
  tier: string
  interested_in: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
}

type AddressRow = {
  id: string
  user_id: string
  label: string
  kind: string
  full_name: string
  phone: string
  company: string | null
  street: string
  address_line_2: string | null
  city: string
  state: string | null
  country: string
  postal_code: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

type CarRow = {
  id: string
  slug: string
  type: string
  title: Json
  make: string
  model: string
  year: number
  price_minor: number | null
  currency: string
  mileage: string | null
  fuel: string | null
  transmission: string | null
  status: string
  featured: boolean
  origin: string | null
  condition: string | null
  import_stage: number | null
  previous_owners: number | null
  eta: Json | null
  availability: Json | null
  specs: Json
  description: Json
  primary_image: string | null
  published: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

type CategoryRow = {
  id: string
  slug: string
  name: Json
  description: Json | null
  parent_id: string | null
  icon: string | null
  image: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

type ProductRow = {
  id: string
  slug: string
  sku: string
  name: Json
  category: string
  category_id: string | null
  subcategory_id: string | null
  brand: string | null
  price_minor: number
  currency: string
  stock_quantity: number
  max_order_quantity: number
  featured: boolean
  compatibility_summary: string | null
  description: Json
  primary_image: string | null
  published: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

type BlogRow = {
  id: string
  slug: string
  title: Json
  excerpt: Json
  content: Json | null
  author: string
  author_avatar: string | null
  read_time: string | null
  cover_image: string | null
  tags: string[]
  category: string | null
  featured: boolean
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

type OrderRow = {
  id: string
  order_number: string
  user_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: Json
  subtotal_minor: number
  tax_minor: number
  shipping_minor: number
  total_minor: number
  currency: string
  status: Database['public']['Enums']['order_status']
  payment_status: Database['public']['Enums']['payment_status']
  payment_method: string
  tracking_number: string | null
  carrier: string | null
  estimated_delivery: string | null
  customer_notes: string | null
  admin_notes: string | null
  idempotency_key: string
  archived_at: string | null
  created_at: string
  updated_at: string
}

type OrderItemRow = {
  id: string
  order_id: string
  product_id: string | null
  product_name: Json
  sku: string
  image: string | null
  unit_price_minor: number
  quantity: number
  line_total_minor: number
}

type AdminMembershipRow = {
  user_id: string
  role: Database['public']['Enums']['admin_role']
  active: boolean
  demo_only: boolean
  must_change_password: boolean
  mfa_required: boolean
  invited_by: string | null
  created_at: string
  updated_at: string
}

type AdminSessionRow = {
  id: string
  user_id: string
  token_hash: string
  supabase_session_id: string | null
  ip_hash: string | null
  user_agent: string | null
  last_active_at: string
  expires_at: string
  revoked_at: string | null
  created_at: string
}

type OrderStatusHistoryRow = {
  id: string
  order_id: string
  from_status: Database['public']['Enums']['order_status'] | null
  to_status: Database['public']['Enums']['order_status']
  note: string | null
  changed_by: string | null
  created_at: string
}

type InquiryRow = {
  id: string
  user_id: string | null
  kind: string
  entity_id: string | null
  name: string
  email: string
  phone: string | null
  service: string | null
  message: string
  status: string
  assigned_to: string | null
  resolution_notes: string | null
  created_at: string
  updated_at: string
}

type NotificationRow = {
  id: string
  user_id: string
  order_id: string | null
  event_type: string
  payload: Json
  read_at: string | null
  created_at: string
}

type NotificationEmailOutboxRow = {
  id: string
  notification_id: string
  recipient: string
  status: string
  attempt_count: number
  next_attempt_at: string
  provider_message_id: string | null
  last_error_code: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
}

type PaymentEventRow = {
  id: string
  order_id: string
  user_id: string
  from_status: Database['public']['Enums']['payment_status'] | null
  to_status: Database['public']['Enums']['payment_status']
  amount_minor: number
  currency: string
  payment_method: string | null
  changed_by: string | null
  note: string | null
  created_at: string
}

type GenericJsonRow = Record<string, Json | undefined>

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.5' }
  public: {
    Tables: {
      profiles: GeneratedTable<ProfileRow>
      addresses: GeneratedTable<AddressRow>
      admin_memberships: GeneratedTable<AdminMembershipRow>
      admin_sessions: GeneratedTable<AdminSessionRow>
      site_content: GeneratedTable<ContentRow>
      site_settings_public: GeneratedTable<{ key: string; value: Json; updated_at: string }>
      site_settings_private: GeneratedTable<{ key: string; value: Json; updated_at: string }>
      page_sections: GeneratedTable<GenericJsonRow>
      policy_pages: GeneratedTable<GenericJsonRow>
      seo_entries: GeneratedTable<GenericJsonRow>
      cars: GeneratedTable<CarRow>
      car_media: GeneratedTable<GenericJsonRow>
      car_highlights: GeneratedTable<GenericJsonRow>
      categories: GeneratedTable<CategoryRow>
      products: GeneratedTable<ProductRow>
      product_media: GeneratedTable<GenericJsonRow>
      product_specs: GeneratedTable<GenericJsonRow>
      product_compatibility: GeneratedTable<GenericJsonRow>
      blog_posts: GeneratedTable<BlogRow>
      carts: GeneratedTable<{ id: string; user_id: string; status: string; created_at: string; updated_at: string }>
      cart_items: GeneratedTable<{ id: string; cart_id: string; product_id: string; quantity: number; created_at: string; updated_at: string }>
      orders: GeneratedTable<OrderRow>
      order_items: GeneratedTable<OrderItemRow>
      order_status_history: GeneratedTable<OrderStatusHistoryRow>
      notifications: GeneratedTable<NotificationRow>
      notification_email_outbox: GeneratedTable<NotificationEmailOutboxRow>
      payment_events: GeneratedTable<PaymentEventRow>
      inventory_movements: GeneratedTable<GenericJsonRow>
      inquiries: GeneratedTable<InquiryRow>
      admin_audit_log: GeneratedTable<GenericJsonRow>
      seed_runs: GeneratedTable<GenericJsonRow>
    }
    Views: Record<never, never>
    Functions: {
      create_order: {
        Args: {
          p_items: Json
          p_address: Json
          p_idempotency_key: string
          p_customer_notes?: string
          p_payment_method?: string
        }
        Returns: Json
      }
      cancel_order: {
        Args: { p_order_id: string; p_reason: string }
        Returns: Json
      }
      confirm_order_received: {
        Args: { p_order_id: string }
        Returns: Json
      }
      mark_notifications_read: {
        Args: { p_notification_id?: string }
        Returns: number
      }
      admin_update_order: {
        Args: {
          p_order_id: string
          p_status?: Database['public']['Enums']['order_status']
          p_payment_status?: Database['public']['Enums']['payment_status']
          p_carrier?: string | null
          p_tracking_number?: string | null
          p_estimated_delivery?: string | null
          p_admin_notes?: string | null
          p_note?: string | null
          p_changed_by?: string | null
        }
        Returns: Json
      }
    }
    Enums: {
      admin_role: 'owner' | 'content_editor' | 'operations'
      order_status: 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled' | 'completed'
      payment_status: 'unpaid' | 'paid' | 'refunded'
    }
    CompositeTypes: Record<never, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
