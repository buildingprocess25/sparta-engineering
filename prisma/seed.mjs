import { PrismaPg } from "@prisma/adapter-pg"
import { hash } from "bcryptjs"
import { PrismaClient } from "../generated/prisma/index.js"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed Prisma data")
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const areaSeeds = [
  { code: "office", name: "Office", type: "OFFICE", periods: ["MONTHLY"] },
  { code: "whc", name: "WHC", type: "WAREHOUSE", periods: ["MONTHLY", "WEEKLY"] },
  { code: "wh", name: "WH", type: "WAREHOUSE", periods: ["MONTHLY", "WEEKLY"] },
  { code: "depo", name: "Depo", type: "WAREHOUSE", periods: ["MONTHLY", "WEEKLY"] },
  { code: "bulky", name: "Bulky", type: "WAREHOUSE", periods: ["MONTHLY", "WEEKLY"] },
  {
    code: "store_hub",
    name: "Store Hub",
    type: "WAREHOUSE",
    periods: ["MONTHLY", "WEEKLY"],
  },
  {
    code: "gudang_anak",
    name: "Gudang Anak",
    type: "WAREHOUSE",
    periods: ["MONTHLY", "WEEKLY"],
  },
]

const demoPassword = "12345678"

const headOfficeUserSeeds = [
  {
    NIK: "HO-ES-001",
    name: "Demo ES Head Office",
    email: "es@admin.com",
    role: "ES",
  },
  {
    NIK: "HO-COORD-001",
    name: "Demo Coord Head Office",
    email: "coord@admin.com",
    role: "COORD",
  },
  {
    NIK: "HO-MANAGER-001",
    name: "Demo Manager Head Office",
    email: "manager@admin.com",
    role: "MANAGER",
  },
  {
    NIK: "HO-REQUESTER-001",
    name: "Demo Requester Head Office",
    email: "requester@admin.com",
    role: "REQUESTER",
  },
  {
    NIK: "HO-ADMIN-001",
    name: "Demo Admin Head Office",
    email: "admin@admin.com",
    role: "ADMIN_HO",
  },
]

async function main() {
  const demoPasswordHash = await hash(demoPassword, 10)

  for (const seed of areaSeeds) {
    const area = await prisma.area.upsert({
      where: { code: seed.code },
      update: {
        name: seed.name,
        type: seed.type,
        isActive: true,
      },
      create: {
        code: seed.code,
        name: seed.name,
        type: seed.type,
        isActive: true,
      },
    })

    for (const period of seed.periods) {
      await prisma.areaChecklistAvailability.upsert({
        where: {
          areaId_period: {
            areaId: area.id,
            period,
          },
        },
        update: {},
        create: {
          areaId: area.id,
          period,
        },
      })
    }
  }

  for (const seed of headOfficeUserSeeds) {
    await prisma.user.upsert({
      where: { NIK: seed.NIK },
      update: {
        name: seed.name,
        email: seed.email,
        branchName: "HEAD OFFICE",
        location: "HEAD OFFICE",
        role: seed.role,
        passwordHash: demoPasswordHash,
        mustChangePassword: false,
      },
      create: {
        NIK: seed.NIK,
        name: seed.name,
        email: seed.email,
        branchName: "HEAD OFFICE",
        location: "HEAD OFFICE",
        role: seed.role,
        passwordHash: demoPasswordHash,
        mustChangePassword: false,
      },
    })
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
