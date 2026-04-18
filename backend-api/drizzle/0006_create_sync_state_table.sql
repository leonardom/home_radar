CREATE TABLE IF NOT EXISTS sync_state (
  key varchar(120) PRIMARY KEY,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sync_state_last_sync_at_idx ON sync_state (last_sync_at);
