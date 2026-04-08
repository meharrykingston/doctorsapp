# Astikan Doctor App

Doctor-facing React app for appointments, teleconsult rooms, prescriptions, notifications, onboarding, and practice workflows.

## Local

```bash
npm install
npm run dev
```

Default dev URL:
- `http://localhost:5173`

API mode:
- local: `/api`
- production: `/api` proxied by nginx

## Production

Live URL:
- `https://doctors.astikan.tech`

Backend integration:
- `/api/*`
- `/ws/teleconsult`
- `/assets/doctor-photos/*`

## Teleconsultation

The doctor app now joins the teleconsult session already created during employee booking instead of creating a separate fallback room when session metadata exists in the appointment flow.

WebRTC stack:
- signaling: backend websocket at `/ws/teleconsult`
- STUN + TURN ICE configuration returned by backend
- TURN relay served from the VPS coturn instance

## Deploy

Published on the VPS under:
- `/srv/astikan/apps/doctors/current`

Auto deploy:
- `astikan-deploy.timer`

