import "dotenv/config"
import assert from "assert/strict"
import { getPrisma } from "../lib/prisma"
import { getCurrentPeriodKey } from "../lib/date-utils"
import {
  getActiveWorkPermitWhere,
  selectActiveWorkPermit,
} from "../lib/work-permits/active-period"
import {
  sendApprovalEmail,
  getOutboxEmails,
  clearOutboxEmails,
  getApprovalTokenDetails,
  submitTokenDecision,
} from "../lib/work-permits/email-approval"
import { saveChecklistSubmission } from "../lib/reports/checklist-submission"
import { getSpartaAppMode } from "../lib/sparta-app-mode"

const TARGET_BRANCH = "WH PARUNG"
const BES_NIK = "WHP-BES-001"
const MGR_NIK = "WHP-MGR-001"

async function runP1Med003Tests() {
  assert.equal(getSpartaAppMode(), "demo", "Tes P1 memerlukan mode demo dan database development")
  const prisma = getPrisma()
  console.log("=== STARTING P1 MED/003 E2E TESTS ===")

  // 0. Clean up previous test permits and test outbox
  await prisma.demoOutboxEmail.deleteMany({
    where: { subject: { contains: "WP-TEST-P1-" } },
  })
  await prisma.workPermit.deleteMany({
    where: { permitCode: { startsWith: "WP-TEST-P1-" } },
  })

  // -------------------------------------------------------------
  // Test 1: Kontak Dummy di WH Parung
  // -------------------------------------------------------------
  console.log("\n[Test 1] Verifikasi Kontak Dummy WH Parung di Database...")
  const p2k3Contact = await prisma.workPermitApprover.findFirst({
    where: {
      branchName: TARGET_BRANCH,
      approvalRole: "P2K3",
      isActive: true,
    },
  })
  assert.ok(p2k3Contact, "Kontak P2K3 untuk WH Parung harus ada di WorkPermitApprover")
  assert.ok(p2k3Contact.name, "Nama P2K3 harus tersimpan")
  assert.ok(p2k3Contact.email, "Email P2K3 harus tersimpan")
  console.log(`✔ Kontak P2K3 terverifikasi: ${p2k3Contact.name} (${p2k3Contact.email})`)

  const secContact = await prisma.workPermitApprover.findFirst({
    where: {
      branchName: TARGET_BRANCH,
      approvalRole: "SECRETARY",
      isActive: true,
    },
  })
  assert.ok(secContact, "Kontak Sekretaris P2K3 untuk WH Parung harus ada di WorkPermitApprover")
  assert.ok(secContact.name, "Nama Sekretaris P2K3 harus tersimpan")
  assert.ok(secContact.email, "Email Sekretaris P2K3 harus tersimpan")
  console.log(`✔ Kontak Sekretaris terverifikasi: ${secContact.name} (${secContact.email})`)

  // -------------------------------------------------------------
  // Test 2: BES Mengajukan Izin Kerja (MED/003)
  // -------------------------------------------------------------
  console.log("\n[Test 2] BES Mengajukan Izin Kerja Bulan Berjalan...")
  const now = new Date()
  const currentPeriod = getCurrentPeriodKey("MONTHLY", now)
  const testPermitCode = `WP-TEST-P1-${Date.now()}`

  const permit = await prisma.workPermit.create({
    data: {
      permitCode: testPermitCode,
      formCode: "SAT/FRM/MED/003_Rev:000_180225",
      kegiatan: "Pemeliharaan Rutin Bulanan Test P1",
      lokasi: "WH Parung - Area Receiving",
      picSat: BES_NIK,
      kontraktor: "INTERNAL",
      workDate: now,
      duration: "1 Hari",
      workers: ["Teknisi Test 1", "Teknisi Test 2"],
      safetyPayload: {
        targetPeriod: currentPeriod,
        adminReqs: ["Formulir Izin Kerja", "Safety Briefing"],
        apd: { items: { "Helm Safety": true, "Rompi Reflektor": true, "Sepatu Safety": true } },
      },
      status: "PENDING_MANAGER",
      applicantNik: BES_NIK,
      applicantName: "Demo BES WH Parung",
      approvalHistory: [],
    },
  })
  assert.equal(permit.status, "PENDING_MANAGER")
  console.log(`✔ Izin kerja berhasil diajukan: ${permit.permitCode} (Status: ${permit.status})`)

  // -------------------------------------------------------------
  // Test 3: Manager ACC & Pengiriman Email ke P2K3 / Delegate
  // -------------------------------------------------------------
  console.log("\n[Test 3] Manager ACC dari Dashboard -> Pengiriman Email Outbox P2K3...")
  const mgrUpdated = await prisma.workPermit.update({
    where: { id: permit.id },
    data: {
      status: "PENDING_P2K3",
      managerNik: MGR_NIK,
      managerSignedAt: new Date(),
      managerNotes: "Disetujui oleh Manager untuk review K3",
      approvalHistory: [
        {
          actorNik: MGR_NIK,
          actorName: "Demo Manager WH Parung",
          accountRole: "MANAGER",
          approvalRole: "MANAGER",
          stage: "PENDING_MANAGER",
          decision: "APPROVED",
          notes: "Disetujui oleh Manager untuk review K3",
          decidedAt: new Date().toISOString(),
        },
      ],
    },
  })
  assert.equal(mgrUpdated.status, "PENDING_P2K3")

  // Pemicu outbox email P2K3
  const emailResP2k3 = await sendApprovalEmail(permit.id, "PENDING_P2K3")
  assert.ok(emailResP2k3.ok, "Email P2K3 harus berhasil dibuat")
  assert.ok(emailResP2k3.token, "Token approval P2K3 harus terbuat")

  // Cek Outbox
  const p2k3Email = await prisma.demoOutboxEmail.findFirst({
    where: {
      toEmail: p2k3Contact.email!,
      subject: { contains: permit.permitCode },
    },
    orderBy: { sentAt: "desc" },
  })
  assert.ok(p2k3Email, "Email outbox untuk P2K3 harus tersimpan di database")
  assert.ok(p2k3Email.actionUrl?.includes(emailResP2k3.token!), "Action URL harus memuat token")
  console.log(`✔ Email outbox untuk P2K3 terkirim ke: ${p2k3Email.toEmail}`)
  console.log(`  Subjek: ${p2k3Email.subject}`)
  console.log(`  Action URL: ${p2k3Email.actionUrl}`)

  // -------------------------------------------------------------
  // Test 4: Verifikasi Token & Halaman Approval P2K3 (Tanpa Login)
  // -------------------------------------------------------------
  console.log("\n[Test 4] Membuka Halaman Persetujuan Token & ACC P2K3...")
  const tokenDetailsP2k3 = await getApprovalTokenDetails(emailResP2k3.token!)
  assert.ok(tokenDetailsP2k3.ok)
  assert.equal(tokenDetailsP2k3.canDecide, true, "Token P2K3 harus dalam kondisi canDecide === true")
  assert.equal(tokenDetailsP2k3.isUsed, false)
  assert.equal(tokenDetailsP2k3.isExpired, false)

  // Eksekusi Keputusan P2K3
  const decideP2k3 = await submitTokenDecision({
    token: emailResP2k3.token!,
    decision: "APPROVED",
    notes: "K3 & APD sudah diverifikasi, ACC.",
  })
  if (!decideP2k3.ok) {
    throw new Error("Gagal ACC P2K3: " + decideP2k3.error)
  }
  assert.equal(decideP2k3.permit?.status, "PENDING_SECRETARY")
  console.log(`✔ P2K3 ACC berhasil. Status izin kerja berlanjut ke: ${decideP2k3.permit?.status}`)

  // Cek Outbox otomatis untuk Sekretaris P2K3
  const secEmail = await prisma.demoOutboxEmail.findFirst({
    where: {
      toEmail: secContact.email!,
      subject: { contains: permit.permitCode },
    },
    orderBy: { sentAt: "desc" },
  })
  assert.ok(secEmail, "Email outbox untuk Sekretaris P2K3 harus otomatis muncul setelah P2K3 ACC")
  console.log(`✔ Email outbox untuk Sekretaris P2K3 otomatis dibuat: ${secEmail.toEmail}`)
  console.log(`  Subjek: ${secEmail.subject}`)

  // -------------------------------------------------------------
  // Test 5: Perlindungan Token Reuse & Concurrency
  // -------------------------------------------------------------
  console.log("\n[Test 5] Uji Proteksi Penggunaan Ulang Token (Single-Use Guard)...")
  const reuseAttempt = await submitTokenDecision({
    token: emailResP2k3.token!,
    decision: "APPROVED",
    notes: "Klik kedua yang bersamaan",
  })
  assert.equal(reuseAttempt.ok, false, "Token yang sudah digunakan harus ditolak")
  console.log(`✔ Proteksi berhasil: Token ditolak dengan pesan: "${reuseAttempt.error}"`)

  // -------------------------------------------------------------
  // Test 6: Persetujuan Akhir oleh Sekretaris P2K3
  // -------------------------------------------------------------
  console.log("\n[Test 6] Membuka Halaman Persetujuan Token & ACC Sekretaris P2K3...")
  const secTokenRecord = await prisma.workPermitApprovalToken.findFirst({
    where: {
      permitId: permit.id,
      targetStage: "PENDING_SECRETARY",
      usedAt: null,
    },
  })
  assert.ok(secTokenRecord, "Token Sekretaris harus ditemukan")

  const decideSec = await submitTokenDecision({
    token: secTokenRecord.token,
    decision: "APPROVED",
    notes: "Dokumentasi dan pengesahan K3 selesai, disetujui lengkap.",
  })
  if (!decideSec.ok) {
    throw new Error("Gagal ACC Sekretaris: " + decideSec.error)
  }
  assert.equal(decideSec.permit?.status, "APPROVED")
  console.log(`✔ Sekretaris P2K3 ACC berhasil! Status akhir izin kerja: ${decideSec.permit?.status}`)

  // -------------------------------------------------------------
  // Test 7: Uji Izin Bulan Depan (Approved tapi Belum Berlaku Hari Ini)
  // -------------------------------------------------------------
  console.log("\n[Test 7] Uji Izin Kerja Bulan Depan (Approved tapi Belum Berlaku)...")
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const nextMonthPeriod = getCurrentPeriodKey("MONTHLY", nextMonthDate)
  const nextMonthPermitCode = `WP-TEST-P1-NEXT-${Date.now()}`

  const nextMonthPermit = await prisma.workPermit.create({
    data: {
      permitCode: nextMonthPermitCode,
      formCode: "SAT/FRM/MED/003_Rev:000_180225",
      kegiatan: "Pemeliharaan Bulan Depan",
      lokasi: "WH Parung",
      picSat: BES_NIK,
      kontraktor: "INTERNAL",
      workDate: nextMonthDate,
      duration: "1 Hari",
      workers: ["Teknisi Test"],
      safetyPayload: { targetPeriod: nextMonthPeriod },
      status: "APPROVED",
      applicantNik: BES_NIK,
      applicantName: "Demo BES WH Parung",
    },
  })

  // Cek active permit untuk bulan berjalan: harus permit bulan berjalan, bukan bulan depan
  const candidates = await prisma.workPermit.findMany({
    where: getActiveWorkPermitWhere(BES_NIK, currentPeriod),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  })
  const activeToday = selectActiveWorkPermit(candidates, currentPeriod)

  assert.ok(activeToday, "Harus menemukan izin aktif hari ini")
  assert.equal(
    activeToday.permitCode,
    testPermitCode,
    "Izin aktif hari ini harus izin bulan berjalan, BUKAN izin bulan depan"
  )
  console.log(
    `✔ Validasi masa berlaku berhasil: Izin aktif hari ini adalah ${activeToday.permitCode} (Bulan Depan ${nextMonthPermit.permitCode} menunggu per 1 tgl bulan depan).`
  )

  // -------------------------------------------------------------
  // Test 8: Checklist Terisi Nomor Izin & Terhubung ke WorkPermit
  // -------------------------------------------------------------
  console.log("\n[Test 8] Mengisi Checklist & Memverifikasi workPermitId Terhubung...")
  const area = await prisma.area.findFirst({
    where: { isActive: true },
  })
  assert.ok(area, "Area aktif harus ada")

  const testReportCode = `ENG-TEST-P1-${Date.now()}`
  await prisma.checklistReport.create({
    data: {
      reportCode: testReportCode,
      areaId: area.id,
      authorId: BES_NIK,
      category: "PREVENTIVE",
      formCode: "FRM_TSM_002",
      period: "MONTHLY",
      periodKey: currentPeriod,
      status: "DRAFT",
    },
  })

  // Submit checklist dengan menghubungkan permit.id
  const submitResult = await saveChecklistSubmission(prisma, {
    reportCode: testReportCode,
    authorId: BES_NIK,
    permitId: permit.id,
    payload: {
      formCode: "FRM_TSM_002",
      areaCode: area.code,
      period: "MONTHLY",
      periodKey: currentPeriod,
    },
    isSafe: true,
    photoFileIds: [],
  })
  assert.ok(submitResult, "Submit checklist harus berhasil")

  // Buka kembali laporan checklist dan verifikasi hubungan ke WorkPermit
  const savedReport = await prisma.checklistReport.findUnique({
    where: { reportCode: testReportCode },
    include: {
      workPermit: { select: { id: true, permitCode: true, status: true } },
    },
  })
  assert.ok(savedReport, "Laporan checklist harus ditemukan")
  assert.equal(savedReport.workPermitId, permit.id, "workPermitId harus tersimpan pada laporan")
  assert.ok(savedReport.workPermit, "Relasi workPermit harus berhasil di-load")
  assert.equal(
    savedReport.workPermit.permitCode,
    permit.permitCode,
    "Nomor izin kerja pada laporan harus sesuai"
  )
  assert.equal(savedReport.workPermit.status, "APPROVED", "Status izin kerja harus APPROVED")
  console.log(
    `✔ Laporan ${savedReport.reportCode} berhasil terhubung permanen ke Izin Kerja: ${savedReport.workPermit.permitCode}`
  )

  // Cleanup test records
  await prisma.checklistReport.delete({ where: { id: savedReport.id } })
  await prisma.demoOutboxEmail.deleteMany({
    where: { subject: { contains: "WP-TEST-P1-" } },
  })
  await prisma.workPermit.deleteMany({
    where: { id: { in: [permit.id, nextMonthPermit.id] } },
  })
  console.log("✔ Cleanup data uji selesai.")

  console.log("\n==========================================")
  console.log("SEMUA PENGUJIAN P1 MED/003 LULUS DENGAN BAIK!")
  console.log("==========================================")
}

runP1Med003Tests()
  .catch((err) => {
    console.error("❌ TEST FAILED:", err)
    process.exit(1)
  })
  .finally(async () => {
    await getPrisma().$disconnect()
  })
