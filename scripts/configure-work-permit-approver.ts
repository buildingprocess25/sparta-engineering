import { PrismaClient, WorkPermitApprovalRole } from "../generated/prisma"

function parseArgs() {
  const args = process.argv.slice(2)
  const parsed: Record<string, string | boolean> = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith("--")) {
      const key = arg.slice(2)
      if (key === "disable") {
        parsed.disable = true
      } else if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        parsed[key] = args[++i]
      }
    }
  }

  return parsed
}

async function main() {
  const opts = parseArgs()
  const environment = opts.environment as string | undefined
  const branch = opts.branch as string | undefined
  const nik = opts.nik as string | undefined
  const roleStr = opts.role as string | undefined
  const isDisable = Boolean(opts.disable)

  if (!environment || (environment !== "development" && environment !== "production")) {
    console.error("Error: --environment [development|production] wajib ditentukan.")
    process.exit(1)
  }

  if (!branch || !branch.trim()) {
    console.error("Error: --branch <NAMA_CABANG> wajib ditentukan.")
    process.exit(1)
  }

  if (!nik || !nik.trim()) {
    console.error("Error: --nik <NIK_AKUN> wajib ditentukan.")
    process.exit(1)
  }

  const validRoles = ["P2K3", "DELEGATE", "SECRETARY"]
  if (!roleStr || !validRoles.includes(roleStr.toUpperCase())) {
    console.error(`Error: --role <P2K3|DELEGATE|SECRETARY> wajib ditentukan. Pilihan: ${validRoles.join(", ")}`)
    process.exit(1)
  }

  const role = roleStr.toUpperCase() as WorkPermitApprovalRole
  const branchName = branch.trim().toUpperCase()

  const prisma = new PrismaClient()
  try {
    const user = await prisma.user.findUnique({
      where: { NIK: nik.trim() },
      select: { NIK: true, name: true, email: true, branchName: true, role: true },
    })

    if (!user) {
      console.error(`Error: User dengan NIK "${nik}" tidak ditemukan di database.`)
      process.exit(1)
    }

    if (user.branchName.trim().toUpperCase() !== branchName) {
      console.warn(`Peringatan: Cabang user di master adalah "${user.branchName}", berbeda dengan target cabang "${branchName}".`)
    }

    const approver = await prisma.workPermitApprover.upsert({
      where: {
        branchName_userNik_approvalRole: {
          branchName,
          userNik: user.NIK,
          approvalRole: role,
        },
      },
      update: {
        name: user.name,
        email: user.email,
        isActive: !isDisable,
      },
      create: {
        branchName,
        userNik: user.NIK,
        name: user.name,
        email: user.email,
        approvalRole: role,
        isActive: !isDisable,
      },
    })

    console.log(
      `Sukses: Penugasan ${role} untuk cabang ${branchName} kepada ${user.name} (${user.NIK}) telah ${
        isDisable ? "dinonaktifkan" : "diaktifkan"
      } (ID: ${approver.id}).`
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error("Terjadi kesalahan:", err)
  process.exit(1)
})
