import { PrismaPg } from "@prisma/adapter-pg"
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

async function main() {
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
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
