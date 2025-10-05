-- Script de test pour vérifier les politiques RLS
-- Ce script permet de tester si les utilisateurs non connectés peuvent accéder au contenu

-- 1. Vérifier les politiques existantes sur la table content
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'content';

-- 2. Tester l'accès au contenu sans authentification
-- Cette requête devrait fonctionner même sans utilisateur connecté
SELECT 
    c.id,
    c.title,
    c.type,
    c.price,
    c.is_published,
    c.status,
    c.created_at,
    u.name as creator_name,
    u.is_creator
FROM content c
LEFT JOIN users u ON c.creator_id = u.id
WHERE c.is_published = true 
  AND c.status = 'approved'
ORDER BY c.created_at DESC
LIMIT 5;

-- 3. Vérifier les politiques sur la table users
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 4. Tester l'accès aux informations des créateurs
SELECT 
    id,
    name,
    email,
    photourl,
    is_creator
FROM users
WHERE is_creator = true
LIMIT 5;

-- 5. Vérifier si RLS est activé sur les tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('content', 'users', 'purchases')
  AND schemaname = 'public';

-- 6. Créer une politique temporaire pour permettre l'accès public au contenu
-- (À exécuter seulement si nécessaire)
-- CREATE POLICY "Public access to published content" ON public.content
--   FOR SELECT USING (is_published = true AND status = 'approved');

-- 7. Créer une politique temporaire pour permettre l'accès public aux informations des créateurs
-- (À exécuter seulement si nécessaire)
-- CREATE POLICY "Public access to creator info" ON public.users
--   FOR SELECT USING (true);
