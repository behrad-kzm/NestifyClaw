# nestify-claw

A [NestJS](https://nestjs.com/) server that hosts [OpenClaw](https://github.com/openclaw/openclaw) agent capabilities with a clear three-layer architecture: **connectors** (platform I/O), **gateway** (message pipeline), and **core** (agent brain).

This project lives alongside the OpenClaw monorepo (`../openclaw`). Vendored OpenClaw code is copied in and kept pristine; nestify-owned glue lives in `host/` adapters and NestJS modules.

## Architecture

```
Platform (Telegram, WhatsApp, …)
        │
        ▼
┌─────────────────────┐
│  connectors/        │  Layer 1 — channel I/O
│    <channel>/
│      extension/     │  vendored OpenClaw channel plugin
│      host/          │  NestJS adapter
└─────────┬───────────┘
          │ IncomingChannelMessage
          ▼
┌─────────────────────┐
│  gateway/           │  Layer 2 — message pipeline
│    inbound          │  classify, gate, dedupe
│    routing          │  pick agent / session
│    sessions         │  conversation state
│    delivery         │  outbound replies
│    media, commands, approvals, config, infra
│    gateway.service  │  orchestrates the pipeline
└─────────┬───────────┘
          │ TurnInput
          ▼
┌─────────────────────┐
│  core/              │  Layer 3 — the brain
│    openclaw/        │  vendored agent runtime from OpenClaw
│    host/            │  NestJS adapter (AgentRuntimePort)
└─────────────────────┘
```

| Layer | Folder | Role |
|-------|--------|------|
| **Connectors** | `src/connectors/` | Read/write messages on external platforms |
| **Gateway** | `src/gateway/` | Route, gate, session, and deliver messages |
| **Core** | `src/core/` | Run agent turns (LLM, tools, subagents) |

Shared contracts (types, port interfaces, DI tokens) live in `src/common/types/`. OpenClaw plugin-sdk adapter stubs are in `src/common/openclaw/plugin-sdk/` (auto-generated via `npm run gen:adapter`).

## Project layout

```
src/
  connectors/
    telegram/
      extension/       # vendored from openclaw/extensions/telegram
      host/            # NestJS Telegram adapter
    whatsapp/
      extension/       # vendored from openclaw/extensions/whatsapp
      host/            # NestJS WhatsApp adapter
    connectors.module.ts

  gateway/             # Layer 2 — pipeline modules + orchestrator
    gateway.module.ts
    gateway.service.ts
    inbound/
    routing/
    sessions/
    delivery/
    media/
    commands/
    approvals/
    config/
    infra/

  core/                # Layer 3 — agent runtime
    openclaw/
      agents/          # vendored from openclaw/src/agents
      agent-core/      # vendored from openclaw/packages/agent-core
    host/              # NestJS agent adapter
    core.module.ts

  common/
    types/             # shared domain types and port interfaces
    extension/         # NestifyChannel contract
    openclaw/          # plugin-sdk adapter stubs

  app.module.ts
  main.ts
```

### Vendored vs nestify-owned

| Path | Origin | Editable? |
|------|--------|-----------|
| `connectors/*/extension/` | Copied from OpenClaw | Keep pristine (like upstream) |
| `core/openclaw/` | Copied from OpenClaw | Keep pristine |
| `connectors/*/host/`, `core/host/`, `gateway/` | nestify-claw | Yes — this is where wiring happens |
| `common/openclaw/plugin-sdk/` | Auto-generated stubs | Regenerate with `gen:adapter`; mark real impls with `@nestify-real` |

Vendored trees are excluded from typecheck and ESLint (same approach as OpenClaw channel extensions).

## Prerequisites

- Node.js 20+
- npm
- A sibling checkout of [OpenClaw](./openclaw) when refreshing vendored code

## Setup

```bash
npm install
cp .env.example .env
# Edit .env — see Environment variables below
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | For Telegram | Bot token from [@BotFather](https://t.me/BotFather). If unset, Telegram stays off with a warning. |
| `WHATSAPP_ENABLED` | For WhatsApp | Set to `true` to start the WhatsApp connector (QR pairing). Default: disabled. |
| `PORT` | No | HTTP port (default `3000`). |
| `SESSION_DM_SCOPE` | No | DM isolation: `main` (default), `per-peer`, `per-channel-peer`, `per-account-channel-peer`. Use `per-channel-peer` for multi-user bots. |
| `SESSION_MAIN_KEY` | No | Main DM bucket name when `SESSION_DM_SCOPE=main` (default `main`). |
| `SESSION_IDENTITY_LINKS` | No | JSON map linking one person across channels (OpenClaw `session.identityLinks`). |

WhatsApp uses dynamic `import('baileys')` so the app can boot without loading baileys until explicitly enabled.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start` | Dev server (`tsx src/main.ts`) |
| `npm run start:dev` | Dev server with watch |
| `npm run build` | Typecheck, then bundle to `dist/main.mjs` (esbuild) |
| `npm run typecheck` | Type-check nestify-owned code only |
| `npm run start:prod` | Run production bundle (`node dist/main.mjs`) |
| `npm run gen:adapter` | Scan vendored OpenClaw imports and regenerate plugin-sdk stubs |
| `npm run lint` | ESLint |
| `npm run test` | Unit tests (`test/unit/`) |
| `npm run test:e2e` | App bootstrap + gateway pipeline e2e |

### Build notes

- **Development** uses `tsx` to run TypeScript directly.
- **Production** uses esbuild (`scripts/build.ts`) to bundle the app; `node_modules` stay external.
- Vendored OpenClaw code under `connectors/*/extension/` and `core/openclaw/` is bundled but not type-checked against nestify stubs (OpenClaw targets its own SDK types).

## Current status

| Area | Status |
|------|--------|
| Three-layer module structure | In place |
| Telegram / WhatsApp connectors | Host adapters log inbound messages; not yet wired to `GatewayPort` |
| Gateway pipeline | Stub implementations; end-to-end flow is runnable |
| Core agent runtime | Stub `runTurn` echo; vendored OpenClaw agents present but not wired |
| Plugin SDK | Stub adapters (~120 modules); real implementations added incrementally |

## Adding a channel

1. Copy the OpenClaw extension into `src/connectors/<channel>/extension/`.
2. Add a NestJS host under `src/connectors/<channel>/host/` implementing `NestifyChannel`.
3. Register the host module in `connectors/connectors.module.ts`.
4. Run `npm run gen:adapter` to refresh plugin-sdk stubs.

## Relationship to OpenClaw

nestify-claw is **not** a full OpenClaw port. It reuses vendored slices of OpenClaw (two channels, agent runtime) inside a NestJS structure. Still in OpenClaw only (not copied here):

- ~100+ other channel extensions
- Full `openclaw/src/gateway/` server (~700 files)
- Real `plugin-sdk` and supporting packages (`llm-runtime`, `media-core`, …)
- CLI, web UI, daemon, and plugin ecosystem

See the [OpenClaw docs](https://github.com/openclaw/openclaw/tree/main/docs) for the upstream architecture.

## License

[MIT](services/nestify-claw/LICENSE)
