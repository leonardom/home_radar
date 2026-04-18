CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source varchar(100) NOT NULL,
  external_listing_id varchar(255) NOT NULL,
  title varchar(500) NOT NULL,
  price integer,
  bedrooms integer,
  bathrooms integer,
  location varchar(255),
  property_type varchar(50),
  url text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  status varchar(20) NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT properties_source_external_listing_id_unique UNIQUE (source, external_listing_id)
);

CREATE INDEX IF NOT EXISTS properties_status_idx ON properties (status);
CREATE INDEX IF NOT EXISTS properties_price_idx ON properties (price);
CREATE INDEX IF NOT EXISTS properties_bedrooms_idx ON properties (bedrooms);
CREATE INDEX IF NOT EXISTS properties_location_idx ON properties (location);
CREATE INDEX IF NOT EXISTS properties_property_type_idx ON properties (property_type);
CREATE INDEX IF NOT EXISTS properties_last_seen_at_idx ON properties (last_seen_at);
