# Tech Stack

Dokumen ini menjelaskan teknologi yang digunakan di proyek `sparta-engineering`
beserta alasan pemilihannya.

## Core Framework

| Teknologi | Versi | Alasan |
|---|---|---|
| Next.js | 16.2.6 | App Router, RSC, Server Actions, built-in streaming |
| React | 19.2.4 | Server Components, concurrent features |
| TypeScript | ^5 | Type safety di seluruh codebase |
| pnpm | latest | Efficient disk usage, strict hoisting |

## Styling & UI

| Teknologi | Versi | Alasan |
|---|---|---|
| Tailwind CSS | ^4 | Utility-first, design system yang konsisten |
| shadcn/ui | ^4.16.0 | Komponen reusable berbasis Radix, tidak di-bundle |
| lucide-react | ^1.27.0 | Icon library yang konsisten dengan shadcn |
| next-themes | ^0.4.6 | Dark/Light mode bawaan |

## Database & ORM

| Teknologi | Versi | Alasan |
|---|---|---|
| Prisma ORM | ^7.9.1 | Type-safe queries, schema-first, migration management |
| PostgreSQL | latest | Database utama (relasional, battle-tested) |

## Tooling & Quality

| Teknologi | Alasan |
|---|---|
| ESLint v9 | Linting dengan flat config |
| Prettier | Formatting otomatis (termasuk Tailwind class sort) |
| Docker | Containerized deployment via Dokploy |
| GitHub Actions | CI/CD: build image → push GHCR → trigger Dokploy webhook |

## Keputusan Arsitektur Terkait

- Lihat `docs/03_Decisions/` untuk ADR terkait pilihan teknologi ini.
