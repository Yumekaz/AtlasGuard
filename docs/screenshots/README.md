# AtlasGuard Screenshots

Placeholder structure for README and demo materials. Capture real screenshots locally after running the stack — images are not committed to the repo by default.

## How to Capture

1. Start Redis: `npm run infra:up` (port **6380**)
2. Run API (`apps/api`, port 3001) and Web (`apps/web`, port 3000)
3. Run `POST /admin/simulate-demo` as admin for a populated dashboard
4. Save PNGs into this folder using the filenames below

## Recommended Screenshots

| Filename | What to capture | Role / page |
|----------|-----------------|-------------|
| `01-login.png` | Login screen with demo account buttons | `/login` |
| `02-tourist-map.png` | Safety map with geofence zones and tourist position | Tourist → Safety Map |
| `03-tourist-sos.png` | SOS trigger confirmation or active incident card | Tourist dashboard |
| `04-operator-queue.png` | Active Operations Queue with risk scores | Operator dashboard |
| `05-operator-risk-panel.png` | Risk Analysis panel with factor breakdown | Operator → click incident row |
| `06-operator-map.png` | Operations map with zones, incidents, responders | Operator dashboard |
| `07-responder-assignments.png` | Responder assignment list | Responder dashboard |
| `08-admin-demo-control.png` | Prepare Demo Scenario result with auto incident ID | Admin dashboard |
| `09-admin-zones.png` | Risk geofence management | Admin → Zones |
| `10-audit-ledger.png` | Audit integrity verified | Operator → Safety Ledger |

## Placeholder Layout

```
docs/screenshots/
  README.md          ← this file
  01-login.png       ← (capture locally)
  02-tourist-map.png
  ...
```

## Tips

- Use 1440×900 or 1280×800 viewport for consistent aspect ratio
- Hide OS notifications and use dark mode if matching the default UI theme
- After `simulate-demo`, operator dashboard should show analytics (avg response ~2–3 min) without manual SOS steps