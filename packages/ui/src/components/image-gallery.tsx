"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./carousel"
import { Dialog, DialogContent, DialogTitle } from "./dialog"
import { InlineMath } from 'react-katex'

interface ImageGalleryProps {
  images: Array<{
    src: string,
    alt: string
  }>
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [open, setOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Show up to 16 images in a 4x4 grid
  const visibleImages = images.slice(0, 4)
  const hasMoreImages = images.length > 4

  return (
    <div className="w-full">
      {/* Grid of images */}
      <div className="grid grid-cols-2 gap-2">
        {visibleImages.map((image, index) => (
          <div
            key={index}
            className="relative aspect-square cursor-pointer overflow-hidden rounded-lg border"
            onClick={() => {
              setCurrentIndex(index)
              setOpen(true)
            }}
          >
            <img
              src={image.src || "/placeholder.svg"}
              alt={image.alt}
              className="object-cover transition-transform hover:scale-105"
            />

            {/* Overlay for the last visible image when there are more */}
            {hasMoreImages && index === images.length - 2 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
                <div className="flex flex-col items-center">
                  <Plus className="h-8 w-8" />
                  <span className="text-xl font-bold">{images.length - 3}</span>
                  <span className="text-sm">more</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Popup Carousel Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl p-0 sm:p-0">
          <div className="relative h-[80vh] w-full">
            <Carousel
              className="h-full w-full"
              opts={{
                startIndex: currentIndex,
                loop: true,
              }}
            >
              <CarouselContent className="h-full">
                {images.map((image, index) => (
                  <CarouselItem key={index} className="h-full flex flex-col items-center">
                    <div className="relative flex flex-col h-full w-full items-center justify-center p-4">
                      <DialogTitle className="pb-3">Graph of <InlineMath math={image.alt} /></DialogTitle>
                      <img
                        src={image.src || "/placeholder.svg"}
                        alt={image.alt}
                        className="h-1/2 w-1/2 object-contain"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 