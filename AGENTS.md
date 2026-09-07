# AGENTS.md

Rules for AI agents working in this repository. These are not suggestions — code that
doesn't follow them gets rejected.

---

## Project

This is CARDINAL a monorepo erd generator app build with Next.js as frontend and Nest.js as Backend

**Stack:** Next.js (App Router) · Nest.Js (Backend API) · React · TypeScript strict ·
TanStack Query · Tailwind Css · npm · Kysely (Query Builder)

Do not add a dependency without asking. Say what you'd add and why.

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
```

**Done means:** typecheck clean, lint clean, `build` succeeds (it catches server/client
boundary errors that `dev` hides), and you've told me what you did _not_ verify.

## Folder structure

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
│        │  └─ (feature)/                   # a domain slice: devices, reports, auth, ...
|        |       ├─ api/                    # 3-file pattern
│        │       |  ├─ (feature).service.ts # HTTP calls
│        │       |  ├─ use-(feature).ts     # TanStack Query hooks + query keys
│        │       |  └─ types.ts             # request + response + domain types
|        |       ├─ components/             # components owned by this feature
|        |       ├─ hooks/                  # non query hooks
|        |       ├─ utils/
|        |       └─ index.ts                # the feature's public surface
|        |
│        ├─ components/
|        |   ├─ ui/                   # primitives: button, input, dialog. Zero domain knowledge.
|        |   └─ layout/               # shell: header, sidebar, nav
|        |
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

## Don'ts

- Don't upgrade Next.js, React, Typescript, Nest Js or TanStack Query unless I ask.
- Don't read `process.env` outside `config/env.ts`.
- Don't touch `.env*`, CI config, or generated files.
- Don't reformat files you aren't otherwise changing.
- Don't add comments that restate the code.
- Don't swallow errors with an empty catch.
- Don't create a new top-level directory without asking.
- Don't add plugin attribution or marker comments to generated code.
