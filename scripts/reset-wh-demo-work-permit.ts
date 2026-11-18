import { config } from "dotenv"
import { parseArgs } from "node:util"

import type { Prisma } from "../generated/prisma"
import { DEMO_ACCOUNTS, DEMO_BRANCH } from "../lib/demo-accounts"
import { getPrisma } from "../lib/prisma"
import { getSpartaAppMode } from "../lib/sparta-app-mode"

// Match the environment that `next dev` reads for local demo data.
config({
  path: [".env.development.local", ".env.local", ".env.development", ".env"],
  quiet: true,
})

const pendingDemoPermits = {
  applicantNik: DEMO_ACCOUNTS.find((account) => account.key === "bes")!.nik,
  applicant: { branchName: DEMO_BRANCH },
  status: { in: ["PENDING_MANAGER", "PENDING_P2K3", "PENDING_SECRETARY"] },
  reports: { none: {} },
} satisfies Prisma.WorkPermitWhereInput

async function main() {
  const { values } = parseArgs({
    options: {
      "permit-code": { type: "string" },
      apply: { type: "boolean", default: false },
    },
  })
  const permitCode = values["permit-code"]?.trim()

  if (getSpartaAppMode() !== "demo") {
    throw new Error("Jalankan hanya di mode demo dengan database development.")
  }
  if (values.apply && !permitCode) {
    throw new Error(
      "Sertakan --permit-code dengan kode izin yang akan dihapus."
    )
  }

  const prisma = getPrisma()
  try {
    if (!values.apply) {
      const permits = await prisma.workPermit.findMany({
        where: { ...pendingDemoPermits, permitCode },
        select: { permitCode: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      })
      if (permits.length) {
        console.table(permits)
      } else {
        console.log(
          "Tidak ada pengajuan aktif dari BES demo WH Parung yang bisa dibersihkan."
        )
      }
      return
    }

    const deleted = await prisma.$transaction(async (tx) => {
      const permit = await tx.workPermit.findFirst({
        where: { ...pendingDemoPermits, permitCode },
        select: { id: true, permitCode: true, status: true },
      })
      if (!permit) {
        throw new Error(
          "Pengajuan demo yang memenuhi syarat tidak ditemukan. Jalankan pratinjau terlebih dahulu."
        )
      }

      const permitResult = await tx.workPermit.deleteMany({
        where: { ...pendingDemoPermits, id: permit.id, status: permit.status },
      })
      if (permitResult.count !== 1) {
        throw new Error(
          "Pengajuan berubah saat dibersihkan. Jalankan pratinjau lagi."
        )
      }

      const emails = await tx.demoOutboxEmail.deleteMany({
        where: { metadata: { path: ["permitId"], equals: permit.id } },
      })
      return { permitCode: permit.permitCode, emails: emails.count }
    })

    console.log(
      `Pengajuan ${deleted.permitCode}, token persetujuan, dan ${deleted.emails} email terkait sudah dihapus.`
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
