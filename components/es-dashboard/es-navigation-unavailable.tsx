import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { EsNavigationShell } from "./es-navigation-shell"

export function EsNavigationUnavailable({ email, title, href }: { email: string; title: string; href: string }) {
  return <EsNavigationShell email={email} title={title} description="Data belum dapat dimuat."><Alert variant="destructive"><AlertTitle>Koneksi data belum tersedia</AlertTitle><AlertDescription>Data belum dapat ditampilkan. Coba muat ulang halaman; kondisi ini bukan berarti data kosong.</AlertDescription></Alert><a href={href} className="inline-flex rounded-lg border bg-card px-4 py-2 text-sm font-medium">Coba kembali</a></EsNavigationShell>
}
