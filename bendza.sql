-- =====================================================
-- BENDZA PLATFORM - SCRIPT DE CRÉATION DES TABLES
-- =====================================================

-- Table users
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  photourl TEXT,
  is_creator BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table creators
CREATE TABLE IF NOT EXISTS creators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE,
  bio TEXT,
  abonnement_mode BOOLEAN DEFAULT FALSE,
  abonnement_price INTEGER DEFAULT 0,
  bank_number TEXT,
  bank_name TEXT,
  phone_number TEXT,
  social_media JSONB,
  categories TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table content
CREATE TABLE IF NOT EXISTS content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('video', 'image', 'text', 'audio')) NOT NULL,
  price INTEGER DEFAULT 0,
  url TEXT,
  thumbnail_url TEXT,
  duration INTEGER, -- en secondes pour les vidéos/audio
  file_size INTEGER, -- en bytes
  is_premium BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  content_id UUID REFERENCES content(id),
  creator_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'XOF',
  status TEXT CHECK (status IN ('pending', 'paid', 'cancelled', 'failed', 'refunded')) DEFAULT 'pending',
  type TEXT CHECK (type IN ('abonnement', 'achat_unitaire', 'donation', 'creator_activation')) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('mobile_money', 'card', 'bank_transfer')) NOT NULL,
  payment_reference TEXT,
  transaction_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'video', 'audio')) DEFAULT 'text',
  media_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table payouts
CREATE TABLE IF NOT EXISTS payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'XOF',
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  payment_method TEXT CHECK (payment_method IN ('mobile_money', 'bank_transfer')) NOT NULL,
  payment_reference TEXT,
  bank_details JSONB,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  creator_id UUID REFERENCES users(id),
  status TEXT CHECK (status IN ('active', 'cancelled', 'expired', 'pending')) DEFAULT 'pending',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'XOF',
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, creator_id)
);

-- Table likes
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  content_id UUID REFERENCES content(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

-- Table comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  content_id UUID REFERENCES content(id),
  parent_id UUID REFERENCES comments(id),
  comment TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'success', 'warning', 'error', 'payment', 'subscription')) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table content_categories (relation many-to-many)
CREATE TABLE IF NOT EXISTS content_categories (
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, category_id)
);

-- Table user_followers (relation many-to-many)
CREATE TABLE IF NOT EXISTS user_followers (
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - POLITIQUES DE SÉCURITÉ
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_followers ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLITIQUES POUR LA TABLE USERS
-- =====================================================

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Créer les nouvelles politiques
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- POLITIQUES POUR LA TABLE CREATORS
-- =====================================================

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Creators can view all creators" ON creators;
DROP POLICY IF EXISTS "Creators can update own profile" ON creators;
DROP POLICY IF EXISTS "Creators can insert own profile" ON creators;

-- Créer les nouvelles politiques
CREATE POLICY "Creators can view all creators" ON creators FOR SELECT USING (true);
CREATE POLICY "Creators can update own profile" ON creators FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Creators can insert own profile" ON creators FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- POLITIQUES POUR LA TABLE CONTENT
-- =====================================================

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Content can be viewed by all" ON content;
DROP POLICY IF EXISTS "Creators can insert own content" ON content;
DROP POLICY IF EXISTS "Creators can update own content" ON content;
DROP POLICY IF EXISTS "Creators can delete own content" ON content;

-- Créer les nouvelles politiques
CREATE POLICY "Content can be viewed by all" ON content FOR SELECT USING (is_published = true);
CREATE POLICY "Creators can view own content" ON content FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Creators can insert own content" ON content FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own content" ON content FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete own content" ON content FOR DELETE USING (auth.uid() = creator_id);

-- =====================================================
-- POLITIQUES POUR LA TABLE TRANSACTIONS
-- =====================================================

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;

-- Créer les nouvelles politiques
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id OR auth.uid() = creator_id);
CREATE POLICY "Users can insert transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = creator_id);

-- =====================================================
-- POLITIQUES POUR LA TABLE MESSAGES
-- =====================================================

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;

-- Créer les nouvelles politiques
CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid() = sender_id);

-- =====================================================
-- POLITIQUES POUR LA TABLE PAYOUTS
-- =====================================================

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Creators can view own payouts" ON payouts;
DROP POLICY IF EXISTS "Creators can request payouts" ON payouts;

-- Créer les nouvelles politiques
CREATE POLICY "Creators can view own payouts" ON payouts FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Creators can request payouts" ON payouts FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- =====================================================
-- POLITIQUES POUR LA TABLE SUBSCRIPTIONS
-- =====================================================

CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id OR auth.uid() = creator_id);
CREATE POLICY "Users can manage own subscriptions" ON subscriptions FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- POLITIQUES POUR LA TABLE LIKES
-- =====================================================

CREATE POLICY "Users can view all likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can manage own likes" ON likes FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- POLITIQUES POUR LA TABLE COMMENTS
-- =====================================================

CREATE POLICY "Users can view approved comments" ON comments FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can view own comments" ON comments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- POLITIQUES POUR LA TABLE NOTIFICATIONS
-- =====================================================

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- POLITIQUES POUR LA TABLE CATEGORIES
-- =====================================================

CREATE POLICY "Users can view active categories" ON categories FOR SELECT USING (is_active = true);

-- =====================================================
-- POLITIQUES POUR LA TABLE CONTENT_CATEGORIES
-- =====================================================

CREATE POLICY "Users can view content categories" ON content_categories FOR SELECT USING (true);
CREATE POLICY "Creators can manage content categories" ON content_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM content WHERE content.id = content_categories.content_id AND content.creator_id = auth.uid())
);

-- =====================================================
-- POLITIQUES POUR LA TABLE USER_FOLLOWERS
-- =====================================================

CREATE POLICY "Users can view followers" ON user_followers FOR SELECT USING (true);
CREATE POLICY "Users can manage own follows" ON user_followers FOR ALL USING (auth.uid() = follower_id);

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Supprimer la fonction existante si elle existe
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Fonction pour créer automatiquement un profil utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, photourl)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil utilisateur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON creators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour incrémenter les compteurs
CREATE OR REPLACE FUNCTION public.increment_content_views()
RETURNS trigger AS $$
BEGIN
  UPDATE content SET views_count = views_count + 1 WHERE id = NEW.content_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEX POUR LES PERFORMANCES
-- =====================================================

-- Supprimer les index existants s'ils existent
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_is_creator;
DROP INDEX IF EXISTS idx_creators_user_id;
DROP INDEX IF EXISTS idx_content_creator_id;
DROP INDEX IF EXISTS idx_content_type;
DROP INDEX IF EXISTS idx_content_is_published;
DROP INDEX IF EXISTS idx_content_created_at;
DROP INDEX IF EXISTS idx_transactions_user_id;
DROP INDEX IF EXISTS idx_transactions_creator_id;
DROP INDEX IF EXISTS idx_transactions_status;
DROP INDEX IF EXISTS idx_transactions_created_at;
DROP INDEX IF EXISTS idx_messages_sender_id;
DROP INDEX IF EXISTS idx_messages_receiver_id;
DROP INDEX IF EXISTS idx_messages_sent_at;
DROP INDEX IF EXISTS idx_payouts_creator_id;
DROP INDEX IF EXISTS idx_payouts_status;
DROP INDEX IF EXISTS idx_payouts_requested_at;
DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_subscriptions_creator_id;
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_subscriptions_start_date;
DROP INDEX IF EXISTS idx_likes_user_id;
DROP INDEX IF EXISTS idx_likes_content_id;
DROP INDEX IF EXISTS idx_comments_content_id;
DROP INDEX IF EXISTS idx_comments_user_id;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_user_followers_follower_id;
DROP INDEX IF EXISTS idx_user_followers_following_id;

-- Créer les nouveaux index
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_creator ON users(is_creator);
CREATE INDEX idx_creators_user_id ON creators(user_id);
CREATE INDEX idx_content_creator_id ON content(creator_id);
CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_is_published ON content(is_published);
CREATE INDEX idx_content_created_at ON content(created_at DESC);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_creator_id ON transactions(creator_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX idx_payouts_creator_id ON payouts(creator_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_creator_id ON subscriptions(creator_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_content_id ON likes(content_id);
CREATE INDEX idx_comments_content_id ON comments(content_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_user_followers_follower_id ON user_followers(follower_id);
CREATE INDEX idx_user_followers_following_id ON user_followers(following_id);

-- Index pour les dates
CREATE INDEX idx_payouts_requested_at ON payouts(requested_at DESC);
CREATE INDEX idx_subscriptions_start_date ON subscriptions(start_date DESC);

-- =====================================================
-- DONNÉES INITIALES
-- =====================================================

-- Insérer des catégories par défaut
INSERT INTO categories (name, description, icon, color) VALUES
('Lifestyle', 'Contenu lifestyle et mode de vie', 'heart', '#FF6B6B'),
('Fitness', 'Fitness et bien-être', 'activity', '#4ECDC4'),
('Cuisine', 'Recettes et gastronomie', 'utensils', '#45B7D1'),
('Tech', 'Technologie et innovation', 'smartphone', '#96CEB4'),
('Business', 'Entrepreneuriat et business', 'briefcase', '#FFEAA7'),
('Art', 'Art et créativité', 'palette', '#DDA0DD'),
('Musique', 'Musique et audio', 'music', '#98D8C8'),
('Gaming', 'Jeux vidéo et gaming', 'gamepad-2', '#F7DC6F')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- CONFIGURATION SUPABASE STORAGE
-- =====================================================

-- Note: La configuration du Storage se fait via l'interface Supabase
-- Consultez le fichier SETUP.md pour les instructions détaillées