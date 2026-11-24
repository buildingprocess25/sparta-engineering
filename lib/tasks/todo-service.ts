import { ChecklistPeriod, TaskStatus } from "@/generated/prisma"
import { getChecklistFormConfig } from "@/lib/checklist-config"
import { getCurrentPeriodKey } from "@/lib/date-utils"
import { getPrisma } from "@/lib/prisma"

export type UserTodoTaskItem = {
  id: string
  assignmentId: string
  targetDate: Date
  periodKey: string
  status: TaskStatus
  formCode: string
  formSlug: string | null
  period: ChecklistPeriod
  completedAt: Date | null
  objectName: string
  objectType: "EQUIPMENT" | "ROOM"
  unitNo?: number
  branchName?: string
  areaName?: string | null
  reportCode?: string | null
}

export type UserTodoSummary = {
  total: number
  pending: number
  completed: number
  overdue: number
  tasks: UserTodoTaskItem[]
}

export async function getUserTodoTasks(
  userNik: string,
  referenceDate: Date = new Date(),
): Promise<UserTodoSummary> {
  const prisma = getPrisma()
  const year = referenceDate.getFullYear()
  const monthNum = referenceDate.getMonth() + 1
  const monthStr = String(monthNum).padStart(2, "0")
  const currentMonthKey = `${year}-${monthStr}`

  // 1. Ambil seluruh penugasan PIC
  const assignments = await prisma.picAssignment.findMany({
    where: {
      userNik,
      isActive: true,
    },
    include: {
      equipment: true,
      room: true,
    },
  })

  if (assignments.length === 0) {
    return { total: 0, pending: 0, completed: 0, overdue: 0, tasks: [] }
  }

  // 2. Siapkan jadwal target untuk bulan ini
  // Sesuai Kalendar CEKLIST.xlsx:
  // Weekly 1: 01-07, Weekly 2: 08-14, Weekly 3: 15-21, Weekly 4: 22-28, Monthly: akhir bulan
  const weekDates: { weekKey: string; targetDate: Date }[] = [
    { weekKey: `${currentMonthKey}-W1`, targetDate: new Date(year, monthNum - 1, 7, 23, 59, 59) },
    { weekKey: `${currentMonthKey}-W2`, targetDate: new Date(year, monthNum - 1, 14, 23, 59, 59) },
    { weekKey: `${currentMonthKey}-W3`, targetDate: new Date(year, monthNum - 1, 21, 23, 59, 59) },
    { weekKey: `${currentMonthKey}-W4`, targetDate: new Date(year, monthNum - 1, 28, 23, 59, 59) },
  ]
  const monthlyTargetDate = new Date(year, monthNum, 0, 23, 59, 59) // hari terakhir bulan berjalan

  // Tentukan minggu aktif saat ini (1..4)
  const todayDay = referenceDate.getDate()
  const currentWeekIndex = Math.min(Math.floor((todayDay - 1) / 7), 3)
  const activeWeek = weekDates[currentWeekIndex]

  // 3. Batch upsert tugas untuk bulan berjalan jika belum ada
  for (const assign of assignments) {
    if (assign.period === ChecklistPeriod.WEEKLY) {
      // Buat tugas untuk minggu aktif
      await prisma.checklistTask.upsert({
        where: {
          assignmentId_periodKey: {
            assignmentId: assign.id,
            periodKey: activeWeek.weekKey,
          },
        },
        update: {},
        create: {
          assignmentId: assign.id,
          periodKey: activeWeek.weekKey,
          targetDate: activeWeek.targetDate,
          status: TaskStatus.PENDING,
        },
      })
    } else if (assign.period === ChecklistPeriod.QUARTERLY) {
      const quarterKey = getCurrentPeriodKey("QUARTERLY", referenceDate)
      const qMonth = Math.floor(referenceDate.getMonth() / 3) * 3 + 3
      const qTargetDate = new Date(year, qMonth, 0, 23, 59, 59)
      await prisma.checklistTask.upsert({
        where: {
          assignmentId_periodKey: {
            assignmentId: assign.id,
            periodKey: quarterKey,
          },
        },
        update: {},
        create: {
          assignmentId: assign.id,
          periodKey: quarterKey,
          targetDate: qTargetDate,
          status: TaskStatus.PENDING,
        },
      })
    } else if (assign.period === ChecklistPeriod.SEMESTER) {
      const semKey = getCurrentPeriodKey("SEMESTER", referenceDate)
      const sMonth = referenceDate.getMonth() < 6 ? 6 : 12
      const sTargetDate = new Date(year, sMonth, 0, 23, 59, 59)
      await prisma.checklistTask.upsert({
        where: {
          assignmentId_periodKey: {
            assignmentId: assign.id,
            periodKey: semKey,
          },
        },
        update: {},
        create: {
          assignmentId: assign.id,
          periodKey: semKey,
          targetDate: sTargetDate,
          status: TaskStatus.PENDING,
        },
      })
    } else {
      // Monthly: buat tugas periode bulan berjalan
      await prisma.checklistTask.upsert({
        where: {
          assignmentId_periodKey: {
            assignmentId: assign.id,
            periodKey: currentMonthKey,
          },
        },
        update: {},
        create: {
          assignmentId: assign.id,
          periodKey: currentMonthKey,
          targetDate: monthlyTargetDate,
          status: TaskStatus.PENDING,
        },
      })
    }
  }

  const currentQuarterKey = getCurrentPeriodKey("QUARTERLY", referenceDate)
  const currentSemesterKey = getCurrentPeriodKey("SEMESTER", referenceDate)

  // 4. Query seluruh tugas user untuk bulan/triwulan/semester aktif ini
  const rawTasks = await prisma.checklistTask.findMany({
    where: {
      assignment: {
        userNik,
      },
      OR: [
        { periodKey: { startsWith: currentMonthKey } },
        { periodKey: currentQuarterKey },
        { periodKey: currentSemesterKey },
      ],
    },
    include: {
      assignment: {
        include: {
          equipment: { include: { area: true, room: { include: { area: true } } } },
          room: { include: { area: true } },
        },
      },
      report: {
        select: {
          reportCode: true,
        },
      },
    },
    orderBy: [
      { status: "asc" },
      { targetDate: "asc" },
    ],
  })

  const now = new Date()

  // 5. Format dan mapping item
  const formattedTasks: UserTodoTaskItem[] = rawTasks.map((t) => {
    const isOverdue = t.status === TaskStatus.PENDING && t.targetDate < now
    const status = isOverdue ? TaskStatus.OVERDUE : t.status

    const equip = t.assignment.equipment
    const room = t.assignment.room

    let objectName = "Objek Checklist"
    let objectType: "EQUIPMENT" | "ROOM" = "EQUIPMENT"

    if (equip) {
      objectName = `${equip.name} ${equip.unitNo ? `Unit ${equip.unitNo}` : ""}`.trim()
      objectType = "EQUIPMENT"
    } else if (room) {
      objectName = room.name
      objectType = "ROOM"
    }

    return {
      id: t.id,
      assignmentId: t.assignmentId,
      targetDate: t.targetDate,
      periodKey: t.periodKey,
      status,
      formCode: t.assignment.formCode,
      formSlug: getChecklistFormConfig(t.assignment.formCode)?.id ?? null,
      period: t.assignment.period,
      completedAt: t.completedAt,
      objectName,
      objectType,
      unitNo: equip?.unitNo,
      branchName: equip?.branchName,
      areaName: room?.area?.name ?? equip?.room?.area?.name ?? equip?.area?.name ?? null,
      reportCode: t.report?.reportCode || null,
    }
  })

  const pending = formattedTasks.filter((t) => t.status === TaskStatus.PENDING).length
  const overdue = formattedTasks.filter((t) => t.status === TaskStatus.OVERDUE).length
  const completed = formattedTasks.filter((t) => t.status === TaskStatus.COMPLETED).length

  return {
    total: formattedTasks.length,
    pending,
    completed,
    overdue,
    tasks: formattedTasks,
  }
}
