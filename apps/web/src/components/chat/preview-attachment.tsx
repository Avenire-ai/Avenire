"use client"

import { useState } from "react"
import { Button } from "@avenire/ui/components/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@avenire/ui/components/dialog"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@avenire/ui/components/tooltip"
import { LoaderIcon, File, X } from "lucide-react"
import { motion } from "motion/react"

export type Attachment = {
  id: string
  file: File
  name: string
  url: string
  contentType: string
  status: "pending" | "uploading" | "completed" | "failed"
  abortController?: AbortController
}

export const PreviewAttachment = ({
  attachment,
  onRemove,
}: {
  attachment: Partial<Attachment>
  onRemove?: (
    type:
      | { status: "uploading" | "pending" | "failed"; id: string; url: undefined }
      | { status: "completed"; id: undefined; url: string },
  ) => void
}) => {
  const { name, url, contentType, status, file } = attachment
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [textPreview, setTextPreview] = useState<string | null>(null)

  const getFileSize = () => {
    if (file?.size) {
      const sizeInKB = file.size / 1024
      if (sizeInKB < 1024) {
        return `${sizeInKB.toFixed(1)}KB`
        // biome-ignore lint/style/noUselessElse: <explanation>
      } else {
        return `${(sizeInKB / 1024).toFixed(1)}MB`
      }
    }
    return ""
  }

  const loadTextPreview = async () => {
    if (contentType?.startsWith("text") && url && !textPreview && status === "completed") {
      try {
        const response = await fetch(url)
        const text = await response.text()
        setTextPreview(text)
      } catch (error) {
        console.error("Failed to load text preview:", error)
      }
    }
  }

  const renderThumbnail = () => {
    if (contentType?.startsWith("image") && url) {
      return (
        <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0 relative">
          <img
            src={url || "/placeholder.svg"}
            alt={name ?? "An image attachment"}
            className="w-full h-full object-cover"
          />
          {(status === "uploading" || status === "pending") && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <LoaderIcon className="h-4 w-4 animate-spin text-white" />
            </div>
          )}
        </div>
      )
      // biome-ignore lint/style/noUselessElse: <explanation>
    } else if (contentType?.startsWith("text") && textPreview) {
      return (
        <div className="w-12 h-12 rounded-md bg-green-50 border border-green-200 flex-shrink-0 p-1 relative">
          <div className="w-full h-full bg-white rounded-sm p-1 overflow-hidden">
            <div className="text-[6px] leading-tight text-gray-600 font-mono">{textPreview.substring(0, 80)}</div>
          </div>
          {(status === "uploading" || status === "pending") && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-md">
              <LoaderIcon className="h-4 w-4 animate-spin text-foreground" />
            </div>
          )}
        </div>
      )
      // biome-ignore lint/style/noUselessElse: <explanation>
    } else {
      return (
        <div className="w-12 h-12 rounded-md bg-muted border flex items-center justify-center flex-shrink-0 relative">
          <File className="h-6 w-6 text-muted-foreground" />
          {(status === "uploading" || status === "pending") && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-md">
              <LoaderIcon className="h-4 w-4 animate-spin text-foreground" />
            </div>
          )}
        </div>
      )
    }
  }

  const renderHoverPreview = () => {
    if (contentType?.startsWith("image") && url && status === "completed") {
      return (
        <div className="max-w-xs">
          <img
            src={url || "/placeholder.svg"}
            alt={name ?? "Preview"}
            className="rounded-md object-cover max-h-48 max-w-full"
          />
        </div>
      )
      // biome-ignore lint/style/noUselessElse: <explanation>
    } else if (contentType?.startsWith("text") && textPreview) {
      return (
        <div className="max-w-xs p-3 bg-muted rounded-md">
          <pre className="text-xs whitespace-pre-wrap font-mono">
            {textPreview.substring(0, 300) + (textPreview.length > 300 ? "..." : "")}
          </pre>
        </div>
      )
    }
    return null
  }

  const renderModalContent = () => {
    if (contentType?.startsWith("image") && url && status === "completed") {
      return (
        <div className="flex justify-center">
          <img
            src={url || "/placeholder.svg"}
            alt={name ?? "Full preview"}
            className="rounded-md object-contain max-h-[70vh] max-w-full"
          />
        </div>
      )
      // biome-ignore lint/style/noUselessElse: <explanation>
    } else if (contentType?.startsWith("text") && textPreview) {
      return (
        <div className="max-h-[70vh] overflow-auto">
          <pre className="text-sm whitespace-pre-wrap font-mono p-4 bg-muted rounded-md">{textPreview}</pre>
        </div>
      )
    }
    return (
      <div className="text-center py-8">
        <File className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Preview not available for this file type</p>
      </div>
    )
  }

  const canPreview = status === "completed" && (contentType?.startsWith("image") || contentType?.startsWith("text"))

  return (
    <TooltipProvider>
      <motion.div
        className="relative group max-w-sm"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`p-3 py-1 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors ${canPreview ? "cursor-pointer" : ""
                }`}
              onClick={() => {
                if (canPreview) {
                  setIsModalOpen(true)
                  loadTextPreview()
                }
              }}
              onMouseEnter={loadTextPreview}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">{renderThumbnail()}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{name ?? "Unnamed file"}</p>
                  {getFileSize() && <p className="text-xs text-muted-foreground">{getFileSize()}</p>}
                  {status && status !== "completed" && (
                    <p className="text-xs text-muted-foreground capitalize">{status}</p>
                  )}
                </div>
                {onRemove && (
                  <Button
                    variant="ghost"
                    type="button"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (attachment.status) {
                        onRemove({
                          status: attachment.status,
                          url: attachment.url,
                          id: attachment.id,
                        } as any)
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="p-2">
            {renderHoverPreview() || <p>Click to preview file</p>}
          </TooltipContent>
        </Tooltip>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {renderThumbnail()}
                <span className="truncate max-w-[300px]">{name}</span>
                {getFileSize() && <span className="text-sm text-muted-foreground">({getFileSize()})</span>}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">{renderModalContent()}</div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </TooltipProvider>
  )
}
