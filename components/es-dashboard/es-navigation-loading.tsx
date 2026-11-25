import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function EsNavigationLoading() {
  return <div role="status" aria-label="Memuat halaman" className="es-report-surface es-light-workspace mx-auto max-w-4xl space-y-4 px-5 py-6"><Skeleton className="h-8 w-40"/><Skeleton className="h-4 w-64 max-w-full"/>{[0,1,2].map(i=><Card key={i}><CardContent className="space-y-3"><Skeleton className="h-5 w-40"/><Skeleton className="h-16 w-full"/><Skeleton className="h-4 w-2/3"/></CardContent></Card>)}</div>
}
