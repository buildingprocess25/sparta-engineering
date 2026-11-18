import "dotenv/config"
import { hash } from "bcryptjs"
import { getPrisma } from "../lib/prisma"
import { DEMO_BRANCH, DEMO_COORDINATOR } from "../lib/demo-accounts"
import { getSpartaAppMode } from "../lib/sparta-app-mode"

const TARGET_BRANCH = DEMO_BRANCH
const DEMO_PASSWORD = "12345678"

export async function seedWhDemoAccounts() {
  if (getSpartaAppMode() !== "demo") {
    throw new Error("Jalankan seed hanya dengan SPARTA_APP_MODE=demo dan database development.")
  }

  const prisma = getPrisma()
  const passwordHash = await hash(DEMO_PASSWORD, 10)

  console.log(`[Seed WH Demo] Menyiapkan 6 akun peran demo di cabang: ${TARGET_BRANCH}...`)

  // 1. BES (Branch Engineering Staff)
  const bes = await prisma.user.upsert({
    where: { NIK: "WHP-BES-001" },
    update: {
      name: "Demo BES WH Parung",
      email: "bes.whparung@admin.com",
      branchName: TARGET_BRANCH,
      location: TARGET_BRANCH,
      role: "ES",
      passwordHash,
      mustChangePassword: false,
    },
    create: {
      NIK: "WHP-BES-001",
      name: "Demo BES WH Parung",
      email: "bes.whparung@admin.com",
      branchName: TARGET_BRANCH,
      location: TARGET_BRANCH,
      role: "ES",
      passwordHash,
      mustChangePassword: false,
    },
  })
  console.log(`✔ BES: ${bes.name} (${bes.email})`)

  // 2. BEC / Koordinator
  const bec = await prisma.user.upsert({
    where: { NIK: DEMO_COORDINATOR.nik },
    update: {
      name: DEMO_COORDINATOR.name,
      email: DEMO_COORDINATOR.email,
      branchName: TARGET_BRANCH,
      location: TARGET_BRANCH,
      role: "COORD",
      passwordHash,
      mustChangePassword: false,
    },
    create: {
      NIK: DEMO_COORDINATOR.nik,
      name: DEMO_COORDINATOR.name,
      email: DEMO_COORDINATOR.email,
      branchName: TARGET_BRANCH,
      location: TARGET_BRANCH,
      role: "COORD",
      passwordHash,
      mustChangePassword: false,
    },
  })
  console.log(`✔ BEC / Koordinator: ${bec.name} (${bec.email})`)

  // 3. Manager
  const mgr = await prisma.user.upsert({
    where: { NIK: "WHP-MGR-001" },
    update: {
      name: "Demo Manager WH Parung",
      email: "manager.whparung@admin.com",
      branchName: TARGET_BRANCH,
      location: TARGET_BRANCH,
      role: "MANAGER",
      passwordHash,
      mustChangePassword: false,
    },
    create: {
      NIK: "WHP-MGR-001",
      name: "Demo Manager WH Parung",
      email: "manager.whparung@admin.com",
      branchName: TARGET_BRANCH,
      location: TARGET_BRANCH,
      role: "MANAGER",
      passwordHash,
      mustChangePassword: false,
    },
  })
  console.log(`✔ Manager: ${mgr.name} (${mgr.email})`)

  // 4. P2K3 / Delegate
  const p2k3User = await prisma.user.upsert({
    where: { NIK: "WHP-P2K3-001" },
    update: {
      name: "Demo P2K3 WH Parung",
      email: "p2k3.whparung@admin.com",
      branchName: TARGET_BRANCH,
      location: TARGET_BRANCH,
      role: "COORD",
      passwordHash,
      mustChangePassword: false,
    },
    create: {
      NIK: "WHP-P2K3-001",
      name: "Demo P2K3 WH Parung",
      email: "p2k3.whparung@admin.com",
      branchName: TARGET_BRANCH,
      location: TARGET_BRANCH,
      role: "COORD",
      passwordHash,
      mustChangePassword: false,
    },
  })
  const p2k3Approver = await prisma.workPermitApprover.upsert({
    where: {
      branchName_userNik_approvalRole: {
        branchName: TARGET_BRANCH,
        userNik: p2k3User.NIK,
        approvalRole: "P2K3",
      },
    },
    update: {
      isActive: true,
      name: p2k3User.name,
      email: p2k3User.email,
    },
    create: {
      branchName: TARGET_BRANCH,
      userNik: p2k3User.NIK,
      name: p2k3User.name,
      email: p2k3User.email,
      approvalRole: "P2K3",
      isActive: true,
    },
  })
  console.log(`✔ P2K3 / Delegate: ${p2k3User.name} (${p2k3User.email}) - Approver ID: ${p2k3Approver.id}`)

  // 5. Sekretaris P2K3
  const secUser = await prisma.user.upsert({
    where: { NIK: "WHP-SEC-001" },
    update: {
      name: "Demo Sekretaris P2K3 WH Parung",
      email: "sekretaris.whparung@admin.com",
      branchName: TARGET_BRANCH,
      location: TARGET_BRANCH,
      role: "COORD",
      passwordHash,
      mustChangePassword: false,
    },
    create: {
      NIK: "WHP-SEC-001",
      name: "Demo Sekretaris P2K3 WH Parung",
      email: "sekretaris.whparung@admin.com",
      branchName: TARGET_BRANCH,
      location: TARGET_BRANCH,
      role: "COORD",
      passwordHash,
      mustChangePassword: false,
    },
  })
  const secApprover = await prisma.workPermitApprover.upsert({
    where: {
      branchName_userNik_approvalRole: {
        branchName: TARGET_BRANCH,
        userNik: secUser.NIK,
        approvalRole: "SECRETARY",
      },
    },
    update: {
      isActive: true,
      name: secUser.name,
      email: secUser.email,
    },
    create: {
      branchName: TARGET_BRANCH,
      userNik: secUser.NIK,
      name: secUser.name,
      email: secUser.email,
      approvalRole: "SECRETARY",
      isActive: true,
    },
  })
  console.log(`✔ Sekretaris P2K3: ${secUser.name} (${secUser.email}) - Approver ID: ${secApprover.id}`)

  // 6. WHM / DWHM (Requester)
  const whm = await prisma.user.upsert({
    where: { NIK: "WHP-REQ-001" },
    update: {
      name: "Demo WHM WH Parung",
      email: "whm.whparung@admin.com",
      branchName: TARGET_BRANCH,
      location: TARGET_BRANCH,
      role: "REQUESTER",
      passwordHash,
      mustChangePassword: false,
    },
    create: {
      NIK: "WHP-REQ-001",
      name: "Demo WHM WH Parung",
      email: "whm.whparung@admin.com",
      branchName: TARGET_BRANCH,
      location: TARGET_BRANCH,
      role: "REQUESTER",
      passwordHash,
      mustChangePassword: false,
    },
  })
  console.log(`✔ WHM / DWHM: ${whm.name} (${whm.email})`)

  // 7. Tambahkan 1 PicAssignment rutin untuk BES di ruangan Warehouse agar To-Do list rutin siap diuji
  const whRoom = await prisma.room.findFirst({
    where: { area: { type: "WAREHOUSE" } },
    select: { id: true, name: true, area: { select: { name: true } } },
  })

  if (whRoom) {
    const assignment = await prisma.picAssignment.upsert({
      where: { id: "whp-assignment-bes-001" },
      update: {
        userNik: bes.NIK,
        roomId: whRoom.id,
        period: "MONTHLY",
        formCode: "FRM_TSM_002",
        isActive: true,
      },
      create: {
        id: "whp-assignment-bes-001",
        userNik: bes.NIK,
        roomId: whRoom.id,
        period: "MONTHLY",
        formCode: "FRM_TSM_002",
        isActive: true,
      },
    })
    console.log(`✔ PIC Assignment Rutin BES: ${whRoom.name} (${whRoom.area.name}) - ID: ${assignment.id}`)
  }

  console.log("\nSemua akun demo berhasil disiapkan dan dapat dijalankan ulang (idempoten)!")
}

if (process.argv[1]?.endsWith("seed-wh-demo-accounts.ts")) {
  seedWhDemoAccounts().catch((err) => {
    console.error("Gagal seed akun WH demo:", err)
    process.exit(1)
  })
}
