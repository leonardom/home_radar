CREATE TABLE IF NOT EXISTS sync_dead_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_key varchar(120) NOT NULL,
  source varchar(100),
  external_listing_id varchar(255),
  payload text NOT NULL,
  error_message text NOT NULL,
  failed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sync_dead_letters_sync_key_idx ON sync_dead_letters (sync_key);
CREATE INDEX IF NOT EXISTS sync_dead_letters_failed_at_idx ON sync_dead_letters (failed_at);
