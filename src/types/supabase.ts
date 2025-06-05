export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      action_logs: {
        Row: {
          action: string
          created_at: string
          deleted_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          log_date: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          deleted_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          log_date?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          deleted_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          log_date?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      colors: {
        Row: {
          created_at: string
          deleted_at: string | null
          hex_code: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          hex_code?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          hex_code?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_referrals: {
        Row: {
          created_at: string
          customer_id: string
          deleted_at: string | null
          id: string
          referral_date: string
          referred_by_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          deleted_at?: string | null
          id?: string
          referral_date?: string
          referred_by_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          deleted_at?: string | null
          id?: string
          referral_date?: string
          referred_by_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_referrals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_referrals_referred_by_id_fkey"
            columns: ["referred_by_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: Json | null
          cpf: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          cpf?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          cpf?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      customization_component_categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      customization_components: {
        Row: {
          category_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          type_id: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          type_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customization_components_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "customization_component_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customization_components_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "customization_types"
            referencedColumns: ["id"]
          },
        ]
      }
      customization_options: {
        Row: {
          component_id: string
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          price_adjustment: number
          updated_at: string
        }
        Insert: {
          component_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          price_adjustment?: number
          updated_at?: string
        }
        Update: {
          component_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          price_adjustment?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customization_options_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "customization_components"
            referencedColumns: ["id"]
          },
        ]
      }
      customization_types: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          created_at: string
          deleted_at: string | null
          delivered_date: string | null
          delivery_number: string
          dispatched_date: string | null
          id: string
          notes: string | null
          order_id: string
          route_id: string | null
          scheduled_date: string | null
          status_id: string | null
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          delivered_date?: string | null
          delivery_number: string
          dispatched_date?: string | null
          id?: string
          notes?: string | null
          order_id: string
          route_id?: string | null
          scheduled_date?: string | null
          status_id?: string | null
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          delivered_date?: string | null
          delivery_number?: string
          dispatched_date?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          route_id?: string | null
          scheduled_date?: string | null
          status_id?: string | null
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "delivery_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "global_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_routes: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          estimated_time_minutes: number | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          estimated_time_minutes?: number | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          estimated_time_minutes?: number | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_history: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          employee_id: string
          event_date: string
          event_type: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          employee_id: string
          event_date?: string
          event_type: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          employee_id?: string
          event_date?: string
          event_type?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_training_progress: {
        Row: {
          completion_date: string | null
          created_at: string
          deleted_at: string | null
          employee_id: string
          id: string
          material_id: string
          score: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          completion_date?: string | null
          created_at?: string
          deleted_at?: string | null
          employee_id: string
          id?: string
          material_id: string
          score?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          completion_date?: string | null
          created_at?: string
          deleted_at?: string | null
          employee_id?: string
          id?: string
          material_id?: string
          score?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_training_progress_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_training_progress_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "training_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: Json | null
          contact_info: Json | null
          cpf: string
          created_at: string
          deleted_at: string | null
          employment_type_id: string | null
          hire_date: string
          id: string
          name: string
          role: string | null
          salary: number | null
          status: string | null
          termination_date: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: Json | null
          contact_info?: Json | null
          cpf: string
          created_at?: string
          deleted_at?: string | null
          employment_type_id?: string | null
          hire_date: string
          id?: string
          name: string
          role?: string | null
          salary?: number | null
          status?: string | null
          termination_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: Json | null
          contact_info?: Json | null
          cpf?: string
          created_at?: string
          deleted_at?: string | null
          employment_type_id?: string | null
          hire_date?: string
          id?: string
          name?: string
          role?: string | null
          salary?: number | null
          status?: string | null
          termination_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_employment_type_id_fkey"
            columns: ["employment_type_id"]
            isOneToOne: false
            referencedRelation: "employment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_types: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      fabric_textures: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          parent_id: string | null
          type_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          type_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_categories_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "transaction_types"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_statuses: {
        Row: {
          color: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_method_id: string | null
          reference_id: string | null
          reference_type: string | null
          status_id: string | null
          transaction_date: string
          type_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status_id?: string | null
          transaction_date?: string
          type_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status_id?: string | null
          transaction_date?: string
          type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "financial_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "transaction_types"
            referencedColumns: ["id"]
          },
        ]
      }
      global_statuses: {
        Row: {
          color: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_system: boolean
          module: string | null
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          module?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          module?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_groups: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          location_id: string
          material_id: string
          min_quantity: number
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          location_id: string
          material_id: string
          min_quantity?: number
          quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          location_id?: string
          material_id?: string
          min_quantity?: number
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "inventory_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_locations: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          item_id: string
          movement_date: string
          notes: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          type: Database["public"]["Enums"]["inventory_movement_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          item_id: string
          movement_date?: string
          notes?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          type: Database["public"]["Enums"]["inventory_movement_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          item_id?: string
          movement_date?: string
          notes?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          type?: Database["public"]["Enums"]["inventory_movement_type"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leaves: {
        Row: {
          approval_date: string | null
          approver_id: string | null
          created_at: string
          deleted_at: string | null
          employee_id: string
          end_date: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          notes: string | null
          request_date: string
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string
        }
        Insert: {
          approval_date?: string | null
          approver_id?: string | null
          created_at?: string
          deleted_at?: string | null
          employee_id: string
          end_date: string
          id?: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          notes?: string | null
          request_date?: string
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Update: {
          approval_date?: string | null
          approver_id?: string | null
          created_at?: string
          deleted_at?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          notes?: string | null
          request_date?: string
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaves_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          created_at: string
          default_cost: number | null
          deleted_at: string | null
          description: string | null
          group_id: string | null
          id: string
          name: string
          reference: string | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_cost?: number | null
          deleted_at?: string | null
          description?: string | null
          group_id?: string | null
          id?: string
          name: string
          reference?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_cost?: number | null
          deleted_at?: string | null
          description?: string | null
          group_id?: string | null
          id?: string
          name?: string
          reference?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "inventory_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "measurement_units"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_units: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          symbol: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          symbol: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_read: boolean
          message: string
          notification_date: string
          reference_url: string | null
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          notification_date?: string
          reference_url?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          notification_date?: string
          reference_url?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          customizations: Json | null
          deleted_at: string | null
          id: string
          notes: string | null
          order_id: string
          product_id: string
          quantity: number
          total_price: number | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customizations?: Json | null
          deleted_at?: string | null
          id?: string
          notes?: string | null
          order_id: string
          product_id: string
          quantity: number
          total_price?: number | null
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customizations?: Json | null
          deleted_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string
          quantity?: number
          total_price?: number | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          channel_id: string | null
          created_at: string
          customer_id: string
          deleted_at: string | null
          discount_amount: number | null
          final_amount: number | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          shipping_address: Json | null
          shipping_amount: number | null
          status_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          channel_id?: string | null
          created_at?: string
          customer_id: string
          deleted_at?: string | null
          discount_amount?: number | null
          final_amount?: number | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          shipping_address?: Json | null
          shipping_amount?: number | null
          status_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          channel_id?: string | null
          created_at?: string
          customer_id?: string
          deleted_at?: string | null
          discount_amount?: number | null
          final_amount?: number | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          shipping_address?: Json | null
          shipping_amount?: number | null
          status_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "sales_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "global_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      packaging_types: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      priority_settings: {
        Row: {
          color: string | null
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      product_bundle_items: {
        Row: {
          bundle_id: string
          created_at: string
          deleted_at: string | null
          id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          bundle_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          product_id: string
          quantity: number
          updated_at?: string
        }
        Update: {
          bundle_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "product_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_bundle_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_bundles: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          parent_category_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          parent_category_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_category_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_collections: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          season: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          season?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          season?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      product_customization_components: {
        Row: {
          component_id: string
          created_at: string
          deleted_at: string | null
          id: string
          is_required: boolean
          product_id: string
          updated_at: string
        }
        Insert: {
          component_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_required?: boolean
          product_id: string
          updated_at?: string
        }
        Update: {
          component_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_required?: boolean
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_customization_components_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "customization_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_customization_components_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_materials: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          material_id: string
          production_order_id: string
          quantity_required: number
          quantity_used: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          material_id: string
          production_order_id: string
          quantity_required: number
          quantity_used?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          material_id?: string
          production_order_id?: string
          quantity_required?: number
          quantity_used?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_materials_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_orders: {
        Row: {
          actual_end_date: string | null
          actual_start_date: string | null
          created_at: string
          current_stage_id: string | null
          deleted_at: string | null
          estimated_end_date: string | null
          estimated_start_date: string | null
          id: string
          notes: string | null
          order_id: string
          priority_id: string | null
          production_order_number: string
          status_id: string | null
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          created_at?: string
          current_stage_id?: string | null
          deleted_at?: string | null
          estimated_end_date?: string | null
          estimated_start_date?: string | null
          id?: string
          notes?: string | null
          order_id: string
          priority_id?: string | null
          production_order_number: string
          status_id?: string | null
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          created_at?: string
          current_stage_id?: string | null
          deleted_at?: string | null
          estimated_end_date?: string | null
          estimated_start_date?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          priority_id?: string | null
          production_order_number?: string
          status_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "production_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_priority_id_fkey"
            columns: ["priority_id"]
            isOneToOne: false
            referencedRelation: "priority_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "global_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      production_priority_history: {
        Row: {
          change_date: string
          created_at: string
          deleted_at: string | null
          id: string
          priority_id: string
          production_order_id: string
          reason: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          change_date?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          priority_id: string
          production_order_id: string
          reason?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          change_date?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          priority_id?: string
          production_order_id?: string
          reason?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_priority_history_priority_id_fkey"
            columns: ["priority_id"]
            isOneToOne: false
            referencedRelation: "priority_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_priority_history_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_priority_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      production_stage_history: {
        Row: {
          created_at: string
          deleted_at: string | null
          end_date: string | null
          id: string
          notes: string | null
          production_order_id: string
          stage_id: string
          start_date: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          production_order_id: string
          stage_id: string
          start_date?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          production_order_id?: string
          stage_id?: string
          start_date?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_stage_history_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_stage_history_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "production_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_stage_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      production_stages: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          base_price: number
          category_id: string | null
          collection_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          dimensions: Json | null
          id: string
          is_active: boolean
          name: string
          reference: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          base_price?: number
          category_id?: string | null
          collection_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          is_active?: boolean
          name: string
          reference?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          base_price?: number
          category_id?: string | null
          collection_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          reference?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "product_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          material_id: string
          notes: string | null
          purchase_order_id: string
          quantity: number
          received_quantity: number | null
          total_price: number | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          material_id: string
          notes?: string | null
          purchase_order_id: string
          quantity: number
          received_quantity?: number | null
          total_price?: number | null
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          material_id?: string
          notes?: string | null
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number | null
          total_price?: number | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          actual_delivery_date: string | null
          created_at: string
          deleted_at: string | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          payment_terms: string | null
          purchase_order_number: string
          purchase_request_id: string | null
          status_id: string | null
          supplier_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          actual_delivery_date?: string | null
          created_at?: string
          deleted_at?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          payment_terms?: string | null
          purchase_order_number: string
          purchase_request_id?: string | null
          status_id?: string | null
          supplier_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          actual_delivery_date?: string | null
          created_at?: string
          deleted_at?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          payment_terms?: string | null
          purchase_order_number?: string
          purchase_request_id?: string | null
          status_id?: string | null
          supplier_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_purchase_request_id_fkey"
            columns: ["purchase_request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "global_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_request_items: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          material_id: string
          notes: string | null
          quantity: number
          request_id: string
          updated_at: string
          urgency: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          material_id: string
          notes?: string | null
          quantity: number
          request_id: string
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          material_id?: string
          notes?: string | null
          quantity?: number
          request_id?: string
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_request_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requests: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          notes: string | null
          request_date: string
          request_number: string
          requester_id: string | null
          required_date: string | null
          status_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          request_date?: string
          request_number: string
          requester_id?: string | null
          required_date?: string | null
          status_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          request_date?: string
          request_number?: string
          requester_id?: string | null
          required_date?: string | null
          status_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "global_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_channels: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sizes: {
        Row: {
          code: string
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          order: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          order?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      supplier_materials: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          lead_time_days: number | null
          material_id: string
          price: number | null
          supplier_id: string
          supplier_material_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          lead_time_days?: number | null
          material_id: string
          price?: number | null
          supplier_id: string
          supplier_material_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          lead_time_days?: number | null
          material_id?: string
          price?: number | null
          supplier_id?: string
          supplier_material_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_materials_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_types: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: Json | null
          cnpj: string | null
          company_name: string | null
          contact_info: Json | null
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          name: string
          supplier_type_id: string | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          cnpj?: string | null
          company_name?: string | null
          contact_info?: Json | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          supplier_type_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          cnpj?: string | null
          company_name?: string | null
          contact_info?: Json | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          supplier_type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_supplier_type_id_fkey"
            columns: ["supplier_type_id"]
            isOneToOne: false
            referencedRelation: "supplier_types"
            referencedColumns: ["id"]
          },
        ]
      }
      system_modules: {
        Row: {
          code: string
          created_at: string
          deleted_at: string | null
          icon: string | null
          id: string
          name: string
          order: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          deleted_at?: string | null
          icon?: string | null
          id?: string
          name: string
          order?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          deleted_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      time_tracking: {
        Row: {
          break_end: string | null
          break_start: string | null
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          deleted_at: string | null
          employee_id: string
          id: string
          notes: string | null
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date: string
          deleted_at?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          deleted_at?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_tracking_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      training_materials: {
        Row: {
          content_body: string | null
          content_type: string | null
          content_url: string | null
          created_at: string
          deleted_at: string | null
          estimated_duration_minutes: number | null
          id: string
          module_id: string
          order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          content_body?: string | null
          content_type?: string | null
          content_url?: string | null
          created_at?: string
          deleted_at?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          module_id: string
          order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          content_body?: string | null
          content_type?: string | null
          content_url?: string | null
          created_at?: string
          deleted_at?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          module_id?: string
          order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_materials_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      training_modules: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      transaction_types: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_expense: boolean
          is_income: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_expense?: boolean
          is_income?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_expense?: boolean
          is_income?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          deleted_at: string | null
          id: string
          module_id: string
          role_id: string
          updated_at: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          module_id: string
          role_id: string
          updated_at?: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          module_id?: string
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "system_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          is_active: boolean
          name: string | null
          role_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email: string
          id: string
          is_active?: boolean
          name?: string | null
          role_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
          role_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
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
      inventory_movement_type: "IN" | "OUT" | "ADJUSTMENT"
      leave_status: "REQUESTED" | "APPROVED" | "REJECTED" | "TAKEN"
      leave_type: "VACATION" | "SICK_LEAVE" | "UNPAID_LEAVE" | "OTHER"
      notification_type: "INFO" | "WARNING" | "ERROR" | "SUCCESS" | "TASK"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      inventory_movement_type: ["IN", "OUT", "ADJUSTMENT"],
      leave_status: ["REQUESTED", "APPROVED", "REJECTED", "TAKEN"],
      leave_type: ["VACATION", "SICK_LEAVE", "UNPAID_LEAVE", "OTHER"],
      notification_type: ["INFO", "WARNING", "ERROR", "SUCCESS", "TASK"],
    },
  },
} as const
