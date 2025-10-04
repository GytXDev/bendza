-- Script de création des buckets de stockage Supabase pour BENDZA
-- Ce script doit être exécuté dans l'éditeur SQL de Supabase

-- 1. Créer le bucket pour les avatars/profils utilisateurs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB max
    ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- 2. Créer le bucket pour les contenus (vidéos, images, fichiers)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'content',
    'content',
    true,
    104857600, -- 100MB max
    ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp', 'application/zip', 'application/pdf']
);

-- 3. Créer le bucket pour les miniatures/thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'thumbnails',
    'thumbnails',
    true,
    2097152, -- 2MB max
    ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- 4. Créer le bucket pour les bannières de créateurs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'banners',
    'banners',
    true,
    10485760, -- 10MB max
    ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- 5. Créer le bucket pour les documents (justificatifs, contrats)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    false, -- Privé
    20971520, -- 20MB max
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
);

-- 6. Créer le bucket pour les fichiers temporaires
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'temp',
    'temp',
    false, -- Privé
    52428800, -- 50MB max
    ARRAY['video/mp4', 'video/webm', 'image/jpeg', 'image/png', 'image/webp', 'application/zip']
);

-- 7. Créer les politiques RLS pour le bucket 'avatars'
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        name LIKE auth.uid()::text || '_%'
    )
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        name LIKE auth.uid()::text || '_%'
    )
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
    bucket_id = 'avatars' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        name LIKE auth.uid()::text || '_%'
    )
);

-- 8. Créer les politiques RLS pour le bucket 'content'
CREATE POLICY "Published content is publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'content');

CREATE POLICY "Creators can upload content" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'content' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        name LIKE auth.uid()::text || '_%'
    )
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND is_creator = true
    )
);

CREATE POLICY "Creators can update their own content" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'content' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        name LIKE auth.uid()::text || '_%'
    )
);

CREATE POLICY "Creators can delete their own content" ON storage.objects
FOR DELETE USING (
    bucket_id = 'content' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        name LIKE auth.uid()::text || '_%'
    )
);

-- 9. Créer les politiques RLS pour le bucket 'thumbnails'
CREATE POLICY "Thumbnails are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "Creators can upload thumbnails" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'thumbnails' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        name LIKE auth.uid()::text || '_%'
    )
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND is_creator = true
    )
);

CREATE POLICY "Creators can update their own thumbnails" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'thumbnails' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        name LIKE auth.uid()::text || '_%'
    )
);

CREATE POLICY "Creators can delete their own thumbnails" ON storage.objects
FOR DELETE USING (
    bucket_id = 'thumbnails' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        name LIKE auth.uid()::text || '_%'
    )
);

-- 10. Créer les politiques RLS pour le bucket 'banners'
CREATE POLICY "Banners are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'banners');

CREATE POLICY "Creators can upload banners" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'banners' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        name LIKE auth.uid()::text || '_%'
    )
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND is_creator = true
    )
);

CREATE POLICY "Creators can update their own banners" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'banners' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        name LIKE auth.uid()::text || '_%'
    )
);

CREATE POLICY "Creators can delete their own banners" ON storage.objects
FOR DELETE USING (
    bucket_id = 'banners' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        name LIKE auth.uid()::text || '_%'
    )
);

-- 11. Créer les politiques RLS pour le bucket 'documents' (privé)
CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
    bucket_id = 'documents' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        name LIKE auth.uid()::text || '_%'
    )
);

CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'documents' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        name LIKE auth.uid()::text || '_%'
    )
);

CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'documents' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        name LIKE auth.uid()::text || '_%'
    )
);

CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
    bucket_id = 'documents' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        name LIKE auth.uid()::text || '_%'
    )
);

-- 12. Créer les politiques RLS pour le bucket 'temp' (privé)
CREATE POLICY "Users can manage their own temp files" ON storage.objects
FOR ALL USING (
    bucket_id = 'temp' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        name LIKE auth.uid()::text || '_%'
    )
);

-- 13. Vérification des buckets créés
SELECT 
    'BUCKETS CRÉÉS AVEC SUCCÈS' as status,
    COUNT(*) as nombre_buckets
FROM storage.buckets 
WHERE id IN ('avatars', 'content', 'thumbnails', 'banners', 'documents', 'temp');

-- 14. Afficher la liste des buckets
SELECT 
    '=== BUCKETS DISPONIBLES ===' as info;

SELECT 
    id as bucket_id,
    name as bucket_name,
    public as is_public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id IN ('avatars', 'content', 'thumbnails', 'banners', 'documents', 'temp')
ORDER BY id;
