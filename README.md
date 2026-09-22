# AxiomDB — Frontend

> Backend repository: [github.com/VedantPalekar/axiomdb](https://github.com/VedantPalekar/axiomdb)

Dashboard and landing page for **AxiomDB** — an autonomous database monitoring and self-healing platform. It connects to the AxiomDB backend and gives you a real-time view of your databases: health, anomalies, incidents, profiling reports, and AI-generated repair proposals that you can approve or reject in one click.

---

## What's inside

| Route | What it does |
|---|---|
| `/` | Marketing landing page |
| `/dashboard` | Live overview — connection health, stream stats, active incidents |
| `/connections` | Manage database connections, view live table data |
| `/audit` | Full audit log with per-event detail |
| `/incidents` | Active and resolved incidents |
| `/profiling` | Run schema/query profiling jobs, browse reports |
| `/proposals` | Review AI repair proposals — approve or reject with a diff view |
| `/settings` | App-level settings |
| `/diagnostic` | Diagnostic tools |

---

## Tech stack

- **Next.js 16** with the App Router
- **React 19**
- **Tailwind CSS v4** + shadcn/ui components
- **TanStack Query** for server state
- **Zustand** for client state
- **Recharts** for charts
- **next-themes** for light/dark mode

---

## Getting started

```bash
npm install
npm run dev
```

The app expects the AxiomDB backend to be running. Set the API base URL in your environment:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then open [http://localhost:3000](http://localhost:3000).

---

## Build

```bash
npm run build
npm start
```
