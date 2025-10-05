-- Script pour ajouter le support des médias multiples
-- Crée une table pour stocker plusieurs images/vidéos par contenu

-- Table pour les médias multiples
CREATE TABLE IF NOT EXISTS public.content_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'audio')),
    file_name TEXT,
    file_size BIGINT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_content_media_content_id ON public.content_media(content_id);
CREATE INDEX IF NOT EXISTS idx_content_media_order ON public.content_media(content_id, order_index);

-- RLS (Row Level Security)
ALTER TABLE public.content_media ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture à tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to read content media" ON public.content_media
    FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour permettre aux créateurs de gérer leurs médias
CREATE POLICY "Allow creators to manage their content media" ON public.content_media
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.content 
            WHERE content.id = content_media.content_id 
            AND content.creator_id = auth.uid()
        )
    );

-- Politique pour les administrateurs
CREATE POLICY "Allow admins to manage all content media" ON public.content_media
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_content_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_content_media_updated_at
    BEFORE UPDATE ON public.content_media
    FOR EACH ROW
    EXECUTE FUNCTION update_content_media_updated_at();

-- Commentaire pour documenter
COMMENT ON TABLE public.content_media IS 'Table pour stocker plusieurs medias (images/videos) par contenu';
COMMENT ON COLUMN public.content_media.order_index IS 'Ordre d affichage des medias (0 = premier)';
