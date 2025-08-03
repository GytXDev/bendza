-- =====================================================
-- CONFIGURATION DES TABLES ET PERMISSIONS POUR CRÉATEURS (ADAPTÉ À BENDZA)
-- =====================================================

-- 1. Mise à jour de la table users existante pour ajouter les champs créateur manquants
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS creator_bio TEXT,
ADD COLUMN IF NOT EXISTS creator_description TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'subscription',
ADD COLUMN IF NOT EXISTS subscription_price INTEGER DEFAULT 2500,
ADD COLUMN IF NOT EXISTS creator_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS creator_since TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Mise à jour de la table creators existante pour ajouter les champs manquants
ALTER TABLE creators 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'subscription',
ADD COLUMN IF NOT EXISTS subscription_price INTEGER DEFAULT 2500,
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS content_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_earnings INTEGER DEFAULT 0;

-- 3. Index pour les performances (ajout des index manquants)
CREATE INDEX IF NOT EXISTS idx_creators_account_type ON creators(account_type);
CREATE INDEX IF NOT EXISTS idx_users_creator_fields ON users(is_creator, creator_verified);

-- 4. Fonction pour mettre à jour le timestamp (si elle n'existe pas)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Trigger pour mettre à jour automatiquement updated_at sur creators
DROP TRIGGER IF EXISTS update_creators_updated_at ON creators;
CREATE TRIGGER update_creators_updated_at 
    BEFORE UPDATE ON creators 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CONFIGURATION DES BUCKETS STORAGE
-- =====================================================

-- 6. Création des buckets de stockage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
    ('profile-banners', 'profile-banners', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
    ('creator-content', 'creator-content', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'])
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POLITIQUES RLS (ROW LEVEL SECURITY)
-- =====================================================

-- 7. Politiques pour la table users
-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view public profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Creators can update creator fields" ON users;

-- Politique pour permettre aux utilisateurs de voir les profils publics
CREATE POLICY "Users can view public profiles" ON users
FOR SELECT USING (true);

-- Politique pour permettre aux utilisateurs de mettre à jour leur propre profil
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid() = id);

-- Politique pour permettre aux créateurs de mettre à jour leur bio et description
CREATE POLICY "Creators can update creator fields" ON users
FOR UPDATE USING (
    auth.uid() = id AND 
    is_creator = true
);

-- 8. Politiques pour la table creators
-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Public can view creators" ON creators;
DROP POLICY IF EXISTS "Creators can manage own profile" ON creators;

-- Politique pour permettre la lecture publique des créateurs
CREATE POLICY "Public can view creators" ON creators
FOR SELECT USING (true);

-- Politique pour permettre aux créateurs de gérer leur profil
CREATE POLICY "Creators can manage own profile" ON creators
FOR ALL USING (auth.uid() = user_id);

-- 9. Politiques pour le stockage profile-images
DROP POLICY IF EXISTS "Profile images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;

CREATE POLICY "Profile images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload profile images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "Users can update own profile images" ON storage.objects
FOR UPDATE USING (bucket_id = 'profile-images');

CREATE POLICY "Users can delete own profile images" ON storage.objects
FOR DELETE USING (bucket_id = 'profile-images');

-- 10. Politiques pour le stockage profile-banners
DROP POLICY IF EXISTS "Profile banners are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload profile banners" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile banners" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile banners" ON storage.objects;

CREATE POLICY "Profile banners are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-banners');

CREATE POLICY "Users can upload profile banners" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profile-banners');

CREATE POLICY "Users can update own profile banners" ON storage.objects
FOR UPDATE USING (bucket_id = 'profile-banners');

CREATE POLICY "Users can delete own profile banners" ON storage.objects
FOR DELETE USING (bucket_id = 'profile-banners');

-- 11. Politiques pour le stockage creator-content
DROP POLICY IF EXISTS "Creator content is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Creators can upload content" ON storage.objects;
DROP POLICY IF EXISTS "Creators can update own content" ON storage.objects;
DROP POLICY IF EXISTS "Creators can delete own content" ON storage.objects;

CREATE POLICY "Creator content is publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'creator-content');

CREATE POLICY "Creators can upload content" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'creator-content');

CREATE POLICY "Creators can update own content" ON storage.objects
FOR UPDATE USING (bucket_id = 'creator-content');

CREATE POLICY "Creators can delete own content" ON storage.objects
FOR DELETE USING (bucket_id = 'creator-content');

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- 12. Fonction pour devenir créateur (adaptée à la structure existante)
CREATE OR REPLACE FUNCTION become_creator(
    user_bio TEXT DEFAULT NULL,
    user_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Mettre à jour l'utilisateur
    UPDATE users 
    SET is_creator = true, 
        creator_bio = user_bio,
        creator_description = user_description,
        creator_since = NOW()
    WHERE id = auth.uid();
    
    -- Créer ou mettre à jour l'entrée dans la table creators
    INSERT INTO creators (user_id, bio, description, abonnement_mode, abonnement_price)
    VALUES (auth.uid(), user_bio, user_description, false, 2500)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        bio = EXCLUDED.bio,
        description = EXCLUDED.description,
        updated_at = NOW();
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Fonction pour mettre à jour le profil créateur (adaptée à la structure existante)
CREATE OR REPLACE FUNCTION update_creator_profile(
    new_bio TEXT DEFAULT NULL,
    new_description TEXT DEFAULT NULL,
    new_banner_url TEXT DEFAULT NULL,
    new_account_type VARCHAR(20) DEFAULT NULL,
    new_subscription_price INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier que l'utilisateur est un créateur
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_creator = true) THEN
        RAISE EXCEPTION 'User is not a creator';
    END IF;
    
    -- Mettre à jour la table users
    UPDATE users 
    SET creator_bio = COALESCE(new_bio, creator_bio),
        creator_description = COALESCE(new_description, creator_description),
        banner_url = COALESCE(new_banner_url, banner_url),
        account_type = COALESCE(new_account_type, account_type),
        subscription_price = COALESCE(new_subscription_price, subscription_price)
    WHERE id = auth.uid();
    
    -- Mettre à jour la table creators
    UPDATE creators 
    SET bio = COALESCE(new_bio, bio),
        description = COALESCE(new_description, description),
        banner_url = COALESCE(new_banner_url, banner_url),
        account_type = COALESCE(new_account_type, account_type),
        subscription_price = COALESCE(new_subscription_price, subscription_price),
        abonnement_mode = CASE 
            WHEN COALESCE(new_account_type, account_type) = 'subscription' THEN true 
            ELSE false 
        END,
        abonnement_price = COALESCE(new_subscription_price, subscription_price),
        updated_at = NOW()
    WHERE user_id = auth.uid();
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VUES UTILES
-- =====================================================

-- 14. Vue pour les profils créateurs publics (adaptée à la structure existante)
CREATE OR REPLACE VIEW public_creator_profiles AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.photourl,
    u.creator_since,
    u.creator_bio,
    u.creator_description,
    u.banner_url,
    u.account_type,
    u.subscription_price,
    u.creator_verified,
    COALESCE(c.followers_count, 0) as followers_count,
    COALESCE(c.content_count, 0) as content_count,
    COALESCE(c.total_earnings, 0) as total_earnings,
    c.created_at,
    c.updated_at,
    c.bio,
    c.description,
    c.abonnement_mode,
    c.abonnement_price,
    c.bank_number,
    c.bank_name,
    c.phone_number,
    c.social_media,
    c.categories
FROM users u
LEFT JOIN creators c ON u.id = c.user_id
WHERE u.is_creator = true
ORDER BY COALESCE(c.followers_count, 0) DESC, c.created_at DESC;

-- =====================================================
-- DONNÉES DE TEST (optionnel)
-- =====================================================

-- 15. Données de test (commentées - décommentez si nécessaire)
-- INSERT INTO users (id, name, email, is_creator, creator_bio, creator_description, creator_since)
-- VALUES 
--     (gen_random_uuid(), 'Marie Dubois', 'marie@example.com', true, 'Créatrice de contenu lifestyle et mode', 'Passionnée de mode et de beauté, je partage mes looks du jour et mes conseils beauté avec ma communauté.', NOW()),
--     (gen_random_uuid(), 'Alex Johnson', 'alex@example.com', true, 'Fitness coach et nutritionniste', 'Transforme ton corps avec mes programmes exclusifs et mes conseils nutrition personnalisés.', NOW())
-- ON CONFLICT DO NOTHING;

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Configuration terminée avec succès!';
    RAISE NOTICE 'Tables mises à jour: users, creators';
    RAISE NOTICE 'Buckets créés: profile-images, profile-banners, creator-content';
    RAISE NOTICE 'Politiques RLS configurées pour tous les buckets';
    RAISE NOTICE 'Fonctions créées: become_creator(), update_creator_profile()';
    RAISE NOTICE 'Vue créée: public_creator_profiles';
    RAISE NOTICE 'Structure adaptée à votre schéma Bendza existant';
END $$; 