import { adminToken, env, sendMeasurement } from "./env";

/** Garante o usuário viewer de teste e uma medição recente da estação de demonstração. */
export default async function globalSetup() {
  const token = await adminToken();
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  const users = (await (await fetch(`${env.apiBaseUrl}/users`, { headers })).json()) as { items: Array<{ id: number; email: string }> };
  const existing = users.items.find((u) => u.email === env.viewerEmail);
  const body = { name: "Visitante E2E", email: env.viewerEmail, password: env.viewerPassword, role: "viewer", is_active: true };
  const response = existing
    ? await fetch(`${env.apiBaseUrl}/users/${existing.id}`, { method: "PATCH", headers, body: JSON.stringify(body) })
    : await fetch(`${env.apiBaseUrl}/users`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`Não foi possível preparar o usuário viewer: ${response.status}`);
  await sendMeasurement({ temperature: 22.5 });
}
