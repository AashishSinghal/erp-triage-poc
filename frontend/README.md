# Frontend (Vite + React)

ERP Triage frontend built with Vite + React.

## What’s used and why

- **Vite**: fast dev server and modern build pipeline.
- **React**: UI rendering and component composition.
- **TanStack Router**: file-based routing with typed params.
- **TanStack Query**: API calls with caching and mutations.
- **Shadcn UI + Radix**: consistent UI primitives without heavy custom styling.
- **Tailwind CSS**: utility-first styling for speed and responsive layouts.
- **date-fns**: human-readable timestamps.

## Local Run

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Routes

- `/` → incidents list
- `/incidents` → redirects to `/`
- `/incidents/:incidentId` → incident detail

## API Base URL

Configured in: `src/services/incidents.ts`

Default:
```
http://localhost:3000
```

For production, update the base URL to your public API domain (e.g. `https://erp-api.yourdomain.com`).

## UI Structure

- `components/incidents/` – header, filters, dialog, table, detail views
- `pages/` – list and detail page layouts
- `services/` – API calls (queries/mutations)
- `routes/` – TanStack Router file-based routes
