CREATE TABLE IF NOT EXISTS "saved_properties" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "property_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "saved_properties_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
  CONSTRAINT "saved_properties_property_id_fkey"
    FOREIGN KEY ("property_id") REFERENCES "properties" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "saved_properties_user_property_unique"
  ON "saved_properties" ("user_id", "property_id");

CREATE INDEX IF NOT EXISTS "saved_properties_user_id_idx"
  ON "saved_properties" ("user_id");

CREATE INDEX IF NOT EXISTS "saved_properties_property_id_idx"
  ON "saved_properties" ("property_id");

CREATE INDEX IF NOT EXISTS "saved_properties_created_at_idx"
  ON "saved_properties" ("created_at");
