import { defineConfig, devices } from "@playwright/test";

// Variáveis em .env.e2e (veja .env.e2e.example). Backend e frontend devem estar rodando.
try {
  process.loadEnvFile(".env.e2e");
} catch {
  // arquivo opcional: usa as variáveis do ambiente
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "celular", use: { ...devices["Pixel 5"], viewport: { width: 360, height: 780 } } },
  ],
});
