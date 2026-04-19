CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  channel varchar(20) NOT NULL DEFAULT 'email',
  subject varchar(255) NOT NULL,
  body text NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS notifications_match_channel_unique
  ON notifications (match_id, channel);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx
  ON notifications (user_id);

CREATE INDEX IF NOT EXISTS notifications_status_idx
  ON notifications (status);

CREATE INDEX IF NOT EXISTS notifications_created_at_idx
  ON notifications (created_at);
