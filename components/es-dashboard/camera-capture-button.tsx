"use client"

import * as React from "react"
import { Camera, Loader2, RotateCcw, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ChecklistPhotoWatermarkLine } from "@/lib/checklists/photo-watermark"

type CameraCaptureButtonProps = {
  disabled?: boolean
  uploading?: boolean
  watermarkLines: ChecklistPhotoWatermarkLine[]
  onCapture(file: File): void
}

function createCaptureFile(blob: Blob) {
  return new File([blob], `checklist-photo-${Date.now()}.jpg`, {
    type: "image/jpeg",
  })
}

function drawWatermark(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  lines: ChecklistPhotoWatermarkLine[]
) {
  const padding = Math.max(18, Math.round(canvasWidth * 0.018))
  const fontSize = Math.max(16, Math.round(canvasWidth * 0.021))
  const lineHeight = Math.round(fontSize * 1.28)
  const shadowOffset = Math.max(2, Math.round(fontSize * 0.12))

  context.save()
  context.textAlign = "right"
  context.textBaseline = "bottom"
  context.fillStyle = "rgba(255, 255, 255, 0.96)"
  context.shadowColor = "rgba(0, 0, 0, 0.72)"
  context.shadowBlur = shadowOffset * 1.6
  context.shadowOffsetX = shadowOffset
  context.shadowOffsetY = shadowOffset

  lines
    .slice()
    .reverse()
    .forEach((line, index) => {
      context.font = `${line.weight} ${fontSize}px Arial, sans-serif`
      context.fillText(
        line.text,
        canvasWidth - padding,
        canvasHeight - padding - index * lineHeight
      )
    })
  context.restore()
}

export function CameraCaptureButton({
  disabled,
  uploading,
  watermarkLines,
  onCapture,
}: CameraCaptureButtonProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const [stream, setStream] = React.useState<MediaStream | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  const [isStarting, setIsStarting] = React.useState(false)
  const [error, setError] = React.useState<string>()

  React.useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  React.useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  function stopCamera() {
    setStream((current) => {
      current?.getTracks().forEach((track) => track.stop())
      return null
    })
  }

  async function openCamera() {
    setError(undefined)
    setIsOpen(true)
    setIsStarting(true)

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      setStream(nextStream)
    } catch {
      setError(
        "Kamera tidak bisa dibuka. Izinkan akses kamera di browser, lalu coba lagi."
      )
    } finally {
      setIsStarting(false)
    }
  }

  function closeCamera() {
    stopCamera()
    setIsOpen(false)
  }

  async function capture() {
    const video = videoRef.current
    if (!video) return

    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")
    context?.drawImage(video, 0, 0, width, height)
    if (context) {
      drawWatermark(context, width, height, watermarkLines)
    }

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.88)
    })

    if (!blob) {
      setError("Foto gagal diambil. Coba ulangi sekali lagi.")
      return
    }

    onCapture(createCaptureFile(blob))
    closeCamera()
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || uploading}
        onClick={openCamera}
        className="h-12 w-full border-dashed border-[#cfcfcf] bg-white text-[#111111] hover:bg-[#f6f6f4]"
      >
        {uploading ? (
          <Loader2 className="animate-spin" data-icon="inline-start" />
        ) : (
          <Camera data-icon="inline-start" />
        )}
        {uploading ? "Mengupload..." : "Ambil foto"}
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 bg-black text-white">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={closeCamera}
              className="text-white hover:bg-white/15 hover:text-white"
              aria-label="Tutup kamera"
            >
              <X aria-hidden="true" />
            </Button>
            <span className="rounded-full bg-black/45 px-3 py-1 text-xs font-semibold backdrop-blur">
              Kamera bukti checklist
            </span>
          </div>

          {error ? (
            <div className="absolute inset-x-4 top-24 rounded-xl bg-white p-4 text-sm leading-5 text-[#111111] shadow-xl">
              {error}
              <Button
                type="button"
                onClick={openCamera}
                className="mt-3 h-10 w-full bg-[#111111] text-white hover:bg-[#242424]"
              >
                <RotateCcw data-icon="inline-start" />
                Coba lagi
              </Button>
            </div>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-black/75 to-transparent p-7 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              disabled={!stream || isStarting}
              onClick={capture}
              className="grid size-20 place-items-center rounded-full border-4 border-white bg-white/20 outline-none backdrop-blur transition-transform active:scale-95 disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-[#ff8a2a]/60"
              aria-label="Ambil foto"
            >
              <span className="block size-14 rounded-full bg-white" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
