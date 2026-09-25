# Dirly

Smart plant monitoring dashboard. ESP32 reads a capacitive soil moisture sensor and
publishes telemetry over MQTT (Mosquitto); a Fastify backend stores readings in
PostgreSQL (via Prisma), evaluates thresholds into alerts, and pushes live updates to a
React dashboard over WebSocket.

```
Capacitive Sensor -> ESP32 -> MQTT Mosquitto -> Fastify API -> PostgreSQL
                                                   |-> WebSocket -> React dashboard
```

## Repo layout

```
packages/shared   TypeScript types + constants shared by API and web
apps/api          Fastify backend: REST + JWT + WebSocket + MQTT bridge + Prisma
apps/web          React dashboard: Vite + Tailwind + shadcn-style UI + Recharts
firmware/esp32-soil  PlatformIO firmware: soil moisture sampling + MQTT publish
```

## Quick start

Prereqs: Node 20+, PostgreSQL, an MQTT broker (Mosquitto) for the live path.

```bash
npm install

# 1. Configure env
copy apps/api/.env.example apps/api/.env
copy apps/web/.env.example apps/web/.env

# 2. Database: create schema + seed admin user and demo sensors
npm run db:generate
npm run db:push
npm run db:seed

# 3. Run both apps (api on :4000, web on :5173)
npm run dev
```

Open `http://localhost:5173`. If the API was seeded, the login screen shows the demo
credentials (`admin@dirly.dev` / `admin123`).

### Optional: simulated sensor

Without hardware, feed the pipeline with a simulator that publishes readings over HTTP
(as if from an MQTT bridge):

```bash
npm run simulate
```

The backend also accepts MQTT payloads. Point an ESP32 (or `mosquitto_pub`) at
`soil/sensors/<sensorCode>/data`.

## Environment

| Variable | App | Purpose |
|---|---|---|
| `DATABASE_URL` | api | PostgreSQL connection string |
| `JWT_SECRET` | api | Signing secret for access tokens |
| `PORT` | api | API port (default 4000) |
| `MQTT_URL` | api | Broker URL, e.g. `mqtt://localhost:1883` |
| `MQTT_TOPIC` | api | Subscription topic, e.g. `soil/sensors/+/data` |
| `CORS_ORIGIN` | api | Allowed web origin (default `http://localhost:5173`) |
| `VITE_API_URL` | web | API base URL (default `http://localhost:4000`) |
| `VITE_WS_URL` | web | WebSocket URL (default `ws://localhost:4000`) |

## Device bridge

Two ingest paths feed the same pipeline (store -> alerts -> broadcast):

1. HTTP: `POST /api/readings` (also how the simulator works)
2. MQTT: the API subscribes to `MQTT_TOPIC` and applies the same pipeline

## Deployment

- Web: `apps/web` runs on Vercel (see `apps/web/vercel.json`).
- API: `apps/api` runs on Railway/Render (`railway.toml` included; a Prisma migrate
  step is expected at boot or in the deploy pipeline).

## Docs

- Product scope and requirements: `docs/PRD.md` (human-authored PRD).
- Visual direction and choices: `DESIGN.md`.