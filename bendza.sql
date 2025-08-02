-- =====================================================
-- BENDZA PLATFORM - SCRIPT DE CRÉATION DES TABLES
-- =====================================================

-- Table users
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  photoURL TEXT,
  is_creator BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table creators
CREATE TABLE IF NOT EXISTS creators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE,
  bio TEXT,
  abonnement_mode BOOLEAN DEFAULT FALSE,
  abonnement_price INTEGER,
  bank_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table content
CREATE TABLE IF NOT EXISTS content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('video', 'image', 'text')),
  price INTEGER,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  content_id UUID REFERENCES content(id),
  creator_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',
  type TEXT CHECK (type IN ('abonnement', 'achat_unitaire')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table payouts
CREATE TABLE IF NOT EXISTS payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processed')) DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
CREATE POLICY "Content can be viewed by all" ON content FOR SELECT USING (true);
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
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);

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
  INSERT INTO public.users (id, email, name, photoURL)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'photoURL');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil utilisateur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================================================
-- INDEX POUR LES PERFORMANCES
-- =====================================================

-- Supprimer les index existants s'ils existent
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_creators_user_id;
DROP INDEX IF EXISTS idx_content_creator_id;
DROP INDEX IF EXISTS idx_transactions_user_id;
DROP INDEX IF EXISTS idx_transactions_creator_id;
DROP INDEX IF EXISTS idx_messages_sender_id;
DROP INDEX IF EXISTS idx_messages_receiver_id;
DROP INDEX IF EXISTS idx_payouts_creator_id;
DROP INDEX IF EXISTS idx_content_created_at;
DROP INDEX IF EXISTS idx_transactions_created_at;
DROP INDEX IF EXISTS idx_messages_sent_at;

-- Créer les nouveaux index
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_creators_user_id ON creators(user_id);
CREATE INDEX idx_content_creator_id ON content(creator_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_creator_id ON transactions(creator_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_payouts_creator_id ON payouts(creator_id);

-- Index pour les dates
CREATE INDEX idx_content_created_at ON content(created_at DESC);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);