# AGENTS.md

Rules for AI agents working in this repository. These are not suggestions — code that
doesn't follow them gets rejected.

---

## 1. Project

This is CARDINAL a monorepo erd generator app build with Next.js as frontend and Nest.js as Backend

**Stack:** Next.js (App Router) · Nest.Js (Backend API) · React · TypeScript strict ·
TanStack Query · Tailwind Css · npm · Kysely (Query Builder)

Do not add a dependency without asking. Say what you'd add and why.

## 2. Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
```

**Done means:** typecheck clean, lint clean, `build` succeeds (it catches server/client
boundary errors that `dev` hides), and you've told me what you did _not_ verify.

## 3. Folder structure

```
CARDINAL/
├─ apps/
│  ├─ api/                          # NestJS backend
│  │   └─ src/
│  │       ├─ main.ts
│  │       ├─ app.module.ts
│  │       └─ (feature)/
│  │           ├─ (feature).module.ts
│  │           ├─ (feature).controller.ts
│  │           ├─ (feature).service.ts
│  │           └─ dto/
│  │                └── create-(feature).dto.ts
│  │
│  └─ web/                            # Next.js frontend
│     └─ src/
│        ├─ app/                      # ROUTING ONLY
│        │   └─ (group)
|        |       ├─ (route)/
|        |       |   └─ page.tsx      # thin — compose feature components, nothing else
|        |       ├─ layout.tsx
|        |       └─ not-found.tsx
│        │
│        ├─ features/
│        │  └─ (feature)/             # 3-file pattern
│        │       ├─ (feature).service.ts
│        │       ├─ use-(feature).ts
│        │       └─ types.ts
│        │
│        └─ lib/
│           └─ query-client.ts        # TanStack Query setup
│
├─ packages/
│   └─ shared-types/                  # DTO ↔ frontend type contract
│       └─ src/
│          ├─ schema.ts               # Table, Column, ForeignKey shapes
│          └─ erd.ts                  # ErdNode, ErdEdge shapes
│
├─ package.json
└─ AGENTS.md                          # your reusable agent guide
```
