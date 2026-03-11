export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          rif: string | null;
          logo_url: string | null;
          primary_color: string | null;
          plan_type: string | null;
          is_active: boolean | null;
          settings: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          rif?: string | null;
          logo_url?: string | null;
          primary_color?: string | null;
          plan_type?: string | null;
          is_active?: boolean | null;
          settings?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          rif?: string | null;
          logo_url?: string | null;
          primary_color?: string | null;
          plan_type?: string | null;
          is_active?: boolean | null;
          settings?: Json | null;
          created_at?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          company_id: string | null;
          auth_id: string | null;
          full_name: string | null;
          email: string | null;
          role: string | null;
          avatar_url: string | null;
          zone: string | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          auth_id?: string | null;
          full_name?: string | null;
          email?: string | null;
          role?: string | null;
          avatar_url?: string | null;
          zone?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          auth_id?: string | null;
          full_name?: string | null;
          email?: string | null;
          role?: string | null;
          avatar_url?: string | null;
          zone?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
      };
      partners: {
        Row: {
          id: string;
          company_id: string | null;
          code: string | null;
          name: string;
          trade_name: string | null;
          rif: string | null;
          type: string | null;
          address: string | null;
          city: string | null;
          zone: string | null;
          phone: string | null;
          whatsapp: string | null;
          email: string | null;
          credit_limit: number | null;
          current_balance: number | null;
          payment_terms: number | null;
          price_list: string | null;
          status: string | null;
          credit_status: string | null;
          assigned_user_id: string | null;
          last_visit_at: string | null;
          last_order_at: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          code?: string | null;
          name: string;
          trade_name?: string | null;
          rif?: string | null;
          type?: string | null;
          address?: string | null;
          city?: string | null;
          zone?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          email?: string | null;
          credit_limit?: number | null;
          current_balance?: number | null;
          payment_terms?: number | null;
          price_list?: string | null;
          status?: string | null;
          credit_status?: string | null;
          assigned_user_id?: string | null;
          last_visit_at?: string | null;
          last_order_at?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          code?: string | null;
          name?: string;
          trade_name?: string | null;
          rif?: string | null;
          type?: string | null;
          address?: string | null;
          city?: string | null;
          zone?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          email?: string | null;
          credit_limit?: number | null;
          current_balance?: number | null;
          payment_terms?: number | null;
          price_list?: string | null;
          status?: string | null;
          credit_status?: string | null;
          assigned_user_id?: string | null;
          last_visit_at?: string | null;
          last_order_at?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          company_id: string | null;
          sku: string | null;
          name: string;
          description: string | null;
          category: string | null;
          price_usd: number | null;
          cost_usd: number | null;
          stock_qty: number | null;
          min_stock: number | null;
          unit: string | null;
          image_url: string | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          sku?: string | null;
          name: string;
          description?: string | null;
          category?: string | null;
          price_usd?: number | null;
          cost_usd?: number | null;
          stock_qty?: number | null;
          min_stock?: number | null;
          unit?: string | null;
          image_url?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          sku?: string | null;
          name?: string;
          description?: string | null;
          category?: string | null;
          price_usd?: number | null;
          cost_usd?: number | null;
          stock_qty?: number | null;
          min_stock?: number | null;
          unit?: string | null;
          image_url?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
      };
      exchange_rates: {
        Row: {
          id: string;
          rate_bs: number;
          source: string | null;
          fetched_at: string | null;
        };
        Insert: {
          id?: string;
          rate_bs: number;
          source?: string | null;
          fetched_at?: string | null;
        };
        Update: {
          id?: string;
          rate_bs?: number;
          source?: string | null;
          fetched_at?: string | null;
        };
      };
      orders: {
        Row: {
          id: string;
          company_id: string | null;
          order_number: string | null;
          partner_id: string | null;
          user_id: string | null;
          subtotal_usd: number | null;
          total_usd: number | null;
          exchange_rate: number | null;
          total_bs: number | null;
          status: string | null;
          notes: string | null;
          delivery_date: string | null;
          confirmed_at: string | null;
          delivered_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          order_number?: string | null;
          partner_id?: string | null;
          user_id?: string | null;
          subtotal_usd?: number | null;
          total_usd?: number | null;
          exchange_rate?: number | null;
          total_bs?: number | null;
          status?: string | null;
          notes?: string | null;
          delivery_date?: string | null;
          confirmed_at?: string | null;
          delivered_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          order_number?: string | null;
          partner_id?: string | null;
          user_id?: string | null;
          subtotal_usd?: number | null;
          total_usd?: number | null;
          exchange_rate?: number | null;
          total_bs?: number | null;
          status?: string | null;
          notes?: string | null;
          delivery_date?: string | null;
          confirmed_at?: string | null;
          delivered_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string | null;
          product_id: string | null;
          qty: number;
          unit_price: number | null;
          discount: number | null;
          subtotal: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          product_id?: string | null;
          qty: number;
          unit_price?: number | null;
          discount?: number | null;
          subtotal?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          product_id?: string | null;
          qty?: number;
          unit_price?: number | null;
          discount?: number | null;
          subtotal?: number | null;
          created_at?: string | null;
        };
      };
      receivables: {
        Row: {
          id: string;
          company_id: string | null;
          order_id: string | null;
          partner_id: string | null;
          invoice_number: string | null;
          amount_usd: number | null;
          paid_usd: number | null;
          balance_usd: number | null;
          due_date: string | null;
          status: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          order_id?: string | null;
          partner_id?: string | null;
          invoice_number?: string | null;
          amount_usd?: number | null;
          paid_usd?: number | null;
          balance_usd?: number | null;
          due_date?: string | null;
          status?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          order_id?: string | null;
          partner_id?: string | null;
          invoice_number?: string | null;
          amount_usd?: number | null;
          paid_usd?: number | null;
          balance_usd?: number | null;
          due_date?: string | null;
          status?: string | null;
          created_at?: string | null;
        };
      };
      payments: {
        Row: {
          id: string;
          company_id: string | null;
          receivable_id: string | null;
          partner_id: string | null;
          collected_by: string | null;
          amount_usd: number | null;
          amount_bs: number | null;
          exchange_rate: number | null;
          payment_method: string | null;
          reference: string | null;
          status: string | null;
          verified_by: string | null;
          verified_at: string | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          receivable_id?: string | null;
          partner_id?: string | null;
          collected_by?: string | null;
          amount_usd?: number | null;
          amount_bs?: number | null;
          exchange_rate?: number | null;
          payment_method?: string | null;
          reference?: string | null;
          status?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          receivable_id?: string | null;
          partner_id?: string | null;
          collected_by?: string | null;
          amount_usd?: number | null;
          amount_bs?: number | null;
          exchange_rate?: number | null;
          payment_method?: string | null;
          reference?: string | null;
          status?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
      };
      activity_log: {
        Row: {
          id: string;
          company_id: string | null;
          entity_type: string | null;
          entity_id: string | null;
          user_id: string | null;
          type: string | null;
          content: string | null;
          is_read: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          user_id?: string | null;
          type?: string | null;
          content?: string | null;
          is_read?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          user_id?: string | null;
          type?: string | null;
          content?: string | null;
          is_read?: boolean | null;
          created_at?: string | null;
        };
      };
    };
  };
}
