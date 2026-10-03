# meteo10-frontend

Painel web do **Meteo10** (PCS3858 – Poli-USP): leituras atuais das estações, histórico em gráficos, alarmes e
administração. Interface em português, pensada primeiro para o celular.

- Next.js 16 (App Router) + React 19, TypeScript
- Tailwind CSS 4 + `src/app/globals.css` (tokens de cor claro/escuro)
- Recharts 3 para os gráficos
- ESLint 9; testes unitários com `node --test`; E2E com Playwright

## Como rodar

O backend (`meteo10-backend-api`) precisa estar rodando.

```bash
npm install
cp .env.example .env.local      # API_BASE_URL aponta para o backend
npm run dev                     # http://localhost:3000
npm run lint
npm test                        # node --test (formatação, séries dos gráficos, AES-CMAC)
npx playwright test             # e2e: backend e frontend rodando (veja abaixo)
```

### E2E

1. `cp .env.e2e.example .env.e2e` e preencha `E2E_ADMIN_PASSWORD` (a `SEED_ADMIN_PASSWORD` do backend) e
   `E2E_GATEWAY_SECRET_HEX` (segredo impresso pelo seed ou gerado em Administração → Gateways).
2. Gere histórico com o simulador do backend, por exemplo `--backfill-days 7 --count 0`.
3. `npx playwright install chromium` (uma vez) e `npx playwright test`.

Os testes rodam em viewport de 360 px. Eles criam o usuário `E2E_VIEWER_EMAIL` (perfil viewer) e enviam medições
assinadas diretamente ao backend, com a mesma assinatura AES-CMAC do gateway.

## Arquitetura

```
src/
  app/
    login/                    # público
    (app)/                    # área logada (layout com navegação)
      page.tsx                # painel geral (atualiza a cada 30 s)
      stations/[id]/          # detalhe + gráficos; /alarms = regras
      alarms/                 # histórico de eventos
      admin/                  # estações, gateways, usuários (só admin)
      account/                # troca de senha
    api/session/              # login/logout: guarda o JWT em cookie httpOnly
    api/backend/[...path]/    # repasse autenticado para o backend
  components/                 # cartões, gráficos, badges de status, UI base
  hooks/                      # busca com atualização automática, unidade do vento
  lib/format.ts               # formatação pt-BR, ponto cardeal, % de bateria, "há X min"
  lib/api.ts                  # cliente HTTP tipado com tratamento de erro padrão
  lib/auth.ts, lib/session.ts # sessão/cookies
  proxy.ts                    # proteção de rotas
  types/                      # tipos espelhando o backend
```

- **Sessão:** o token nunca chega ao JavaScript do navegador. `/api/session` faz o login no backend e grava o JWT em
  cookie `httpOnly`; o navegador chama `/api/backend/...` e o servidor do Next acrescenta o `Authorization`.
- **Proteção de rotas:** no Next 16 o antigo `middleware.ts` foi renomeado para **`proxy.ts`** (mesma função). Ele
  redireciona para `/login` sem sessão e bloqueia `/admin/*` para o perfil viewer; o layout de `/admin` repete a
  checagem no servidor e o backend valida tudo de novo.
- **Gráficos:** até 7 dias usam medições brutas; até 60 dias, médias por hora; acima disso, por dia (com faixa de
  mínimo e máximo). Um gráfico por grandeza, sem eixo duplo.
- **Formatação:** datas em `America/Sao_Paulo` (`03/10/2026 11:20`), números com vírgula decimal.
- Estados de status sempre com ícone + texto (online verde, offline cinza, alerta amarelo, crítico vermelho).
