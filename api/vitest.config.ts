import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests run on your Mac against the Postgres container, using a separate database
// (<POSTGRES_DB>_test) so they never touch your dev data. CI sets TEST_DATABASE_URL instead.
const rootEnvFile = fileURLToPath(new URL("../.env", import.meta.url));
if (!process.env.TEST_DATABASE_URL && existsSync(rootEnvFile)) {
  process.loadEnvFile(rootEnvFile);
}

const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_PORT, POSTGRES_DB } =
  process.env;
const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}_test`;

// Set before anything imports src/config/env.ts, which reads process.env once
Object.assign(process.env, {
  NODE_ENV: "test",
  DATABASE_URL: testDatabaseUrl,
  APP_ORIGIN: "http://localhost:5173",
  LOG_LEVEL: "silent",
});

export default defineConfig({
  test: {
    globalSetup: ["./test/global-setup.ts"],
    setupFiles: ["./test/setup.ts"],
    // every test file shares one database, so run files one at a time
    fileParallelism: false,
  },
});
