import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="font-sans antialiased"
    >
      <body>
        {children}
        <Toaster position="top-center" richColors closeButton theme="light" />
      </body>
    </html>
  )
}
