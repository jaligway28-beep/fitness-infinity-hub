-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'announcement',
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications select" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own notifications insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own notifications delete" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);

-- Notify everyone holding a role (bookings, scans, broadcasts). Membership/broadcast-style kinds limited to admins.
CREATE OR REPLACE FUNCTION public.notify_role(_role app_role, _title text, _body text, _kind text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF _kind NOT IN ('booking','announcement','membership','reminder') THEN RAISE EXCEPTION 'Invalid kind'; END IF;
  IF _kind = 'membership' AND NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  INSERT INTO public.notifications(user_id, title, body, kind)
  SELECT ur.user_id, left(_title, 200), left(_body, 1000), _kind
  FROM public.user_roles ur WHERE ur.role = _role AND ur.user_id <> auth.uid();
END $$;
REVOKE EXECUTE ON FUNCTION public.notify_role(app_role, text, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.notify_role(app_role, text, text, text) TO authenticated;

-- Messaging
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  last_read_at timestamptz,
  PRIMARY KEY (conversation_id, user_id)
);
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.conversations TO authenticated;
GRANT SELECT, UPDATE ON public.conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.conversations, public.conversation_participants, public.messages TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_participant(_conversation uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = _conversation AND user_id = _user)
$$;

CREATE POLICY "participants view conversation" ON public.conversations FOR SELECT TO authenticated USING (public.is_participant(id, auth.uid()));
CREATE POLICY "participants view members" ON public.conversation_participants FOR SELECT TO authenticated USING (public.is_participant(conversation_id, auth.uid()));
CREATE POLICY "own participant row update" ON public.conversation_participants FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "participants read messages" ON public.messages FOR SELECT TO authenticated USING (public.is_participant(conversation_id, auth.uid()));
CREATE POLICY "participants send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND public.is_participant(conversation_id, auth.uid()) AND read_at IS NULL);
CREATE POLICY "recipients mark read" ON public.messages FOR UPDATE TO authenticated USING (public.is_participant(conversation_id, auth.uid()) AND sender_id <> auth.uid()) WITH CHECK (public.is_participant(conversation_id, auth.uid()) AND sender_id <> auth.uid());
CREATE INDEX messages_conv_idx ON public.messages(conversation_id, created_at);

-- Who can I message? members -> trainers/admins; trainers -> members/admins; admins -> everyone
CREATE OR REPLACE FUNCTION public.list_contacts()
RETURNS TABLE(user_id uuid, full_name text, email text, role app_role)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.email, ur.role
  FROM public.profiles p JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE p.id <> auth.uid() AND auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'trainer') AND ur.role IN ('member','admin','trainer'))
    OR (public.has_role(auth.uid(), 'member') AND ur.role IN ('trainer','admin'))
    OR EXISTS (SELECT 1 FROM public.conversation_participants a JOIN public.conversation_participants b ON a.conversation_id = b.conversation_id WHERE a.user_id = auth.uid() AND b.user_id = p.id)
  )
  ORDER BY p.full_name
$$;
REVOKE EXECUTE ON FUNCTION public.list_contacts() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.list_contacts() TO authenticated;

CREATE OR REPLACE FUNCTION public.start_conversation(_other uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.list_contacts() c WHERE c.user_id = _other) THEN RAISE EXCEPTION 'You cannot message this person'; END IF;
  SELECT a.conversation_id INTO _id FROM public.conversation_participants a
    JOIN public.conversation_participants b ON a.conversation_id = b.conversation_id
    WHERE a.user_id = auth.uid() AND b.user_id = _other LIMIT 1;
  IF _id IS NOT NULL THEN RETURN _id; END IF;
  INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO _id;
  INSERT INTO public.conversation_participants(conversation_id, user_id) VALUES (_id, auth.uid()), (_id, _other);
  RETURN _id;
END $$;
REVOKE EXECUTE ON FUNCTION public.start_conversation(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.start_conversation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.on_message_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _name text;
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  SELECT full_name INTO _name FROM public.profiles WHERE id = NEW.sender_id;
  INSERT INTO public.notifications(user_id, title, body, kind, link)
  SELECT cp.user_id, 'New message from ' || coalesce(_name, 'someone'), left(NEW.body, 200), 'message', NEW.conversation_id::text
  FROM public.conversation_participants cp WHERE cp.conversation_id = NEW.conversation_id AND cp.user_id <> NEW.sender_id;
  RETURN NEW;
END $$;
CREATE TRIGGER messages_after_insert AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.on_message_insert();

-- Coach applications
CREATE TABLE public.coach_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  specialization text NOT NULL DEFAULT '',
  experience_years integer NOT NULL DEFAULT 0,
  bio text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  review_note text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.coach_applications TO authenticated;
GRANT ALL ON public.coach_applications TO service_role;
ALTER TABLE public.coach_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applicant views own" ON public.coach_applications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "applicant submits pending" ON public.coach_applications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL);
CREATE POLICY "applicant resubmits after rejection" ON public.coach_applications FOR UPDATE TO authenticated USING (user_id = auth.uid() AND status = 'rejected') WITH CHECK (user_id = auth.uid() AND status = 'pending' AND reviewed_by IS NULL);

CREATE OR REPLACE FUNCTION public.review_coach_application(_id uuid, _approve boolean, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only admins can review coach applications'; END IF;
  UPDATE public.coach_applications SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
    review_note = _note, reviewed_at = now(), reviewed_by = auth.uid()
  WHERE id = _id RETURNING user_id INTO _uid;
  IF _uid IS NULL THEN RAISE EXCEPTION 'Application not found'; END IF;
  IF _approve THEN
    DELETE FROM public.user_roles WHERE user_id = _uid AND role = 'member';
    INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'trainer') ON CONFLICT DO NOTHING;
    INSERT INTO public.notifications(user_id, title, body, kind) VALUES (_uid, 'Coach application approved', 'Welcome to the team! Your Coach dashboard is now unlocked.', 'announcement');
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _uid AND role = 'trainer';
    INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'member') ON CONFLICT DO NOTHING;
    INSERT INTO public.notifications(user_id, title, body, kind) VALUES (_uid, 'Coach application not approved', coalesce(_note, 'Your application was reviewed and not approved at this time.'), 'announcement');
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.review_coach_application(uuid, boolean, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.review_coach_application(uuid, boolean, text) TO authenticated;

-- Admin-only: remove coach access (back to member)
CREATE OR REPLACE FUNCTION public.revoke_coach(_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only admins can remove coaches'; END IF;
  DELETE FROM public.user_roles WHERE user_id = _user AND role = 'trainer';
  INSERT INTO public.user_roles(user_id, role) VALUES (_user, 'member') ON CONFLICT DO NOTHING;
  UPDATE public.coach_applications SET status = 'rejected', review_note = 'Coach access removed by admin', reviewed_at = now(), reviewed_by = auth.uid() WHERE user_id = _user;
END $$;
REVOKE EXECUTE ON FUNCTION public.revoke_coach(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.revoke_coach(uuid) TO authenticated;

-- AI assistant threads
CREATE TABLE public.ai_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New chat',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.ai_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  sdk_id text NOT NULL,
  role text NOT NULL,
  parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (thread_id, sdk_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_threads, public.ai_messages TO authenticated;
GRANT ALL ON public.ai_threads, public.ai_messages TO service_role;
ALTER TABLE public.ai_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own threads" ON public.ai_threads FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own ai messages" ON public.ai_messages FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.ai_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()));
CREATE INDEX ai_messages_thread_idx ON public.ai_messages(thread_id, created_at);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;