-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT,
  badge_color TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Parents can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can update their own notifications (e.g. mark as read)"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = parent_id);

CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true); -- Usually restricted to service role in real apps via API

-- Index for faster queries
CREATE INDEX idx_notifications_parent_id ON public.notifications(parent_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
