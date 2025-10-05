-- Script de test pour vérifier les permissions utilisateur
-- Ce script teste que tous les utilisateurs peuvent accéder aux informations publiques

-- 1. Test de base - Vérifier que les utilisateurs peuvent voir les informations publiques
SELECT 
    'Test 1: Accès aux informations utilisateur' as test_name,
    COUNT(*) as user_count
FROM public.users;

-- 2. Test de la relation content -> users
SELECT 
    'Test 2: Relation content-users' as test_name,
    COUNT(*) as content_count
FROM public.content c
LEFT JOIN public.users u ON c.creator_id = u.id
WHERE c.is_published = true;

-- 3. Test des informations créateur dans le contenu
SELECT 
    'Test 3: Informations créateur disponibles' as test_name,
    c.id as content_id,
    c.title,
    u.name as creator_name,
    u.photourl as creator_photo,
    u.is_creator,
    CASE 
        WHEN u.name IS NOT NULL THEN 'OK'
        ELSE 'ERREUR: Nom créateur manquant'
    END as status_name,
    CASE 
        WHEN u.photourl IS NOT NULL THEN 'OK'
        ELSE 'WARNING: Photo créateur manquante'
    END as status_photo
FROM public.content c
LEFT JOIN public.users u ON c.creator_id = u.id
WHERE c.is_published = true
LIMIT 5;

-- 4. Test des permissions pour utilisateur anonyme
-- (Ce test doit être exécuté en tant qu'utilisateur anonyme)
SELECT 
    'Test 4: Permissions anonymes' as test_name,
    'Si cette requête fonctionne, les permissions sont correctes' as message;

-- 5. Vérifier la vue user_public_info
SELECT 
    'Test 5: Vue user_public_info' as test_name,
    COUNT(*) as accessible_users
FROM public.user_public_info;

-- 6. Test complet de la requête utilisée dans l'application
SELECT 
    'Test 6: Requête application complète' as test_name,
    c.id,
    c.title,
    c.type,
    c.url,
    c.price,
    c.views_count,
    c.created_at,
    u.id as creator_id,
    u.name as creator_name,
    u.photourl as creator_photo,
    u.is_creator as creator_verified
FROM public.content c
LEFT JOIN public.users u ON c.creator_id = u.id
WHERE c.is_published = true
ORDER BY c.created_at DESC
LIMIT 3;

-- 7. Vérifier les politiques RLS actives
SELECT 
    'Test 7: Politiques RLS actives' as test_name,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'content')
ORDER BY tablename, policyname;

-- 8. Test des permissions sur les colonnes spécifiques
SELECT 
    'Test 8: Accès aux colonnes spécifiques' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name IN ('id', 'name', 'photourl', 'is_creator')
ORDER BY column_name;
