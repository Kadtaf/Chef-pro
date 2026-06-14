-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'editor', 'viewer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Settings
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name TEXT DEFAULT 'Chef Pro Bordeaux',
  site_description TEXT DEFAULT 'Chef de cuisine freelance a Bordeaux',
  email TEXT DEFAULT 'contact@chef-pro-bordeaux.fr',
  phone TEXT DEFAULT '+33 6 00 00 00 00',
  address TEXT DEFAULT 'Bordeaux, France',
  logo_url TEXT,
  banner_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  seo_title TEXT DEFAULT 'Chef Pro Bordeaux - Chef de Cuisine Freelance',
  seo_description TEXT DEFAULT 'Chef de cuisine freelance a Bordeaux. Second de cuisine independant, consultant culinaire.',
  seo_keywords TEXT DEFAULT 'chef de cuisine freelance Bordeaux, second de cuisine, consultant culinaire',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.settings (id) VALUES (gen_random_uuid());

-- Recipes table
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  season TEXT CHECK (season IN ('printemps', 'ete', 'automne', 'hiver', 'all')),
  difficulty TEXT CHECK (difficulty IN ('facile', 'moyen', 'difficile')),
  prep_time INTEGER DEFAULT 0,
  cook_time INTEGER DEFAULT 0,
  servings INTEGER DEFAULT 4,
  cost_per_serving DECIMAL(10,2) DEFAULT 0,
  image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  calories_per_serving DECIMAL(10,2) DEFAULT 0,
  lipides DECIMAL(10,2) DEFAULT 0,
  glucides DECIMAL(10,2) DEFAULT 0,
  proteines DECIMAL(10,2) DEFAULT 0,
  fibres DECIMAL(10,2) DEFAULT 0,
  sel DECIMAL(10,2) DEFAULT 0,
  nutri_score TEXT CHECK (nutri_score IN ('A', 'B', 'C', 'D', 'E')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingredients for recipes
CREATE TABLE public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 0,
  unit TEXT DEFAULT 'g',
  cost DECIMAL(10,2) DEFAULT 0,
  allergens TEXT[] DEFAULT '{}',
  calories DECIMAL(10,2) DEFAULT 0,
  lipides DECIMAL(10,2) DEFAULT 0,
  glucides DECIMAL(10,2) DEFAULT 0,
  proteines DECIMAL(10,2) DEFAULT 0,
  fibres DECIMAL(10,2) DEFAULT 0,
  sel DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe steps
CREATE TABLE public.recipe_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technical sheets
CREATE TABLE public.technical_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  total_cost DECIMAL(10,2) DEFAULT 0,
  selling_price DECIMAL(10,2) DEFAULT 0,
  margin_ratio DECIMAL(5,2) DEFAULT 0,
  portions INTEGER DEFAULT 1,
  cost_per_portion DECIMAL(10,2) DEFAULT 0,
  allergens TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  calories_per_portion DECIMAL(10,2) DEFAULT 0,
  lipides DECIMAL(10,2) DEFAULT 0,
  glucides DECIMAL(10,2) DEFAULT 0,
  proteines DECIMAL(10,2) DEFAULT 0,
  fibres DECIMAL(10,2) DEFAULT 0,
  sel DECIMAL(10,2) DEFAULT 0,
  nutri_score TEXT CHECK (nutri_score IN ('A', 'B', 'C', 'D', 'E')),
  preparation_time INTEGER DEFAULT 0,
  cooking_time INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technical sheet ingredients
CREATE TABLE public.technical_sheet_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technical_sheet_id UUID REFERENCES public.technical_sheets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 0,
  unit TEXT DEFAULT 'g',
  cost DECIMAL(10,2) DEFAULT 0,
  allergens TEXT[] DEFAULT '{}',
  calories DECIMAL(10,2) DEFAULT 0,
  lipides DECIMAL(10,2) DEFAULT 0,
  glucides DECIMAL(10,2) DEFAULT 0,
  proteines DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technical sheet steps
CREATE TABLE public.technical_sheet_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technical_sheet_id UUID REFERENCES public.technical_sheets(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menus
CREATE TABLE public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('gastronomique', 'business', 'evenementiel', 'saisonnier', 'du_jour')),
  season TEXT CHECK (season IN ('printemps', 'ete', 'automne', 'hiver', 'all')),
  price DECIMAL(10,2) DEFAULT 0,
  image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  is_balanced BOOLEAN DEFAULT false,
  total_calories DECIMAL(10,2) DEFAULT 0,
  avg_nutri_score TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID REFERENCES public.menus(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  technical_sheet_id UUID REFERENCES public.technical_sheets(id) ON DELETE SET NULL,
  item_type TEXT CHECK (item_type IN ('entree', 'plat', 'dessert', 'accompagnement', 'boisson')),
  custom_title TEXT,
  custom_description TEXT,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cards (Cartes)
CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('restaurant', 'traiteur', 'evenement', 'saisonniere')),
  image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  is_balanced BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Card sections
CREATE TABLE public.card_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Card section items
CREATE TABLE public.card_section_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_section_id UUID REFERENCES public.card_sections(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  technical_sheet_id UUID REFERENCES public.technical_sheets(id) ON DELETE SET NULL,
  custom_title TEXT,
  custom_description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  position INTEGER NOT NULL,
  is_suggestion BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HACCP
CREATE TABLE public.haccp_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('cleaning', 'temperature', 'delivery', 'traceability', 'checklist')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')),
  zone TEXT,
  responsible_person TEXT,
  temperature DECIMAL(5,2),
  notes TEXT,
  checklist_items JSONB DEFAULT '[]',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Missions (Freelance)
CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT CHECK (status IN ('en_attente', 'en_cours', 'terminee', 'annulee')),
  type TEXT CHECK (type IN ('chef', 'second', 'consulting', 'formation', 'evenementiel')),
  daily_rate DECIMAL(10,2) DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Revenues
CREATE TABLE public.revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  source TEXT,
  description TEXT,
  date_received DATE DEFAULT CURRENT_DATE,
  payment_method TEXT,
  invoice_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments/Reviews
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  author_email TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  source TEXT CHECK (source IN ('site', 'google', 'facebook', 'internal')),
  is_approved BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  response TEXT,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio
CREATE TABLE public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  image_url TEXT,
  project_date DATE,
  client_name TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI History
CREATE TABLE public.ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  prompt TEXT,
  result JSONB,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact form submissions
CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services (Tarifs)
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DECIMAL(10,2),
  price_unit TEXT DEFAULT 'jour',
  features JSONB DEFAULT '[]',
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_sheet_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_sheet_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_section_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.haccp_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles (admin only)
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_admin" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for settings (public read, admin write)
CREATE POLICY "settings_select_public" ON public.settings FOR SELECT USING (true);
CREATE POLICY "settings_all_admin" ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for recipes (public read published, admin all)
CREATE POLICY "recipes_select_published" ON public.recipes FOR SELECT USING (is_published = true OR auth.uid() IS NOT NULL);
CREATE POLICY "recipes_all_admin" ON public.recipes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for recipe_ingredients
CREATE POLICY "recipe_ingredients_select" ON public.recipe_ingredients FOR SELECT USING (true);
CREATE POLICY "recipe_ingredients_all_admin" ON public.recipe_ingredients FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for recipe_steps
CREATE POLICY "recipe_steps_select" ON public.recipe_steps FOR SELECT USING (true);
CREATE POLICY "recipe_steps_all_admin" ON public.recipe_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for technical_sheets
CREATE POLICY "technical_sheets_select_published" ON public.technical_sheets FOR SELECT USING (is_published = true OR auth.uid() IS NOT NULL);
CREATE POLICY "technical_sheets_all_admin" ON public.technical_sheets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for technical_sheet_ingredients
CREATE POLICY "technical_sheet_ingredients_select" ON public.technical_sheet_ingredients FOR SELECT USING (true);
CREATE POLICY "technical_sheet_ingredients_all_admin" ON public.technical_sheet_ingredients FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for technical_sheet_steps
CREATE POLICY "technical_sheet_steps_select" ON public.technical_sheet_steps FOR SELECT USING (true);
CREATE POLICY "technical_sheet_steps_all_admin" ON public.technical_sheet_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for menus
CREATE POLICY "menus_select_published" ON public.menus FOR SELECT USING (is_published = true OR auth.uid() IS NOT NULL);
CREATE POLICY "menus_all_admin" ON public.menus FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for menu_items
CREATE POLICY "menu_items_select" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "menu_items_all_admin" ON public.menu_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for cards
CREATE POLICY "cards_select_published" ON public.cards FOR SELECT USING (is_published = true OR auth.uid() IS NOT NULL);
CREATE POLICY "cards_all_admin" ON public.cards FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for card_sections
CREATE POLICY "card_sections_select" ON public.card_sections FOR SELECT USING (true);
CREATE POLICY "card_sections_all_admin" ON public.card_sections FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for card_section_items
CREATE POLICY "card_section_items_select" ON public.card_section_items FOR SELECT USING (true);
CREATE POLICY "card_section_items_all_admin" ON public.card_section_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for haccp_records (admin only)
CREATE POLICY "haccp_records_all_admin" ON public.haccp_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for missions (admin only)
CREATE POLICY "missions_all_admin" ON public.missions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for revenues (admin only)
CREATE POLICY "revenues_all_admin" ON public.revenues FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for comments (public read approved, admin all)
CREATE POLICY "comments_select_approved" ON public.comments FOR SELECT USING (is_approved = true AND is_public = true OR auth.uid() IS NOT NULL);
CREATE POLICY "comments_insert_public" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "comments_all_admin" ON public.comments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for portfolio_items (public read published)
CREATE POLICY "portfolio_select_published" ON public.portfolio_items FOR SELECT USING (is_published = true OR auth.uid() IS NOT NULL);
CREATE POLICY "portfolio_all_admin" ON public.portfolio_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for ai_generations (admin only)
CREATE POLICY "ai_generations_all_admin" ON public.ai_generations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for activity_logs (admin only)
CREATE POLICY "activity_logs_all_admin" ON public.activity_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for notifications (admin only)
CREATE POLICY "notifications_all_admin" ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for contact_submissions (admin only)
CREATE POLICY "contact_submissions_insert_public" ON public.contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "contact_submissions_all_admin" ON public.contact_submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for services (public read)
CREATE POLICY "services_select_public" ON public.services FOR SELECT USING (is_published = true OR auth.uid() IS NOT NULL);
CREATE POLICY "services_all_admin" ON public.services FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_recipes_category ON public.recipes(category);
CREATE INDEX idx_recipes_season ON public.recipes(season);
CREATE INDEX idx_recipes_published ON public.recipes(is_published);
CREATE INDEX idx_technical_sheets_category ON public.technical_sheets(category);
CREATE INDEX idx_missions_status ON public.missions(status);
CREATE INDEX idx_missions_dates ON public.missions(start_date, end_date);
CREATE INDEX idx_revenues_date ON public.revenues(date_received);
CREATE INDEX idx_comments_approved ON public.comments(is_approved);
CREATE INDEX idx_haccp_type ON public.haccp_records(type);
CREATE INDEX idx_haccp_status ON public.haccp_records(status);

-- Insert default services
INSERT INTO public.services (title, description, category, price, price_unit, features, is_published) VALUES
('Chef de Cuisine', 'Prestation de chef de cuisine pour votre etablissement', 'chef', 350, 'jour', '["Supervision equipe", "Creation de plats", "Gestion des stocks", "Controle qualite"]', true),
('Second de Cuisine', 'Rôle de second de cuisine', 'second', 280, 'jour', '["Support au chef", "Management brigade", "Gestion des services", "Formation equipe"]', true),
('Consulting Culinaire', 'Audit et conseil pour votre restaurant', 'consulting', 1200, 'forfait', '["Audit complet", "Plan d''action", "Suivi mensuel", "Support prioritaire"]', true),
('Formation', 'Formation de votre equipe culinaire', 'formation', 900, 'jour', '["Techniques gastronomiques", "Normes HACCP", "Gestion des couts", "Innovation"]', true),
('Evenementiel', 'Chef pour evenements prives', 'evenementiel', 500, 'jour', '["Menus personnalises", "Service a table", "Decoupe devant client", "Vaisselle incluse"]', true);
