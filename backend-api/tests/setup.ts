process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.HOST = process.env.HOST ?? "127.0.0.1";
process.env.PORT = process.env.PORT ?? "3001";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/home_radar_test";
process.env.SCRAPER_DATABASE_URL = process.env.SCRAPER_DATABASE_URL ?? process.env.DATABASE_URL;
process.env.SCRAPER_SYNC_BATCH_SIZE = process.env.SCRAPER_SYNC_BATCH_SIZE ?? "200";
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? "test_access_secret_change_me_1234567890";
process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? "15m";
process.env.JWT_REFRESH_EXPIRES_DAYS = process.env.JWT_REFRESH_EXPIRES_DAYS ?? "7";
process.env.ENFORCE_MIN_ONE_FILTER = process.env.ENFORCE_MIN_ONE_FILTER ?? "false";
