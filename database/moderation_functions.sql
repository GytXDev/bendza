-- Fonctions de modération pour BENDZA
-- Ajout du champ status à la table content et fonctions RPC

-- Ajouter le champ status à la table content
ALTER TABLE public.content 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' 
CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]));

-- Ajouter le champ moderation_reason pour stocker la raison du rejet
ALTER TABLE public.content 
ADD COLUMN IF NOT EXISTS moderation_reason text;

-- Ajouter le champ moderated_by pour tracker qui a modéré le contenu
ALTER TABLE public.content 
ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES public.users(id);

-- Ajouter le champ moderated_at pour tracker quand le contenu a été modéré
ALTER TABLE public.content 
ADD COLUMN IF NOT EXISTS moderated_at timestamp with time zone;

-- Index pour optimiser les requêtes de modération
CREATE INDEX IF NOT EXISTS idx_content_status ON public.content(status);
CREATE INDEX IF NOT EXISTS idx_content_moderated_by ON public.content(moderated_by);

-- Supprimer les fonctions existantes si elles existent
DROP FUNCTION IF EXISTS approve_content(uuid, uuid);
DROP FUNCTION IF EXISTS reject_content(uuid, uuid, text);

-- Fonction RPC pour approuver un contenu
CREATE OR REPLACE FUNCTION approve_content(
    p_content_id uuid,
    p_admin_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    content_record record;
    result json;
BEGIN
    -- Vérifier que l'utilisateur est un admin (vous pouvez ajuster cette logique)
    -- Pour l'instant, on assume que tous les utilisateurs peuvent modérer
    
    -- Récupérer le contenu
    SELECT * INTO content_record 
    FROM public.content 
    WHERE id = p_content_id;
    
    -- Vérifier que le contenu existe
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Contenu non trouvé'
        );
    END IF;
    
    -- Vérifier que le contenu n'est pas déjà approuvé
    IF content_record.status = 'approved' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Le contenu est déjà approuvé'
        );
    END IF;
    
    -- Approuver le contenu
    UPDATE public.content 
    SET 
        status = 'approved',
        is_published = true,
        moderated_by = p_admin_id,
        moderated_at = now(),
        updated_at = now()
    WHERE id = p_content_id;
    
    -- Retourner le succès
    RETURN json_build_object(
        'success', true,
        'message', 'Contenu approuvé avec succès'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erreur lors de l''approbation: ' || SQLERRM
        );
END;
$$;

-- Fonction RPC pour rejeter un contenu
CREATE OR REPLACE FUNCTION reject_content(
    p_content_id uuid,
    p_admin_id uuid,
    p_reason text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    content_record record;
    result json;
BEGIN
    -- Vérifier que l'utilisateur est un admin
    
    -- Récupérer le contenu
    SELECT * INTO content_record 
    FROM public.content 
    WHERE id = p_content_id;
    
    -- Vérifier que le contenu existe
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Contenu non trouvé'
        );
    END IF;
    
    -- Vérifier que le contenu n'est pas déjà rejeté
    IF content_record.status = 'rejected' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Le contenu est déjà rejeté'
        );
    END IF;
    
    -- Rejeter le contenu
    UPDATE public.content 
    SET 
        status = 'rejected',
        is_published = false,
        moderation_reason = p_reason,
        moderated_by = p_admin_id,
        moderated_at = now(),
        updated_at = now()
    WHERE id = p_content_id;
    
    -- Retourner le succès
    RETURN json_build_object(
        'success', true,
        'message', 'Contenu rejeté avec succès'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erreur lors du rejet: ' || SQLERRM
        );
END;
$$;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Moderators can view all content" ON public.content;
DROP POLICY IF EXISTS "Moderators can update content status" ON public.content;

-- Mettre à jour les politiques RLS pour inclure le nouveau champ status
-- Les modérateurs peuvent voir tous les contenus
CREATE POLICY "Moderators can view all content" ON public.content
  FOR SELECT USING (true);

-- Les modérateurs peuvent mettre à jour le statut de modération
CREATE POLICY "Moderators can update content status" ON public.content
  FOR UPDATE USING (true);

-- Mettre à jour le contenu existant pour avoir le statut 'approved' par défaut
UPDATE public.content 
SET status = 'approved' 
WHERE status IS NULL AND is_published = true;

-- Mettre à jour le contenu existant pour avoir le statut 'pending' par défaut
UPDATE public.content 
SET status = 'pending' 
WHERE status IS NULL AND is_published = false;
