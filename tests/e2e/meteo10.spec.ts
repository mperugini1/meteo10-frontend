import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

import { adminToken, env, sendMeasurement } from "./env";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
}

test.describe.serial("Meteo10", () => {
  test("1. login com o admin do seed", async ({ page }) => {
    await login(page, env.adminEmail, env.adminPassword());
    await expect(page.getByRole("link", { name: "Gateways" })).toBeVisible();
  });

  test("2. painel mostra a estação de demonstração com dados", async ({ page }) => {
    await login(page, env.adminEmail, env.adminPassword());
    const card = page.getByRole("article").filter({ hasText: "Estação Poli" });
    await expect(card).toBeVisible();
    await expect(card.getByText("Online")).toBeVisible();
    await expect(card.getByText(/\d+,\d °C/)).toBeVisible();
    await expect(card.getByText(/\d+,\d hPa/)).toBeVisible();
  });

  test("3. detalhe da estação com período de 7 dias", async ({ page }) => {
    await login(page, env.adminEmail, env.adminPassword());
    await page.goto(`/stations/${env.stationId}`);
    await expect(page.getByRole("heading", { name: "Agora" })).toBeVisible();
    await page.getByRole("button", { name: "7 dias" }).click();
    await expect(page.getByRole("button", { name: "7 dias" })).toHaveAttribute("aria-pressed", "true");
    for (const title of ["Temperatura", "Umidade do ar", "Pressão", "Velocidade do vento", "Bateria"]) {
      await expect(page.locator("figure").filter({ hasText: title }).first().locator(".recharts-line-curve")).toBeVisible();
    }
    await expect(page.getByText("Disponibilidade no período")).toBeVisible();
  });

  test("4. regra de temperatura acima de 25 °C gera alarme e é reconhecido", async ({ page }) => {
    await login(page, env.adminEmail, env.adminPassword());
    await page.goto(`/stations/${env.stationId}/alarms`);
    await page.getByRole("button", { name: "Nova regra" }).click();
    const dialog = page.getByRole("dialog", { name: "Nova regra" });
    await dialog.getByLabel("Grandeza").selectOption("temperature_c");
    await dialog.getByLabel("Ficar").selectOption("gt");
    await dialog.getByLabel("Valor (°C)").fill("25");
    await dialog.getByRole("button", { name: "Salvar regra" }).click();
    await expect(page.getByText("Regra criada.")).toBeVisible();

    await sendMeasurement({ temperature: 31.2 });

    await page.goto("/");
    const banner = page.getByRole("region", { name: "Alarmes ativos" });
    await expect(banner.getByText("Temperatura acima de 25,0 °C (valor medido: 31,2 °C)")).toBeVisible();

    await page.goto("/alarms?status=active");
    const event = page.getByRole("listitem").filter({ hasText: "Temperatura acima de 25,0 °C (valor medido: 31,2 °C)" }).first();
    await event.getByRole("button", { name: "Reconhecer" }).click();
    await expect(page.getByText("Alarme reconhecido.")).toBeVisible();
    await expect(event.getByText(/Reconhecido por/)).toBeVisible();

    // Limpeza: volta ao normal (resolve) e remove a regra criada
    await sendMeasurement({ temperature: 21 });
    const token = await adminToken();
    const headers = { Authorization: `Bearer ${token}` };
    const rules = (await (await fetch(`${env.apiBaseUrl}/stations/${env.stationId}/alarm-rules`, { headers })).json()) as {
      items: Array<{ id: number; variable: string; operator: string; threshold: number }>;
    };
    for (const rule of rules.items.filter((r) => r.variable === "temperature_c" && r.operator === "gt" && r.threshold === 25)) {
      await fetch(`${env.apiBaseUrl}/alarm-rules/${rule.id}`, { method: "DELETE", headers });
    }
  });

  test("5. exporta o CSV do período", async ({ page }) => {
    await login(page, env.adminEmail, env.adminPassword());
    await page.goto(`/stations/${env.stationId}`);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Exportar CSV" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^meteo10_estacao\d+_\d{8}-\d{8}\.csv$/);
    const content = (await readFile((await download.path()) as string, "utf8")).replace(/^﻿/, "");
    const [header, firstRow] = content.split("\r\n");
    expect(header).toContain("Data e hora (horário de Brasília);Horário estimado;Temperatura (°C)");
    expect(firstRow).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2};/);
  });

  test("6. usuário viewer não acessa /admin/gateways", async ({ page }) => {
    await login(page, env.viewerEmail, env.viewerPassword);
    await expect(page.getByRole("link", { name: "Gateways" })).toHaveCount(0);
    await page.goto("/admin/gateways");
    await expect(page).toHaveURL(/\/\?aviso=sem-permissao$/);
    await expect(page.getByText("Você não tem permissão para acessar a área de administração.")).toBeVisible();
    const api = await page.request.get("/api/backend/gateways");
    expect(api.status()).toBe(403);
  });
});
