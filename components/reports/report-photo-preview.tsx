"use client"

import Image from "next/image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

type ReportPhotoPreviewProps = {
  photo: { url: string; title: string } | null
  onClose: () => void
}

export function ReportPhotoPreview({ photo, onClose }: ReportPhotoPreviewProps) {
  return (
    <Dialog open={photo !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="z-[100] max-h-[90svh] sm:max-w-[min(95vw,1100px)] overflow-y-auto">
        <DialogTitle className="pr-8 break-words">{photo?.title || "Preview foto"}</DialogTitle>
        {photo && (
          <Image
            unoptimized
            src={photo.url}
            alt={photo.title}
            width={1600}
            height={1200}
            className="mx-auto h-auto max-h-[75svh] w-auto max-w-full object-contain"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
