# AtlasGuard 5-Minute Demo Script

## Setup (30 seconds)

1. Ensure Redis is running: `npm run infra:up`
2. Start API and web (`npm run dev` in `apps/api` and `apps/web`)
3. Log in as **admin@demo.com** / `password123`
4. Click **Prepare Demo Scenario** on the Admin dashboard (or `POST /admin/simulate-demo`)

## Act 1 — Tourist Safety (1 min)

1. Log in as **tourist@demo.com**
2. Open **Safety Map** and move to **Remote North Route** (CRITICAL zone)
   - Coordinates: `27.34, 88.6275`
3. Trigger **SOS**
4. Show the incident page: risk score, severity badge, and **Risk Factors** list

> Talking point: "Risk is computed automatically from geofence, medical profile, time of day, and responder proximity — not a hardcoded value."

## Act 2 — Operator Triage (1.5 min)

1. Log in as **operator@demo.com**
2. Show dashboard summary cards: total active, critical count, avg response time, severity breakdown
3. Click the new SOS in the queue — highlight colored risk score
4. Open the **Risk Analysis** panel with explanation reasons
5. **Acknowledge** the incident, then **Assign Responder**

> Talking point: "Operators see explainable AI-style scoring — every point has a human-readable reason."

## Act 3 — Responder Dispatch (1 min)

1. Log in as **responder@demo.com**
2. Show assigned case with severity badge and risk score
3. Walk through: Dispatched → Reached → Resolved

## Act 4 — Trust & Audit (1 min)

1. Return to tourist incident page — show updated status stepper
2. As operator or admin, show **Audit Timeline** (hash-chained events)
3. Mention notification records created for operators on SOS

## Act 5 — Admin Control (30 sec)

1. Admin dashboard live metrics (zones, users, response time)
2. Re-run **Prepare Demo Scenario** to reset for the next audience

## High-Risk SOS Payload (API)

```json
POST /incidents/sos
{
  "latitude": 27.34,
  "longitude": 88.6275,
  "description": "Demo high-risk SOS from Remote North Route"
}
```

Expected: risk score ≥ 30 (CRITICAL zone + medical notes), severity LOW–CRITICAL depending on other factors.