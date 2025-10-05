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

-- 3. Si vous voulez créer un utilisateur admin directement (pour les tests)
-- ATTENTION: Cette méthode ne fonctionne que si l'utilisateur existe déjà dans auth.users
INSERT INTO public.users (
    id,
    email,
    name,
    role,
    is_creator,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- Remplacez par un UUID valide
    'admin@bendza.com',
    'Administrateur Bendza',
    'admin',
    true,
    now(),
    now()
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    updated_at = now();

-- 4. Vérifier les permissions admin
SELECT 
    'Admin user created successfully' as status,
    COUNT(*) as admin_count
FROM public.users 
WHERE role = 'admin';

-- 5. Test des fonctions admin
-- Tester la fonction d'approbation (nécessite un contenu en attente)
-- SELECT approve_content('content-id-here', 'admin-user-id-here');

-- Tester la fonction de rejet (nécessite un contenu en attente)
-- SELECT reject_content('content-id-here', 'admin-user-id-here', 'Contenu inapproprié');

-- 6. Vérifier que les politiques RLS fonctionnent
-- Les admins devraient pouvoir voir tous les contenus
SELECT 
    'RLS policies test' as test_name,
    COUNT(*) as total_content
FROM public.content;

-- 7. Instructions pour l'utilisation
/*
INSTRUCTIONS POUR CRÉER UN ADMIN :

1. Créez d'abord un compte utilisateur normal via l'interface d'inscription
2. Notez l'email de cet utilisateur
3. Exécutez cette requête en remplaçant l'email :
   UPDATE public.users SET role = 'admin' WHERE email = 'votre-email@admin.com';
4. L'utilisateur aura maintenant accès au panneau de modération

FONCTIONNALITÉS ADMIN :
- Accès au panneau de modération (/moderation)
- Peut approuver ou rejeter les contenus en attente
- Peut voir tous les contenus (même non approuvés)
- Reçoit des notifications pour les actions de modération

SÉCURITÉ :
- Seuls les utilisateurs avec role = 'admin' peuvent accéder aux fonctions de modération
- Les politiques RLS protègent l'accès aux données sensibles
- Les fonctions SQL vérifient le rôle avant d'autoriser les actions
*/
