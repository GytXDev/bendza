-- Script pour créer un utilisateur admin de test
-- Ce script doit être exécuté après avoir appliqué le schéma V2

-- 1. Créer un utilisateur admin de test
-- Note: Vous devez d'abord créer cet utilisateur via l'interface d'authentification
-- puis exécuter cette requête pour lui donner le rôle admin

-- Exemple pour un utilisateur existant (remplacez l'email par celui de votre admin)
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@bendza.com';

-- 2. Vérifier que l'utilisateur a bien le rôle admin
SELECT 
    id,
    email,
    name,
    role,
    is_creator,
    created_at
FROM public.users 
WHERE role = 'admin';