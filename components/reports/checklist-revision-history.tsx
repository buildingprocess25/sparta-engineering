import type { ChecklistRevisionHistory } from "@/lib/reports/checklist-revision-history"

export function RevisionHistory({ revisions }: { revisions: ChecklistRevisionHistory[] }) {
  if (!revisions.length) return null

  const formatDate = (date: string) => new Date(date).toLocaleString("id-ID", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta",
  })

  return (
    <section className="space-y-3" aria-labelledby="revision-history-title">
      <h3 id="revision-history-title" className="text-sm font-bold text-slate-900">Riwayat Revisi</h3>
      {revisions.map((revision) => (
        <article key={revision.id} className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <p className="font-semibold text-slate-900">
            {revision.reviewerName ? `${revision.reviewerName} (${revision.reviewerId})` : "Reviewer tidak tercatat"}
            {revision.reviewStage && ` · ${revision.reviewStage === "PENDING_COORD" ? "Koordinator" : "Manager"}`}
            {revision.requestedAt && ` · ${formatDate(revision.requestedAt)}`}
          </p>
          <p className="whitespace-pre-wrap break-words text-slate-700">{revision.reason ?? "Alasan revisi sebelumnya tidak tersimpan."}</p>
          {revision.resubmittedAt && (
            <details>
              <summary className="cursor-pointer font-semibold text-slate-800">
                Dikirim ulang {formatDate(revision.resubmittedAt)} · {revision.changes.length} perubahan
              </summary>
              {revision.changes.length > 0 && (
                <dl className="mt-2 divide-y divide-slate-100">
                  {revision.changes.map((change, index) => (
                    <div key={`${change.field}-${index}`} className="grid gap-1 py-2 sm:grid-cols-3">
                      <dt className="font-medium text-slate-900">{change.field}</dt>
                      <dd className="break-words text-slate-600">Sebelum {change.before}</dd>
                      <dd className="break-words text-slate-800">Sesudah {change.after}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </details>
          )}
        </article>
      ))}
    </section>
  )
}
