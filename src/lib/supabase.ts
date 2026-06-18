import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
            profiles: {
                Row: {
                    id: string;
                    email: string;
                    full_name: string | null;
                    role: string;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    full_name?: string | null;
                    role?: string;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    full_name?: string | null;
                    role?: string;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            settings: {
                Row: {
                    id: string;
                    site_name: string;
                    site_description: string;
                    email: string;
                    phone: string;
                    address: string;
                    logo_url: string | null;
                    banner_url: string | null;
                    facebook_url: string | null;
                    instagram_url: string | null;
                    linkedin_url: string | null;
                    seo_title: string;
                    seo_description: string;
                    seo_keywords: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    site_name?: string;
                    site_description?: string;
                    email?: string;
                    phone?: string;
                    address?: string;
                    logo_url?: string | null;
                    banner_url?: string | null;
                    facebook_url?: string | null;
                    instagram_url?: string | null;
                    linkedin_url?: string | null;
                    seo_title?: string;
                    seo_description?: string;
                    seo_keywords?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
            recipes: {
                Row: {
                    id: string;
                    title: string;
                    slug: string;
                    description: string | null;
                    category: string;
                    season: string | null;
                    difficulty: string | null;
                    prep_time: number;
                    cook_time: number;
                    servings: number;
                    cost_per_serving: number;
                    image_url: string | null;
                    is_published: boolean;
                    is_featured: boolean;
                    calories_per_serving: number;
                    lipides: number;
                    glucides: number;
                    proteines: number;
                    fibres: number;
                    sel: number;
                    nutri_score: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    title: string;
                    slug: string;
                    category: string;
                    description?: string | null;
                    season?: string | null;
                    difficulty?: string | null;
                    prep_time?: number;
                    cook_time?: number;
                    servings?: number;
                    cost_per_serving?: number;
                    image_url?: string | null;
                    is_published?: boolean;
                    is_featured?: boolean;
                    calories_per_serving?: number;
                    lipides?: number;
                    glucides?: number;
                    proteines?: number;
                    fibres?: number;
                    sel?: number;
                    nutri_score?: string | null;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
            recipe_ingredients: {
                Row: {
                    id: string;
                    recipe_id: string;
                    name: string;
                    quantity: number;
                    unit: string;
                    cost: number;
                    allergens: string[];
                    calories: number;
                    lipides: number;
                    glucides: number;
                    proteines: number;
                    fibres: number;
                    sel: number;
                    created_at: string;
                };
                Insert: {
                    recipe_id: string;
                    name: string;
                    quantity?: number;
                    unit?: string;
                    cost?: number;
                    allergens?: string[];
                    calories?: number;
                    lipides?: number;
                    glucides?: number;
                    proteines?: number;
                    fibres?: number;
                    sel?: number;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
            recipe_steps: {
                Row: {
                    id: string;
                    recipe_id: string;
                    step_number: number;
                    instruction: string;
                    image_url: string | null;
                    created_at: string;
                };
                Insert: {
                    recipe_id: string;
                    step_number: number;
                    instruction: string;
                    image_url?: string | null;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
            technical_sheets: {
                Row: {
                    id: string;
                    title: string;
                    slug: string;
                    category: string;
                    description: string | null;
                    image_url: string | null;
                    total_cost: number;
                    selling_price: number;
                    margin_ratio: number;
                    portions: number;
                    cost_per_portion: number;
                    allergens: string[];
                    is_published: boolean;
                    calories_per_portion: number;
                    lipides: number;
                    glucides: number;
                    proteines: number;
                    fibres: number;
                    sel: number;
                    nutri_score: string | null;
                    preparation_time: number;
                    cooking_time: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    title: string;
                    slug: string;
                    category: string;
                    description?: string | null;
                    image_url?: string | null;
                    total_cost?: number;
                    selling_price?: number;
                    margin_ratio?: number;
                    portions?: number;
                    cost_per_portion?: number;
                    allergens?: string[];
                    is_published?: boolean;
                    calories_per_portion?: number;
                    lipides?: number;
                    glucides?: number;
                    proteines?: number;
                    fibres?: number;
                    sel?: number;
                    nutri_score?: string | null;
                    preparation_time?: number;
                    cooking_time?: number;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
            technical_sheet_ingredients: {
                Row: {
                    id: string;
                    technical_sheet_id: string;
                    name: string;
                    quantity: number;
                    unit: string;
                    cost: number;
                    allergens: string[];
                    calories: number;
                    lipides: number;
                    glucides: number;
                    proteines: number;
                    created_at: string;
                };
                Insert: {
                    technical_sheet_id: string;
                    name: string;
                    quantity?: number;
                    unit?: string;
                    cost?: number;
                    allergens?: string[];
                    calories?: number;
                    lipides?: number;
                    glucides?: number;
                    proteines?: number;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
            technical_sheet_steps: {
                Row: {
                    id: string;
                    technical_sheet_id: string;
                    step_number: number;
                    instruction: string;
                    image_url: string | null;
                    created_at: string;
                };
                Insert: {
                    technical_sheet_id: string;
                    step_number: number;
                    instruction: string;
                    image_url?: string | null;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
            menus: {
                Row: {
                    id: string;
                    title: string;
                    slug: string;
                    description: string | null;
                    category: string | null;
                    season: string | null;
                    price: number;
                    image_url: string | null;
                    is_published: boolean;
                    is_balanced: boolean;
                    total_calories: number;
                    avg_nutri_score: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    title: string;
                    slug: string;
                    description?: string | null;
                    category?: string | null;
                    season?: string | null;
                    price?: number;
                    image_url?: string | null;
                    is_published?: boolean;
                    is_balanced?: boolean;
                    total_calories?: number;
                    avg_nutri_score?: string | null;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
            menu_items: {
                Row: {
                    id: string;
                    menu_id: string;
                    recipe_id: string | null;
                    technical_sheet_id: string | null;
                    item_type: string | null;
                    custom_title: string | null;
                    custom_description: string | null;
                    position: number;
                    created_at: string;
                };
                Insert: {
                    menu_id: string;
                    recipe_id?: string | null;
                    technical_sheet_id?: string | null;
                    item_type?: string | null;
                    custom_title?: string | null;
                    custom_description?: string | null;
                    position: number;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
            cards: {
                Row: {
                    id: string;
                    title: string;
                    slug: string;
                    description: string | null;
                    category: string | null;
                    image_url: string | null;
                    is_published: boolean;
                    is_balanced: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    title: string;
                    slug: string;
                    description?: string | null;
                    category?: string | null;
                    image_url?: string | null;
                    is_published?: boolean;
                    is_balanced?: boolean;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
            card_sections: {
                Row: {
                    id: string;
                    card_id: string;
                    title: string;
                    description: string | null;
                    position: number;
                    created_at: string;
                };
                Insert: {
                    card_id: string;
                    title: string;
                    position: number;
                    description?: string | null;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
            card_section_items: {
                Row: {
                    id: string;
                    card_section_id: string;
                    recipe_id: string | null;
                    technical_sheet_id: string | null;
                    custom_title: string | null;
                    custom_description: string | null;
                    price: number;
                    position: number;
                    is_suggestion: boolean;
                    created_at: string;
                };
                Insert: {
                    card_section_id: string;
                    position: number;
                    recipe_id?: string | null;
                    technical_sheet_id?: string | null;
                    custom_title?: string | null;
                    custom_description?: string | null;
                    price?: number;
                    is_suggestion?: boolean;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
            haccp_records: {
                Row: {
                    id: string;
                    type: string;
                    title: string;
                    description: string | null;
                    status: string;
                    zone: string | null;
                    responsible_person: string | null;
                    temperature: number | null;
                    notes: string | null;
                    checklist_items: Json;
                    completed_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    type: string;
                    title: string;
                    description?: string | null;
                    status?: string;
                    zone?: string | null;
                    responsible_person?: string | null;
                    temperature?: number | null;
                    notes?: string | null;
                    checklist_items?: Json;
                    completed_at?: string | null;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
            missions: {
                Row: {
                    id: string;
                    title: string;
                    client_name: string;
                    client_email: string | null;
                    client_phone: string | null;
                    location: string | null;
                    start_date: string | null;
                    end_date: string | null;
                    status: string;
                    type: string;
                    daily_rate: number;
                    total_revenue: number;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    title: string;
                    client_name: string;
                    type: string;
                    status?: string;
                    client_email?: string | null;
                    client_phone?: string | null;
                    location?: string | null;
                    start_date?: string | null;
                    end_date?: string | null;
                    daily_rate?: number;
                    total_revenue?: number;
                    notes?: string | null;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
            revenues: {
                Row: {
                    id: string;
                    mission_id: string | null;
                    amount: number;
                    source: string | null;
                    description: string | null;
                    date_received: string;
                    payment_method: string | null;
                    invoice_number: string | null;
                    created_at: string;
                };
                Insert: {
                    amount: number;
                    date_received?: string;
                    mission_id?: string | null;
                    source?: string | null;
                    description?: string | null;
                    payment_method?: string | null;
                    invoice_number?: string | null;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
            comments: {
                Row: {
                    id: string;
                    author_name: string;
                    author_email: string | null;
                    rating: number | null;
                    content: string;
                    source: string | null;
                    is_approved: boolean;
                    is_public: boolean;
                    response: string | null;
                    recipe_id: string | null;
                    mission_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    author_name: string;
                    content: string;
                    author_email?: string | null;
                    rating?: number | null;
                    source?: string | null;
                    is_approved?: boolean;
                    is_public?: boolean;
                    response?: string | null;
                    recipe_id?: string | null;
                    mission_id?: string | null;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
            portfolio_items: {
                Row: {
                    id: string;
                    title: string;
                    description: string | null;
                    category: string;
                    image_url: string | null;
                    project_date: string | null;
                    client_name: string | null;
                    is_featured: boolean;
                    is_published: boolean;
                    position: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    title: string;
                    category: string;
                    position?: number;
                    description?: string | null;
                    image_url?: string | null;
                    project_date?: string | null;
                    client_name?: string | null;
                    is_featured?: boolean;
                    is_published?: boolean;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
            ai_generations: {
                Row: {
                    id: string;
                    type: string;
                    prompt: string | null;
                    result: Json;
                    is_used: boolean;
                    created_at: string;
                };
                Insert: {
                    type: string;
                    result: Json;
                    prompt?: string | null;
                    is_used?: boolean;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
            activity_logs: {
                Row: {
                    id: string;
                    action: string;
                    entity_type: string | null;
                    entity_id: string | null;
                    details: Json;
                    created_at: string;
                };
                Insert: {
                    action: string;
                    entity_type?: string | null;
                    entity_id?: string | null;
                    details?: Json;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
            notifications: {
                Row: {
                    id: string;
                    title: string;
                    message: string | null;
                    type: string;
                    is_read: boolean;
                    link: string | null;
                    created_at: string;
                };
                Insert: {
                    title: string;
                    type: string;
                    message?: string | null;
                    is_read?: boolean;
                    link?: string | null;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
            contact_submissions: {
                Row: {
                    id: string;
                    name: string;
                    email: string;
                    phone: string | null;
                    subject: string | null;
                    message: string;
                    is_read: boolean;
                    replied_at: string | null;
                    created_at: string;
                };
                Insert: {
                    name: string;
                    email: string;
                    message: string;
                    phone?: string | null;
                    subject?: string | null;
                    is_read?: boolean;
                    replied_at?: string | null;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
            services: {
                Row: {
                    id: string;
                    title: string;
                    description: string | null;
                    category: string;
                    price: number | null;
                    price_unit: string;
                    features: Json;
                    is_featured: boolean;
                    is_published: boolean;
                    position: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    title: string;
                    category: string;
                    price_unit?: string;
                    position?: number;
                    description?: string | null;
                    price?: number | null;
                    features?: Json;
                    is_featured?: boolean;
                    is_published?: boolean;
                };
                Update: {
                    [key: string]: unknown;
                };
            };
        };
    };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
