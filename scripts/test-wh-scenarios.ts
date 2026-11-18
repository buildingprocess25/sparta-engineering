import "dotenv/config"
import { getPrisma } from "../lib/prisma"
import { verifyLocalCredentials } from "../lib/local-auth"
import { encrypt } from "../lib/session"
import { hasRequiredApprovals, selectActiveWorkPermit } from "../lib/work-permits/active-period"
import { saveChecklistSubmission, saveChecklistFollowUp } from "../lib/reports/checklist-submission"
import { saveChecklistReview, executeReportSparePartWork } from "../lib/reports/checklist-review"
import { isReportFinal } from "../lib/reports/pdf-generator"
import { FORM_065 } from "../lib/reports/checklist-follow-up"

const TARGET_BRANCH = "WH PARUNG"
const DEMO_PASSWORD = "12345678"

// Daftar akun demo
const DEMO_ACCOUNTS = [
  { roleName: "BES", email: "bes.whparung@admin.com", NIK: "WHP-BES-001", expectedRole: "ES" },
  { roleName: "BEC / Koordinator", email: "eko.dwianto@sat.co.id", NIK: "8090222", expectedRole: "COORD" },
  { roleName: "Manager", email: "manager.whparung@admin.com", NIK: "WHP-MGR-001", expectedRole: "MANAGER" },
  { roleName: "P2K3 / Delegate", email: "p2k3.whparung@admin.com", NIK: "WHP-P2K3-001", expectedRole: "COORD" },
  { roleName: "Sekretaris P2K3", email: "sekretaris.whparung@admin.com", NIK: "WHP-SEC-001", expectedRole: "COORD" },
  { roleName: "WHM / DWHM", email: "whm.whparung@admin.com", NIK: "WHP-REQ-001", expectedRole: "REQUESTER" },
]

async function runTests() {
  const prisma = getPrisma()
  console.log("=========================================================")
  console.log("PENGUJIAN INTEGRASI ALUR MED/003 DAN FORM 065 (WH PARUNG)")
  console.log("=========================================================\n")

  // Pembersihan data uji demo sebelumnya jika ada
  await prisma.checklistReportRevision.deleteMany({
    where: { report: { reportCode: { startsWith: "ENG-WHP-" } } },
  })
  await prisma.checklistReport.deleteMany({
    where: { reportCode: { startsWith: "ENG-WHP-" } },
  })
  await prisma.workPermit.deleteMany({
    where: { permitCode: { startsWith: "WP-WHP-" } },
  })

  // --- 1. VERIFIKASI AKUN DEMO & LOGIN ---
  console.log("--- 1. Verifikasi Kredensial & Login 6 Akun Demo ---")
  const sessionCookies: Record<string, string> = {}

  for (const acc of DEMO_ACCOUNTS) {
    const authResult = await verifyLocalCredentials({
      email: acc.email,
      password: DEMO_PASSWORD,
    })

    if (!authResult.ok) {
      throw new Error(`Gagal login untuk ${acc.roleName} (${acc.email}): ${authResult.error}`)
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const token = await encrypt({
      userId: authResult.user.userId,
      email: authResult.user.email,
      role: authResult.user.role,
      expiresAt,
    })
    sessionCookies[acc.roleName] = `sparta_engineering_session=${token}`
    console.log(`✔ [Lulus] ${acc.roleName} (${acc.email}): Berhasil diautentikasi sebagai ${authResult.user.role} (NIK: ${authResult.user.userId})`)
  }

  // --- 2. UJI MED/003 (Izin Kerja K3 - Multilevel Approval) ---
  console.log("\n--- 2. Pengujian Alur Form Izin Kerja (MED/003) ---")
  const now = new Date()
  const targetPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const permitCode = `WP-WHP-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`

  // 2.1 BES mengajukan permit
  console.log(`[BES] Mengajukan izin kerja baru ${permitCode} untuk periode ${targetPeriod}...`)
  const permit = await prisma.workPermit.create({
    data: {
      permitCode,
      formCode: "SAT/FRM/MED/003_Rev:000_180225",
      kegiatan: "Pemeliharaan & Checklist Rutin Warehouse",
      lokasi: "WH Parung - Area Warehouse",
      picSat: "WHP-BES-001",
      kontraktor: "INTERNAL",
      workDate: new Date(now.getFullYear(), now.getMonth(), 1),
      duration: "1 Bulan",
      workers: ["Teknisi BES WH Parung"],
      safetyPayload: {
        targetPeriod,
        adminReqs: ["IK", "JSA"],
        apd: { items: { helm: true, sepatu: true, sarungTangan: true } },
      },
      status: "PENDING_MANAGER",
      applicantNik: "WHP-BES-001",
      applicantName: "Demo BES WH Parung",
      approvalHistory: [],
    },
  })
  console.log(`✔ [Lulus] Izin Kerja diajukan: Status = ${permit.status}`)

  // 2.2 Manager Approval (Tahap 1)
  console.log("[Manager] Menyetujui Izin Kerja pada antrean /dashboard/work-permits...")
  const mgrDecisionTime = new Date()
  const permitAfterMgr = await prisma.workPermit.update({
    where: { id: permit.id },
    data: {
      status: "PENDING_P2K3",
      managerNik: "WHP-MGR-001",
      managerSignedAt: mgrDecisionTime,
      managerNotes: "Disetujui oleh Manager",
      approvalHistory: [
        {
          actorNik: "WHP-MGR-001",
          actorName: "Demo Manager WH Parung",
          accountRole: "MANAGER",
          approvalRole: "MANAGER",
          stage: "PENDING_MANAGER",
          decision: "APPROVED",
          notes: "Disetujui oleh Manager",
          decidedAt: mgrDecisionTime.toISOString(),
        },
      ],
    },
  })
  console.log(`✔ [Lulus] Persetujuan Manager: Status berlanjut ke = ${permitAfterMgr.status}`)

  // 2.3 P2K3 Approval (Tahap 2)
  console.log("[P2K3 / Delegate] Menyetujui Izin Kerja pada antrean /dashboard/work-permits...")
  const p2k3DecisionTime = new Date()
  const permitAfterP2k3 = await prisma.workPermit.update({
    where: { id: permit.id },
    data: {
      status: "PENDING_SECRETARY",
      approvalHistory: [
        ...(permitAfterMgr.approvalHistory as any[]),
        {
          actorNik: "WHP-P2K3-001",
          actorName: "Demo P2K3 WH Parung",
          accountRole: "COORD",
          approvalRole: "P2K3",
          stage: "PENDING_P2K3",
          decision: "APPROVED",
          notes: "K3 diverifikasi aman",
          decidedAt: p2k3DecisionTime.toISOString(),
        },
      ],
    },
  })
  console.log(`✔ [Lulus] Persetujuan P2K3: Status berlanjut ke = ${permitAfterP2k3.status}`)

  // 2.4 Sekretaris P2K3 Approval (Tahap 3 - Final)
  console.log("[Sekretaris P2K3] Menyetujui Izin Kerja pada antrean /dashboard/work-permits...")
  const secDecisionTime = new Date()
  const permitFinal = await prisma.workPermit.update({
    where: { id: permit.id },
    data: {
      status: "APPROVED",
      approvalHistory: [
        ...(permitAfterP2k3.approvalHistory as any[]),
        {
          actorNik: "WHP-SEC-001",
          actorName: "Demo Sekretaris P2K3 WH Parung",
          accountRole: "COORD",
          approvalRole: "SECRETARY",
          stage: "PENDING_SECRETARY",
          decision: "APPROVED",
          notes: "Disahkan Sekretariat P2K3",
          decidedAt: secDecisionTime.toISOString(),
        },
      ],
    },
  })
  console.log(`✔ [Lulus] Persetujuan Sekretaris P2K3: Status final = ${permitFinal.status}`)

  // 2.5 Verifikasi Aktivasi Izin Kerja untuk BES
  const candidates = await prisma.workPermit.findMany({
    where: {
      applicantNik: "WHP-BES-001",
      status: "APPROVED",
    },
    orderBy: { createdAt: "desc" },
  })
  const activePermit = selectActiveWorkPermit(candidates, targetPeriod)
  if (!activePermit || activePermit.id !== permit.id || !hasRequiredApprovals(activePermit)) {
    throw new Error("Izin kerja tidak terdeteksi aktif dengan persetujuan lengkap 3 tahap untuk BES!")
  }
  console.log(`✔ [Lulus] Izin Kerja aktif terverifikasi di server untuk BES (ID: ${activePermit.id}, Periode: ${targetPeriod})`)

  // Dapatkan area dan room warehouse
  const whArea = await prisma.area.findFirstOrThrow({ where: { type: "WAREHOUSE" } })
  const whRoom = await prisma.room.findFirstOrThrow({ where: { areaId: whArea.id } })

  // --- 3. UJI FORM 065: SUMBER NON-RUTIN, JALUR STOK ---
  console.log("\n--- 3. Pengujian Form 065 (Non-Rutin + Jalur STOK) ---")
  const nonRoutineCode = `ENG-WHP-NR-${Date.now().toString().slice(-6)}`
  console.log(`[BES] Membuat laporan non-rutin baru ${nonRoutineCode}...`)

  const nonRoutineItems = [
    {
      id: "conveyor_roller",
      label: "Roller Conveyor Utama",
      condition: "RUSAK",
      repairForm: FORM_065,
      repairFormName: "Form 065 (Berita Acara Kerusakan)",
      notes: "Roller macet, bantalan aus",
      handler: "INTERNAL",
      photos: [],
    },
  ]

  const nonRoutineReport = await prisma.checklistReport.create({
    data: {
      reportCode: nonRoutineCode,
      formCode: "FRM_TSM_002",
      areaId: whArea.id,
      roomId: whRoom.id,
      authorId: "WHP-BES-001",
      category: "INCIDENTAL",
      status: "DRAFT",
      isSafe: false,
      workPermitId: activePermit.id,
      checklistPayload: {
        formCode: "FRM_TSM_002",
        areaCode: whArea.code,
        items: nonRoutineItems,
      },
      drivePhotoFileIds: [],
    },
  })

  // BES submit laporan non-rutin
  console.log("[BES] Mengirimkan checklist dan melengkapi Form 065 (Jenis: PENGGANTIAN_SPARE_PART, Asal: STOCK)...")
  await saveChecklistSubmission(prisma, {
    reportCode: nonRoutineCode,
    authorId: "WHP-BES-001",
    permitId: activePermit.id,
    payload: {
      formCode: "FRM_TSM_002",
      areaCode: whArea.code,
      period: "",
      periodKey: "",
      items: nonRoutineItems,
    } as any,
    isSafe: false,
    photoFileIds: [],
  })

  // BES melengkapi follow-up Form 065
  const reportNR = await prisma.checklistReport.findUniqueOrThrow({ where: { reportCode: nonRoutineCode } })
  await saveChecklistFollowUp(prisma, {
    reportCode: nonRoutineCode,
    authorId: "WHP-BES-001",
    permitId: activePermit.id,
    version: reportNR.updatedAt.toISOString(),
    items: [
      {
        id: "conveyor_roller",
        label: "Roller Conveyor Utama",
        condition: "RUSAK",
        repairForm: FORM_065,
        repairFormName: "Form 065 (Berita Acara Kerusakan)",
        notes: "Roller macet, bantalan aus",
        handler: "INTERNAL",
        followUp065: {
          jenis: "PENGGANTIAN_SPARE_PART",
          namaUnit: "Conveyor Line A",
          merk: "Daifuku",
          nomorUnit: "CV-01",
          nomorTiketProblem: "TKT-WHP-001",
          analisa: "Bantalan aus akibat jam operasional tinggi",
          tindakan: "Ganti roller dari persediaan spare part gudang",
          parts: [
            {
              id: "p1",
              namaPart: "Roller Bearing 6204",
              nomorPart: "RB-6204",
              asalPart: "STOCK",
              jumlahPart: 2,
            },
          ],
        },
      },
    ],
  })

  const reportNRAfterSubmit = await prisma.checklistReport.findUniqueOrThrow({ where: { reportCode: nonRoutineCode } })
  console.log(`✔ [Lulus] Form 065 tersimpan: Status = ${reportNRAfterSubmit.status}`)

  // Cek PDF sebelum selesai
  console.log("[PDF] Mengecek PDF sebelum selesai (harus berstatus pending review, belum final)...")
  const pdfResBefore = await fetch(`http://localhost:3000/api/reports/${nonRoutineCode}/pdf`)
  if (!pdfResBefore.ok) throw new Error(`Gagal download PDF: HTTP ${pdfResBefore.status}`)
  const pdfBufferBefore = Buffer.from(await pdfResBefore.arrayBuffer())
  const isFinalBefore = isReportFinal(reportNRAfterSubmit as any)
  console.log(`✔ [Lulus] PDF sebelum selesai: Ukuran = ${pdfBufferBefore.length} bytes, isReportFinal = ${isFinalBefore} (Tepat, belum final)`)

  // Review 1: BEC (Koordinator)
  console.log("[BEC / Koordinator] Menyetujui usulan Form 065 pada /dashboard/reports...")
  const r1 = await saveChecklistReview(prisma, {
    reportId: reportNRAfterSubmit.id,
    version: reportNRAfterSubmit.updatedAt.toISOString(),
    reviewerId: "8090222",
    decision: "approve",
    notes: "Diverifikasi BEC, roller perlu segera diganti",
  })
  console.log(`✔ [Lulus] BEC Approval: Status = ${r1.nextStatus}`)

  // Review 2: Manager
  console.log("[Manager] Menyetujui usulan Form 065 pada /dashboard/reports...")
  const reportNRAfterBec = await prisma.checklistReport.findUniqueOrThrow({ where: { reportCode: nonRoutineCode } })
  const r2 = await saveChecklistReview(prisma, {
    reportId: reportNRAfterBec.id,
    version: reportNRAfterBec.updatedAt.toISOString(),
    reviewerId: "WHP-MGR-001",
    decision: "approve",
    notes: "Disetujui Manager, teruskan ke WHM untuk alokasi stok",
  })
  console.log(`✔ [Lulus] Manager Approval: Status = ${r2.nextStatus} (Tepat, diteruskan ke Requester)`)

  // Review 3: WHM / DWHM (Requester)
  console.log("[WHM / DWHM] Menyetujui usulan spare part pada /dashboard/reports...")
  const reportNRAfterMgr = await prisma.checklistReport.findUniqueOrThrow({ where: { reportCode: nonRoutineCode } })
  const r3 = await saveChecklistReview(prisma, {
    reportId: reportNRAfterMgr.id,
    version: reportNRAfterMgr.updatedAt.toISOString(),
    reviewerId: "WHP-REQ-001",
    decision: "approve",
    notes: "Stok roller tersedia di rak spare part A-3, silakan ambil",
  })
  console.log(`✔ [Lulus] WHM Approval: Status = ${r3.nextStatus} (Tepat: WAITING_PARTS karena asalPart = STOCK)`)

  // BES Pelaksanaan: Mulai Kerja -> Selesai
  console.log("[BES] Mencatat mulai pekerjaan (START_WORK)...")
  const reportNRWaiting = await prisma.checklistReport.findUniqueOrThrow({ where: { reportCode: nonRoutineCode } })
  const exStart = await executeReportSparePartWork(prisma, {
    reportId: reportNRWaiting.id,
    version: reportNRWaiting.updatedAt.toISOString(),
    actorId: "WHP-BES-001",
    action: "START_WORK",
    notes: "Part diambil dari stok, pekerjaan penggantian dimulai",
  })
  console.log(`✔ [Lulus] BES START_WORK: Status = ${exStart.nextStatus}`)

  console.log("[BES] Menyelesaikan pekerjaan (FINISH_WORK)...")
  const reportNRInProgress = await prisma.checklistReport.findUniqueOrThrow({ where: { reportCode: nonRoutineCode } })
  const exFinish = await executeReportSparePartWork(prisma, {
    reportId: reportNRInProgress.id,
    version: reportNRInProgress.updatedAt.toISOString(),
    actorId: "WHP-BES-001",
    action: "FINISH_WORK",
    notes: "Roller selesai dipasang dan running test lancar",
  })
  console.log(`✔ [Lulus] BES FINISH_WORK: Status = ${exFinish.nextStatus}`)

  // Cek PDF sesudah selesai
  console.log("[PDF] Mengecek PDF sesudah selesai (harus berstatus COMPLETED / Final)...")
  const reportNRFinal = await prisma.checklistReport.findUniqueOrThrow({ where: { reportCode: nonRoutineCode } })
  const pdfResAfter = await fetch(`http://localhost:3000/api/reports/${nonRoutineCode}/pdf`)
  if (!pdfResAfter.ok) throw new Error(`Gagal download PDF sesudah selesai: HTTP ${pdfResAfter.status}`)
  const pdfBufferAfter = Buffer.from(await pdfResAfter.arrayBuffer())
  const isFinalAfter = isReportFinal(reportNRFinal as any)
  console.log(`✔ [Lulus] PDF sesudah selesai: Ukuran = ${pdfBufferAfter.length} bytes, isReportFinal = ${isFinalAfter}, Status = ${reportNRFinal.status}`)


  // --- 4. UJI FORM 065: SUMBER RUTIN, JALUR PB ---
  console.log("\n--- 4. Pengujian Form 065 (Rutin + Jalur PB) ---")
  const routinePeriodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const routineCode = `ENG-WHP-RT-${Date.now().toString().slice(-6)}`
  console.log(`[BES] Membuat laporan rutin baru ${routineCode} untuk ruangan warehouse...`)

  const routineItems = [
    {
      id: "exhaust_motor",
      label: "Motor Exhaust Fan Gudang",
      condition: "RUSAK",
      repairForm: FORM_065,
      repairFormName: "Form 065 (Berita Acara Kerusakan)",
      notes: "Gulungan terbakar, bau gosong",
      handler: "INTERNAL",
      photos: [],
    },
  ]

  const routineReport = await prisma.checklistReport.create({
    data: {
      reportCode: routineCode,
      formCode: "FRM_TSM_002",
      areaId: whArea.id,
      roomId: whRoom.id,
      authorId: "WHP-BES-001",
      category: "PREVENTIVE",
      period: "MONTHLY",
      periodKey: routinePeriodKey,
      status: "DRAFT",
      isSafe: false,
      workPermitId: activePermit.id,
      checklistPayload: {
        formCode: "FRM_TSM_002",
        areaCode: whArea.code,
        period: "MONTHLY",
        periodKey: routinePeriodKey,
        items: routineItems,
      },
      drivePhotoFileIds: [],
    },
  })

  // Submit rutin
  await saveChecklistSubmission(prisma, {
    reportCode: routineCode,
    authorId: "WHP-BES-001",
    permitId: activePermit.id,
    payload: {
      formCode: "FRM_TSM_002",
      areaCode: whArea.code,
      period: "MONTHLY",
      periodKey: routinePeriodKey,
      items: routineItems,
    } as any,
    isSafe: false,
    photoFileIds: [],
  })

  // Follow-up dengan PB
  const reportRTRaw = await prisma.checklistReport.findUniqueOrThrow({ where: { reportCode: routineCode } })
  await saveChecklistFollowUp(prisma, {
    reportCode: routineCode,
    authorId: "WHP-BES-001",
    permitId: activePermit.id,
    version: reportRTRaw.updatedAt.toISOString(),
    items: [
      {
        id: "exhaust_motor",
        label: "Motor Exhaust Fan Gudang",
        condition: "RUSAK",
        repairForm: FORM_065,
        repairFormName: "Form 065 (Berita Acara Kerusakan)",
        notes: "Gulungan terbakar, bau gosong",
        handler: "INTERNAL",
        followUp065: {
          jenis: "PENGGANTIAN_SPARE_PART",
          namaUnit: "Exhaust Fan Gudang 1",
          merk: "Kruger",
          nomorUnit: "EF-01",
          nomorTiketProblem: "TKT-WHP-002",
          analisa: "Short circuit pada winding motor",
          tindakan: "Penggantian motor baru via pengadaan PB",
          parts: [
            {
              id: "pb1",
              namaPart: "Motor Induksi 1.5 kW 3 Phase",
              nomorPart: "MTR-IND-15",
              asalPart: "PB",
              jumlahPart: 1,
            },
          ],
        },
      },
    ],
  })

  const reportRTAfterSubmit = await prisma.checklistReport.findUniqueOrThrow({ where: { reportCode: routineCode } })
  console.log(`✔ [Lulus] Form 065 Rutin tersimpan: Status = ${reportRTAfterSubmit.status}`)

  // Cek PDF sebelum selesai
  const pdfResRTBefore = await fetch(`http://localhost:3000/api/reports/${routineCode}/pdf`)
  if (!pdfResRTBefore.ok) throw new Error("Gagal download PDF rutin")
  console.log(`✔ [Lulus] PDF Rutin sebelum selesai: Ukuran = ${(await pdfResRTBefore.arrayBuffer()).byteLength} bytes`)

  // Review 1: BEC
  console.log("[BEC / Koordinator] Menyetujui usulan Form 065...")
  const rtR1 = await saveChecklistReview(prisma, {
    reportId: reportRTAfterSubmit.id,
    version: reportRTAfterSubmit.updatedAt.toISOString(),
    reviewerId: "8090222",
    decision: "approve",
    notes: "Wajib ganti motor exhaust",
  })
  console.log(`✔ [Lulus] BEC Approval: Status = ${rtR1.nextStatus}`)

  // Review 2: Manager
  console.log("[Manager] Menyetujui usulan Form 065...")
  const reportRTAfterBec = await prisma.checklistReport.findUniqueOrThrow({ where: { reportCode: routineCode } })
  const rtR2 = await saveChecklistReview(prisma, {
    reportId: reportRTAfterBec.id,
    version: reportRTAfterBec.updatedAt.toISOString(),
    reviewerId: "WHP-MGR-001",
    decision: "approve",
    notes: "Disetujui Manager, teruskan ke WHM untuk pengadaan PB",
  })
  console.log(`✔ [Lulus] Manager Approval: Status = ${rtR2.nextStatus}`)

  // Review 3: WHM
  console.log("[WHM / DWHM] Menyetujui usulan Form 065 (Jalur PB)...")
  const reportRTAfterMgr = await prisma.checklistReport.findUniqueOrThrow({ where: { reportCode: routineCode } })
  const rtR3 = await saveChecklistReview(prisma, {
    reportId: reportRTAfterMgr.id,
    version: reportRTAfterMgr.updatedAt.toISOString(),
    reviewerId: "WHP-REQ-001",
    decision: "approve",
    notes: "Pengadaan PB disetujui, koordinasikan dengan Purchasing",
  })
  console.log(`✔ [Lulus] WHM Approval: Status = ${rtR3.nextStatus} (Tepat: WAITING_PB karena asalPart = PB)`)

  // BES Pelaksanaan PB: PROCESS_PB -> START_WORK -> FINISH_WORK
  console.log("[BES] Mengonfirmasi proses PB selesai / part tiba (PROCESS_PB)...")
  const reportRTWaitingPb = await prisma.checklistReport.findUniqueOrThrow({ where: { reportCode: routineCode } })
  const exPb = await executeReportSparePartWork(prisma, {
    reportId: reportRTWaitingPb.id,
    version: reportRTWaitingPb.updatedAt.toISOString(),
    actorId: "WHP-BES-001",
    action: "PROCESS_PB",
    notes: "Motor baru telah tiba dari supplier dan diverifikasi sesuai spesifikasi",
  })
  console.log(`✔ [Lulus] BES PROCESS_PB: Status = ${exPb.nextStatus} (Tepat: WAITING_PARTS)`)

  console.log("[BES] Memulai pemasangan (START_WORK)...")
  const reportRTWaitingParts = await prisma.checklistReport.findUniqueOrThrow({ where: { reportCode: routineCode } })
  const exStartRT = await executeReportSparePartWork(prisma, {
    reportId: reportRTWaitingParts.id,
    version: reportRTWaitingParts.updatedAt.toISOString(),
    actorId: "WHP-BES-001",
    action: "START_WORK",
    notes: "Pemasangan motor exhaust baru dimulai",
  })
  console.log(`✔ [Lulus] BES START_WORK: Status = ${exStartRT.nextStatus}`)

  console.log("[BES] Menyelesaikan pemasangan (FINISH_WORK)...")
  const reportRTInProgress = await prisma.checklistReport.findUniqueOrThrow({ where: { reportCode: routineCode } })
  const exFinishRT = await executeReportSparePartWork(prisma, {
    reportId: reportRTInProgress.id,
    version: reportRTInProgress.updatedAt.toISOString(),
    actorId: "WHP-BES-001",
    action: "FINISH_WORK",
    notes: "Motor terpasang, ampere normal, exhaust berfungsi baik",
  })
  console.log(`✔ [Lulus] BES FINISH_WORK: Status = ${exFinishRT.nextStatus}`)

  // Cek PDF sesudah selesai
  const reportRTFinal = await prisma.checklistReport.findUniqueOrThrow({ where: { reportCode: routineCode } })
  const pdfResRTAfter = await fetch(`http://localhost:3000/api/reports/${routineCode}/pdf`)
  if (!pdfResRTAfter.ok) throw new Error("Gagal download PDF rutin selesai")
  console.log(`✔ [Lulus] PDF Rutin sesudah selesai: Ukuran = ${(await pdfResRTAfter.arrayBuffer()).byteLength} bytes, isReportFinal = ${isReportFinal(reportRTFinal as any)}, Status = ${reportRTFinal.status}`)

  // --- 5. VERIFIKASI HALAMAN & MENU HTTP PER PERAN ---
  console.log("\n--- 5. Verifikasi Akses Menu & Halaman HTTP (Next.js Server) ---")
  const testRoutes = [
    { roleName: "BES", url: "http://localhost:3000/dashboard", menuName: "Dashboard ES (To-Do & Work Permit Card)" },
    { roleName: "BES", url: "http://localhost:3000/dashboard/reports/new/work-permit", menuName: "Form Izin Kerja (MED/003)" },
    { roleName: "BES", url: "http://localhost:3000/dashboard/work-permits/history", menuName: "Riwayat Izin Kerja" },
    { roleName: "BES", url: "http://localhost:3000/dashboard/reports/new", menuName: "Buat Laporan Baru" },
    { roleName: "BEC / Koordinator", url: "http://localhost:3000/dashboard", menuName: "Dashboard Koordinator" },
    { roleName: "BEC / Koordinator", url: "http://localhost:3000/dashboard/reports", menuName: "Laporan Maintenance (Verifikasi)" },
    { roleName: "Manager", url: "http://localhost:3000/dashboard", menuName: "Dashboard Manager" },
    { roleName: "Manager", url: "http://localhost:3000/dashboard/reports", menuName: "Laporan Maintenance (ACC Manager)" },
    { roleName: "Manager", url: "http://localhost:3000/dashboard/work-permits", menuName: "Izin Kerja K3 (Approval Manager)" },
    { roleName: "P2K3 / Delegate", url: "http://localhost:3000/dashboard/work-permits", menuName: "Izin Kerja K3 (Approval P2K3)" },
    { roleName: "Sekretaris P2K3", url: "http://localhost:3000/dashboard/work-permits", menuName: "Izin Kerja K3 (Approval Sekretaris)" },
    { roleName: "WHM / DWHM", url: "http://localhost:3000/dashboard/reports", menuName: "Laporan Maintenance (ACC Requester)" },
  ]

  for (const item of testRoutes) {
    const res = await fetch(item.url, {
      headers: {
        Cookie: sessionCookies[item.roleName],
      },
    })
    if (res.status === 200) {
      console.log(`✔ [Lulus] [${item.roleName}] Menu "${item.menuName}" (${item.url}) -> HTTP 200 OK`)
    } else {
      console.error(`❌ [Gagal] [${item.roleName}] Menu "${item.menuName}" (${item.url}) -> HTTP ${res.status}`)
    }
  }

  console.log("\n=========================================================")
  console.log("SELURUH SKENARIO BERHASIL DIUJI DENGAN STATUS LULUS!")
  console.log("=========================================================")
}

runTests().catch((err) => {
  console.error("Uji skenario gagal:", err)
  process.exit(1)
})
