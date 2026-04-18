import { buildApp } from "./app";
import { closeDatabasePool } from "./config/db";
import { env } from "./config/env";

const start = async (): Promise<void> => {
  const app = await buildApp();

  const stop = async (signal: string): Promise<void> => {
    app.log.info({ signal }, "Stopping server");
    await app.close();
    await closeDatabasePool();
    process.exit(0);
  };

  process.once("SIGINT", () => {
    void stop("SIGINT");
  });

  process.once("SIGTERM", () => {
    void stop("SIGTERM");
  });

  await app.listen({
    host: env.HOST,
    port: env.PORT,
  });
};

start().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
