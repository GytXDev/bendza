-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.content (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid,
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type = ANY (ARRAY['video'::text, 'image'::text])),
  price integer NOT NULL DEFAULT 0,
  url text NOT NULL,
  thumbnail_url text,
  file_size integer,
  is_published boolean DEFAULT true,
  views_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  moderated_by uuid,
  moderated_at timestamp with time zone,
  rejection_reason text,
  moderation_reason text,
  CONSTRAINT content_pkey PRIMARY KEY (id),
  CONSTRAINT content_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id),
  CONSTRAINT content_moderated_by_fkey FOREIGN KEY (moderated_by) REFERENCES public.users(id)
);
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
  CONSTRAINT purchases_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id)
);
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
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  name text,
  photourl text,
  is_creator boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  role text DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'creator'::text, 'admin'::text])),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_id uuid NOT NULL,
  viewed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT views_pkey PRIMARY KEY (id),
  CONSTRAINT views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT views_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.content(id)
);

-- Fonction pour supprimer complètement un contenu et toutes ses dépendances
CREATE OR REPLACE FUNCTION delete_content_cascade(content_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
    deleted_purchases INTEGER := 0;
    deleted_transactions INTEGER := 0;
    deleted_media INTEGER := 0;
    deleted_views INTEGER := 0;
    deleted_content BOOLEAN := false;
    has_transactions INTEGER := 0;
    has_purchases INTEGER := 0;
BEGIN
    -- Initialiser le résultat
    result := json_build_object(
        'success', false,
        'content_id', content_id,
        'deleted_purchases', 0,
        'deleted_transactions', 0,
        'deleted_media', 0,
        'deleted_views', 0,
        'deleted_content', false,
        'error', null
    );

    -- Vérifier que le contenu existe
    IF NOT EXISTS (SELECT 1 FROM public.content WHERE id = content_id) THEN
        result := json_build_object(
            'success', false,
            'content_id', content_id,
            'error', 'Contenu non trouvé'
        );
        RETURN result;
    END IF;

    -- Vérifier s'il y a des transactions liées à ce contenu
    SELECT COUNT(*) INTO has_transactions
    FROM public.transactions 
    WHERE content_id = delete_content_cascade.content_id;

    -- Vérifier s'il y a des purchases liées à ce contenu
    SELECT COUNT(*) INTO has_purchases
    FROM public.purchases 
    WHERE content_id = delete_content_cascade.content_id;

    -- Si le contenu a des transactions ou des purchases, refuser la suppression
    IF has_transactions > 0 OR has_purchases > 0 THEN
        result := json_build_object(
            'success', false,
            'content_id', content_id,
            'error', 'Impossible de supprimer le contenu car il contient des transactions ou des achats actifs',
            'has_transactions', has_transactions,
            'has_purchases', has_purchases,
            'blocked', true
        );
        RETURN result;
    END IF;

    BEGIN
        -- 1. Supprimer d'abord les achats (ils référencent les transactions)
        DELETE FROM public.purchases 
        WHERE content_id = delete_content_cascade.content_id;
        
        GET DIAGNOSTICS deleted_purchases = ROW_COUNT;
        
        -- 2. Supprimer les transactions
        DELETE FROM public.transactions 
        WHERE content_id = delete_content_cascade.content_id;
        
        GET DIAGNOSTICS deleted_transactions = ROW_COUNT;
        
        -- 3. Supprimer les médias multiples
        DELETE FROM public.content_media 
        WHERE content_id = delete_content_cascade.content_id;
        
        GET DIAGNOSTICS deleted_media = ROW_COUNT;
        
        -- 4. Supprimer les vues
        DELETE FROM public.views 
        WHERE content_id = delete_content_cascade.content_id;
        
        GET DIAGNOSTICS deleted_views = ROW_COUNT;
        
        -- 5. Supprimer le contenu principal
        DELETE FROM public.content 
        WHERE id = delete_content_cascade.content_id;
        
        GET DIAGNOSTICS deleted_content = ROW_COUNT;
        deleted_content := (deleted_content > 0);
        
        -- Construire le résultat de succès
        result := json_build_object(
            'success', true,
            'content_id', content_id,
            'deleted_purchases', deleted_purchases,
            'deleted_transactions', deleted_transactions,
            'deleted_media', deleted_media,
            'deleted_views', deleted_views,
            'deleted_content', deleted_content,
            'error', null
        );
        
    EXCEPTION WHEN OTHERS THEN
        -- En cas d'erreur, marquer le contenu comme rejeté (soft delete)
        BEGIN
            UPDATE public.content 
            SET 
                status = 'rejected',
                is_published = false,
                updated_at = NOW()
            WHERE id = delete_content_cascade.content_id;
            
            -- Construire le résultat avec soft delete
            result := json_build_object(
                'success', true,
                'content_id', content_id,
                'deleted_purchases', deleted_purchases,
                'deleted_transactions', deleted_transactions,
                'deleted_media', deleted_media,
                'deleted_views', deleted_views,
                'deleted_content', false,
                'soft_deleted', true,
                'error', SQLERRM
            );
            
        EXCEPTION WHEN OTHERS THEN
            -- Si même le soft delete échoue, retourner l'erreur
            result := json_build_object(
                'success', false,
                'content_id', content_id,
                'deleted_purchases', deleted_purchases,
                'deleted_transactions', deleted_transactions,
                'deleted_media', deleted_media,
                'deleted_views', deleted_views,
                'deleted_content', false,
                'error', SQLERRM
            );
        END;
    END;
    
    RETURN result;
END;
$$;

-- Permissions pour la fonction de suppression
GRANT EXECUTE ON FUNCTION delete_content_cascade(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_content_cascade(UUID) TO service_role;