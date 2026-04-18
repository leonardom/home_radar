CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  filter_id uuid REFERENCES search_filters(id) ON DELETE SET NULL,
  match_reasons text[] NOT NULL DEFAULT '{}',
  matched_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT matches_user_property_unique UNIQUE (user_id, property_id)
);

CREATE INDEX IF NOT EXISTS matches_user_id_idx ON matches (user_id);
CREATE INDEX IF NOT EXISTS matches_property_id_idx ON matches (property_id);
CREATE INDEX IF NOT EXISTS matches_filter_id_idx ON matches (filter_id);
CREATE INDEX IF NOT EXISTS matches_matched_at_idx ON matches (matched_at);
