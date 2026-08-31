# Architecture Overview

> **Status**: Draft — Perlu diisi setelah high-level design disepakati.

## Diagram Arsitektur

<!-- Gambarkan alur data dari browser → Next.js → Prisma → PostgreSQL -->

_Belum didefinisikan._

## Layer Utama

| Layer | Teknologi | Tanggung Jawab |
|---|---|---|
| Frontend | Next.js App Router + React 19 | UI rendering, routing, Server Components |
| Backend | Next.js Server Actions / Route Handlers | Business logic, validasi, akses data |
| ORM | Prisma v7 | Query builder, type-safe DB access |
| Database | PostgreSQL | Persistensi data |

## Deployment Flow

```
Push ke main/master
  → GitHub Actions build Docker image
  → Push ke ghcr.io/<owner>/<repo>
  → Trigger DOKPLOY_WEBHOOK_URL
  → Dokploy pull image & restart container (port 3000)
```

## Dokumen Terkait

- [Data Models](./10_Data_Models.md)
- [Tech Stack](../00_Project/20_Tech_Stack.md)
