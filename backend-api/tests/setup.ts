process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.HOST = process.env.HOST ?? "127.0.0.1";
process.env.PORT = process.env.PORT ?? "3001";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/home_radar_test";
