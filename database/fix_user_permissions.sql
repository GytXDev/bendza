-- Script pour permettre l'accès aux informations utilisateur pour tous
-- Ce script permet à tous les utilisateurs (connectés ou non) de voir les informations publiques des créateurs

-- 1. Modifier la politique RLS pour la table users
-- Permettre la lecture des informations publiques des utilisateurs

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view public user info" ON public.users;

-- Créer une nouvelle politique pour permettre la lecture des informations publiques
CREATE POLICY "Anyone can view public user info" ON public.users
    FOR SELECT
    USING (true);

-- 2. Vérifier que la table users a les bonnes colonnes
-- (Ces colonnes devraient déjà exister d'après le schéma initial)
-- id, email, name, photourl, is_creator, created_at, updated_at

-- 3. S'assurer que les utilisateurs peuvent voir les informations des créateurs
-- dans les requêtes de contenu

-- Vérifier la politique sur la table content
DROP POLICY IF EXISTS "Anyone can view published content" ON public.content;

CREATE POLICY "Anyone can view published content" ON public.content
    FOR SELECT
    USING (is_published = true);

-- 4. Créer une vue pour faciliter l'accès aux informations publiques des utilisateurs
CREATE OR REPLACE VIEW public.user_public_info AS
SELECT 
    id,
    name,
    photourl,
    is_creator,
    created_at
FROM public.users;

-- 5. Permettre l'accès à cette vue pour tous
GRANT SELECT ON public.user_public_info TO anon, authenticated;

-- 6. Vérifier les permissions sur les tables liées
-- Table content - permettre la lecture des contenus publiés avec les infos créateur
DROP POLICY IF EXISTS "Anyone can view content with creator info" ON public.content;

CREATE POLICY "Anyone can view content with creator info" ON public.content
    FOR SELECT
    USING (is_published = true);

-- 7. S'assurer que les relations sont correctement configurées
-- La relation content -> users via creator_id devrait fonctionner

-- 8. Test de la configuration
-- Cette requête devrait fonctionner pour tous les utilisateurs :
-- SELECT 
--     c.*,
--     u.name as creator_name,
--     u.photourl as creator_photo,
--     u.is_creator
-- FROM public.content c
-- LEFT JOIN public.users u ON c.creator_id = u.id
-- WHERE c.is_published = true;

-- 9. Permissions supplémentaires pour les statistiques
-- Permettre la lecture des vues et statistiques
GRANT SELECT ON public.content TO anon, authenticated;

-- 10. Vérifier que les utilisateurs anonymes peuvent accéder aux données
-- Les utilisateurs non connectés (anon) doivent pouvoir voir :
-- - Les contenus publiés
-- - Les noms et photos des créateurs
-- - Les statistiques de base (vues, etc.)

COMMENT ON POLICY "Anyone can view public user info" ON public.users IS 
'Permet à tous les utilisateurs (connectés ou non) de voir les informations publiques des créateurs (nom, photo, statut créateur)';

COMMENT ON POLICY "Anyone can view published content" ON public.content IS 
'Permet à tous les utilisateurs de voir les contenus publiés avec les informations du créateur';
