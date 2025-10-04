-- BENDZA V1 - Schéma simplifié
-- Version épurée pour une expérience fluide et orientée consommation

-- Table des utilisateurs (simplifiée)
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  name text,
  photourl text,
  is_creator boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- Table des créateurs (simplifiée - pas d'abonnements)
CREATE TABLE public.creators (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  bio text,
  bank_number text,
  bank_name text,
  phone_number text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT creators_pkey PRIMARY KEY (id),
  CONSTRAINT creators_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Table du contenu (simplifiée - prix fixe par contenu)
CREATE TABLE public.content (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid,
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type = ANY (ARRAY['video'::text, 'image'::text])),
  price integer NOT NULL DEFAULT 0, -- Prix fixe en centimes XOF
  url text NOT NULL, -- URL du fichier média
  thumbnail_url text, -- Miniature pour l'aperçu
  file_size integer,
  is_published boolean DEFAULT true,
  views_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT content_pkey PRIMARY KEY (id),
  CONSTRAINT content_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id)
);

-- Table des transactions (simplifiée - seulement achats unitaires)
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  content_id uuid,
  creator_id uuid,
  amount integer NOT NULL,
  currency text DEFAULT 'XOF'::text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'cancelled'::text, 'failed'::text, 'refunded'::text])),
  type text DEFAULT 'achat_unitaire'::text CHECK (type = ANY (ARRAY['achat_unitaire'::text, 'creator_activation'::text])),
  payment_method text NOT NULL CHECK (payment_method = ANY (ARRAY['mobile_money'::text, 'card'::text, 'bank_transfer'::text])),
  payment_reference text,
  transaction_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT transactions_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.content(id),
  CONSTRAINT transactions_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id)
);

-- Table des achats (pour tracker ce que l'utilisateur a acheté)
CREATE TABLE public.purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  content_id uuid,
  transaction_id uuid,
  amount_paid integer NOT NULL,
  purchased_at timestamp with time zone DEFAULT now(),
  CONSTRAINT purchases_pkey PRIMARY KEY (id),
  CONSTRAINT purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT purchases_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.content(id),
  CONSTRAINT purchases_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id),
  CONSTRAINT unique_user_content_purchase UNIQUE (user_id, content_id)
);

-- Table des paiements aux créateurs
CREATE TABLE public.payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid,
  amount integer NOT NULL,
  currency text DEFAULT 'XOF'::text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])),
  payment_method text NOT NULL CHECK (payment_method = ANY (ARRAY['mobile_money'::text, 'bank_transfer'::text])),
  payment_reference text,
  bank_details jsonb,
  requested_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payouts_pkey PRIMARY KEY (id),
  CONSTRAINT payouts_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id)
);

-- Table des notifications (simplifiée)
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info'::text CHECK (type = ANY (ARRAY['info'::text, 'success'::text, 'warning'::text, 'error'::text, 'payment'::text])),
  is_read boolean DEFAULT false,
  action_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Index pour optimiser les performances
CREATE INDEX idx_content_creator_id ON public.content(creator_id);
CREATE INDEX idx_content_created_at ON public.content(created_at DESC);
CREATE INDEX idx_content_published ON public.content(is_published);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_content_id ON public.transactions(content_id);
CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_purchases_content_id ON public.purchases(content_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- RLS (Row Level Security) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies pour les utilisateurs
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies pour les créateurs
CREATE POLICY "Anyone can view creator profiles" ON public.creators
  FOR SELECT USING (true);

CREATE POLICY "Creators can update their own profile" ON public.creators
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can create creator profile" ON public.creators
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour le contenu
CREATE POLICY "Anyone can view published content" ON public.content
  FOR SELECT USING (is_published = true);

CREATE POLICY "Creators can manage their own content" ON public.content
  FOR ALL USING (auth.uid() = creator_id);

-- Policies pour les transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour les achats
CREATE POLICY "Users can view their own purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create purchases" ON public.purchases
  FOR INSERT WITH CHECK (true);

-- Policies pour les paiements
CREATE POLICY "Creators can view their own payouts" ON public.payouts
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Creators can request payouts" ON public.payouts
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Policies pour les notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);
