-- Create notifications table
--
-- NOTE: this previously referenced public.users(id) / public.children(id),
-- tables that don't exist in this project -- the real parent/child tables
-- are clats_parents (keyed by email, not a UUID id) and clats_children
-- (TEXT id). That mismatch meant this migration could never successfully
-- run against this database, and the app's notification read/write paths
-- (which also assumed a parent.id that no API route ever sets) silently
-- did nothing. Corrected to match the actual schema.
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_email TEXT NOT NULL REFERENCES public.clats_parents(email) ON DELETE CASCADE,
  child_id TEXT REFERENCES public.clats_children(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT,
  badge_color TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_parent_email ON public.notifications(parent_email);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
