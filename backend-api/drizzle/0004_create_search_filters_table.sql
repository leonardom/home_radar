CREATE TABLE IF NOT EXISTS search_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price_min integer,
  price_max integer,
  bedrooms_min integer,
  bedrooms_max integer,
  bathrooms_min integer,
  bathrooms_max integer,
  location varchar(255),
  property_type varchar(50),
  keywords text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS search_filters_user_id_idx ON search_filters (user_id);
CREATE INDEX IF NOT EXISTS search_filters_price_range_idx ON search_filters (price_min, price_max);
CREATE INDEX IF NOT EXISTS search_filters_rooms_range_idx ON search_filters (bedrooms_min, bedrooms_max, bathrooms_min, bathrooms_max);
