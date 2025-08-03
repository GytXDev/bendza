-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  color text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  content_id uuid,
  parent_id uuid,
  comment text NOT NULL,
  is_approved boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT comments_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.content(id),
  CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id)
);
CREATE TABLE public.content (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid,
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type = ANY (ARRAY['video'::text, 'image'::text, 'text'::text, 'audio'::text])),
  price integer DEFAULT 0,
  url text,
  thumbnail_url text,
  duration integer,
  file_size integer,
  is_premium boolean DEFAULT false,
  is_published boolean DEFAULT true,
  views_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT content_pkey PRIMARY KEY (id),
  CONSTRAINT content_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id)
);
CREATE TABLE public.content_categories (
  content_id uuid NOT NULL,
  category_id uuid NOT NULL,
  CONSTRAINT content_categories_pkey PRIMARY KEY (content_id, category_id),
  CONSTRAINT content_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT content_categories_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.content(id)
);
CREATE TABLE public.creators (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  bio text,
  abonnement_mode boolean DEFAULT false,
  abonnement_price integer DEFAULT 0,
  bank_number text,
  bank_name text,
  phone_number text,
  social_media jsonb,
  categories ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT creators_pkey PRIMARY KEY (id),
  CONSTRAINT creators_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  content_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT likes_pkey PRIMARY KEY (id),
  CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT likes_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.content(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid,
  receiver_id uuid,
  message text NOT NULL,
  message_type text DEFAULT 'text'::text CHECK (message_type = ANY (ARRAY['text'::text, 'image'::text, 'video'::text, 'audio'::text])),
  media_url text,
  is_read boolean DEFAULT false,
  sent_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id),
  CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info'::text CHECK (type = ANY (ARRAY['info'::text, 'success'::text, 'warning'::text, 'error'::text, 'payment'::text, 'subscription'::text])),
  is_read boolean DEFAULT false,
  action_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid,
  amount integer NOT NULL,
  currency text DEFAULT 'XOF'::text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])),
  payment_method text NOT NULL CHECK (payment_method = ANY (ARRAY['mobile_money'::text, 'bank_transfer'::text])),
  payment_reference text,
  bank_details jsonb,
  requested_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payouts_pkey PRIMARY KEY (id),
  CONSTRAINT payouts_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id)
);
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  creator_id uuid,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text, 'pending'::text])),
  start_date timestamp with time zone DEFAULT now(),
  end_date timestamp with time zone,
  amount integer NOT NULL,
  currency text DEFAULT 'XOF'::text,
  auto_renew boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT subscriptions_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  content_id uuid,
  creator_id uuid,
  amount integer NOT NULL,
  currency text DEFAULT 'XOF'::text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'cancelled'::text, 'failed'::text, 'refunded'::text])),
  type text NOT NULL CHECK (type = ANY (ARRAY['abonnement'::text, 'achat_unitaire'::text, 'donation'::text, 'creator_activation'::text])),
  payment_method text NOT NULL CHECK (payment_method = ANY (ARRAY['mobile_money'::text, 'card'::text, 'bank_transfer'::text])),
  payment_reference text,
  transaction_id text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT transactions_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.content(id),
  CONSTRAINT transactions_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_followers (
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_followers_pkey PRIMARY KEY (follower_id, following_id),
  CONSTRAINT user_followers_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(id),
  CONSTRAINT user_followers_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  name text,
  photourl text,
  is_creator boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);