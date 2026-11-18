import { getPrisma } from "@/lib/prisma"
import { getWorkPermitUser } from "@/lib/work-permits/current-user"
import { getFinalWorkPermitApproval } from "@/lib/work-permits/final-approval"
import { generateWorkPermitPdf } from "@/lib/work-permits/pdf"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ permitCode: string }> }
) {
  const [user, { permitCode }] = await Promise.all([
    getWorkPermitUser(),
    params,
  ])
  if (!user) return new Response("Silakan masuk ke SPARTA.", { status: 401 })
  if (user.role !== "ES")
    return new Response("Izin kerja tidak ditemukan.", { status: 404 })

  const permit = await getPrisma().workPermit.findUnique({
    where: { permitCode, applicantNik: user.NIK },
    include: { applicant: { select: { name: true, branchName: true } } },
  })
  const final = permit && getFinalWorkPermitApproval(permit)
  if (!permit || !final)
    return new Response("PDF izin kerja tidak tersedia.", { status: 404 })

  const bytes = await generateWorkPermitPdf(permit, final)
  const filename = permit.permitCode.replace(/[^a-zA-Z0-9_-]+/g, "-")
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}-MED-003.pdf"`,
      "Cache-Control": "private, no-store",
    },
  })
}
