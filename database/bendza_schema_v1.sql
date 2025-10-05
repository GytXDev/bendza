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

-- ========================================
-- BENDZA Schema V2 - Améliorations pour la modération et les rôles
-- Ce script met à jour le schéma existant avec les nouvelles fonctionnalités
-- ========================================

-- 1. Ajouter le champ 'role' à la table users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'creator', 'admin'));

-- 2. Ajouter le champ 'status' à la table content pour la modération
ALTER TABLE public.content 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- 3. Ajouter le champ 'moderated_by' pour tracker qui a modéré le contenu
ALTER TABLE public.content 
ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES public.users(id);

-- 4. Ajouter le champ 'moderated_at' pour la date de modération
ALTER TABLE public.content 
ADD COLUMN IF NOT EXISTS moderated_at timestamp with time zone;

-- 5. Ajouter le champ 'rejection_reason' pour expliquer les rejets
ALTER TABLE public.content 
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 6. Mettre à jour la table notifications existante pour la modération
-- Supprimer l'ancienne table notifications et la recréer avec la nouvelle structure
DROP TABLE IF EXISTS public.notifications CASCADE;
CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('content_approved', 'content_rejected', 'payment_received', 'new_follower')),
    title text NOT NULL,
    message text NOT NULL,
    data jsonb, -- Données supplémentaires (ID du contenu, montant, etc.)
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- 7. Créer la table views pour tracker les vues (équivalent à un paiement)
CREATE TABLE IF NOT EXISTS public.views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    viewed_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, content_id) -- Un utilisateur ne peut voir qu'une fois le même contenu
);

-- 8. Mettre à jour les politiques RLS pour les nouvelles tables

-- Politique pour notifications (utilisateurs voient leurs propres notifications)
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR ALL
    USING (auth.uid() = user_id);

-- Politique pour views (utilisateurs peuvent créer leurs propres vues)
DROP POLICY IF EXISTS "Users can create their own views" ON public.views;
CREATE POLICY "Users can create their own views" ON public.views
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Politique pour views (utilisateurs peuvent voir leurs propres vues)
DROP POLICY IF EXISTS "Users can view their own views" ON public.views;
CREATE POLICY "Users can view their own views" ON public.views
    FOR SELECT
    USING (auth.uid() = user_id);

-- 9. Mettre à jour la politique content pour la modération
DROP POLICY IF EXISTS "Anyone can view published content" ON public.content;
CREATE POLICY "Anyone can view approved content" ON public.content
    FOR SELECT
    USING (status = 'approved' AND is_published = true);

-- Politique pour que les créateurs voient leurs propres contenus (même en attente)
DROP POLICY IF EXISTS "Creators can view their own content" ON public.content;
CREATE POLICY "Creators can view their own content" ON public.content
    FOR SELECT
    USING (auth.uid() = creator_id);

-- Politique pour que les admins voient tous les contenus
DROP POLICY IF EXISTS "Admins can view all content" ON public.content;
CREATE POLICY "Admins can view all content" ON public.content
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 10. Politique pour que les admins puissent modifier le statut des contenus
DROP POLICY IF EXISTS "Admins can moderate content" ON public.content;
CREATE POLICY "Admins can moderate content" ON public.content
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 11. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_content_status ON public.content(status);
CREATE INDEX IF NOT EXISTS idx_content_creator_status ON public.content(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_views_user_content ON public.views(user_id, content_id);

-- 12. Créer une fonction pour créer une notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id uuid,
    p_type text,
    p_title text,
    p_message text,
    p_data jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id uuid;
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (p_user_id, p_type, p_title, p_message, p_data)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- 13. Créer une fonction pour approuver un contenu
CREATE OR REPLACE FUNCTION approve_content(
    p_content_id uuid,
    p_admin_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    content_creator_id uuid;
BEGIN
    -- Vérifier que l'utilisateur est admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = p_admin_id AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'User is not an admin';
    END IF;
    
    -- Récupérer le créateur du contenu
    SELECT creator_id INTO content_creator_id
    FROM public.content
    WHERE id = p_content_id;
    
    -- Mettre à jour le statut du contenu
    UPDATE public.content
    SET 
        status = 'approved',
        moderated_by = p_admin_id,
        moderated_at = now(),
        is_published = true
    WHERE id = p_content_id;
    
    -- Créer une notification pour le créateur
    PERFORM create_notification(
        content_creator_id,
        'content_approved',
        'Contenu approuvé',
        'Votre contenu a été approuvé et est maintenant visible par tous les utilisateurs.',
        jsonb_build_object('content_id', p_content_id)
    );
    
    RETURN true;
END;
$$;

-- 14. Créer une fonction pour rejeter un contenu
CREATE OR REPLACE FUNCTION reject_content(
    p_content_id uuid,
    p_admin_id uuid,
    p_rejection_reason text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    content_creator_id uuid;
BEGIN
    -- Vérifier que l'utilisateur est admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = p_admin_id AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'User is not an admin';
    END IF;
    
    -- Récupérer le créateur du contenu
    SELECT creator_id INTO content_creator_id
    FROM public.content
    WHERE id = p_content_id;
    
    -- Mettre à jour le statut du contenu
    UPDATE public.content
    SET 
        status = 'rejected',
        moderated_by = p_admin_id,
        moderated_at = now(),
        rejection_reason = p_rejection_reason,
        is_published = false
    WHERE id = p_content_id;
    
    -- Créer une notification pour le créateur
    PERFORM create_notification(
        content_creator_id,
        'content_rejected',
        'Contenu rejeté',
        'Votre contenu a été rejeté. Raison: ' || p_rejection_reason,
        jsonb_build_object('content_id', p_content_id, 'reason', p_rejection_reason)
    );
    
    RETURN true;
END;
$$;

-- 15. Créer une fonction pour enregistrer une vue (paiement)
CREATE OR REPLACE FUNCTION record_view(
    p_user_id uuid,
    p_content_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    content_creator_id uuid;
    content_price numeric;
BEGIN
    -- Récupérer les informations du contenu
    SELECT creator_id, price INTO content_creator_id, content_price
    FROM public.content
    WHERE id = p_content_id AND status = 'approved' AND is_published = true;
    
    -- Vérifier que le contenu existe et est approuvé
    IF content_creator_id IS NULL THEN
        RAISE EXCEPTION 'Content not found or not approved';
    END IF;
    
    -- Vérifier que l'utilisateur n'est pas le créateur
    IF p_user_id = content_creator_id THEN
        -- Le créateur peut voir son propre contenu gratuitement
        RETURN true;
    END IF;
    
    -- Vérifier que l'utilisateur n'a pas déjà vu ce contenu
    IF EXISTS (
        SELECT 1 FROM public.views 
        WHERE user_id = p_user_id AND content_id = p_content_id
    ) THEN
        RETURN true; -- Déjà vu, pas de nouveau paiement
    END IF;
    
    -- Enregistrer la vue
    INSERT INTO public.views (user_id, content_id)
    VALUES (p_user_id, p_content_id);
    
    -- Créer une notification pour le créateur
    PERFORM create_notification(
        content_creator_id,
        'payment_received',
        'Nouveau paiement reçu',
        'Un utilisateur a visionné votre contenu pour ' || content_price || ' FCFA.',
        jsonb_build_object('content_id', p_content_id, 'amount', content_price)
    );
    
    RETURN true;
END;
$$;

-- 16. Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION approve_content TO authenticated;
GRANT EXECUTE ON FUNCTION reject_content TO authenticated;
GRANT EXECUTE ON FUNCTION record_view TO authenticated;

-- 17. Commentaires pour la documentation
COMMENT ON COLUMN public.users.role IS 'Rôle de l''utilisateur: user, creator, ou admin';
COMMENT ON COLUMN public.content.status IS 'Statut de modération: pending, approved, ou rejected';
COMMENT ON COLUMN public.content.moderated_by IS 'ID de l''admin qui a modéré le contenu';
COMMENT ON COLUMN public.content.moderated_at IS 'Date et heure de la modération';
COMMENT ON COLUMN public.content.rejection_reason IS 'Raison du rejet si le contenu a été rejeté';

COMMENT ON TABLE public.notifications IS 'Notifications pour les utilisateurs (approbation, rejet, paiements)';
COMMENT ON TABLE public.views IS 'Vues des contenus (équivalent à un paiement unique)';