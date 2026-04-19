CREATE TABLE IF NOT EXISTS user_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider varchar(20) NOT NULL,
  provider_user_id varchar(255) NOT NULL,
  email varchar(320),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_identities_provider_user_id_unique
  ON user_identities (provider, provider_user_id);

CREATE INDEX IF NOT EXISTS user_identities_user_id_idx
  ON user_identities (user_id);

CREATE INDEX IF NOT EXISTS user_identities_email_idx
  ON user_identities (email);
