"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useUploadThing } from "../lib/uploadClient";
import { Skeleton } from "@avenire/ui/components/skeleton";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
} from "@avenire/ui/components/dialog";
import { useMatplotlibPlot } from "../lib/useMatplotlibPlot";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Button } from "@avenire/ui/src/components/button";
import { MinusIcon, RefreshCw, PlusIcon } from "lucide-react";

// Debounce hook
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export const MatplotlibRenderer: React.FC<{ code: string }> = ({ code }) => {
  const [open, setOpen] = useState(false);
  const { startUpload } = useUploadThing("chatAttachments");

  const uploadFn = useCallback(async (file: File) => {
    const uploadResponse = await startUpload([file]);
    if (!uploadResponse || !uploadResponse[0]?.url) {
      throw new Error("Upload failed");
    }
    return uploadResponse[0].url;
  }, [startUpload]);

  // Debounce the code to avoid excessive renders
  const debouncedCode = useDebouncedValue(code, 400);

  const { loading, error, imgUrl } = useMatplotlibPlot({
    code: debouncedCode,
    uploadFn,
  });

  if (loading) {
    return <Skeleton className="w-full h-[200px] rounded-lg" />;
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 border border-red-200 rounded-lg bg-red-50">
        <strong>Plot Error:</strong> {error}
      </div>
    );
  }

  if (imgUrl) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <img
            src={imgUrl}
            alt="Generated plot"
            className="max-w-full max-h-[400px] rounded shadow cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setOpen(true)}
          />
        </DialogTrigger>
        <DialogContent className="flex flex-col items-center justify-center max-w-[95vw] max-h-[95vh]">
          <div className="w-full h-full flex flex-col items-center justify-center relative" style={{ minHeight: 300, minWidth: 300 }}>
            <TransformWrapper initialScale={1} minScale={0.5} maxScale={5} wheel={{ step: 0.1 }}>
              {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
                <>
                  <div className="flex gap-2 mb-2 z-10 absolute top-2 left-2">
                    <Button size="icon" type="button" onClick={() => zoomIn()} variant="ghost" aria-label="Zoom in">
                      <PlusIcon className="w-5 h-5" />
                    </Button>
                    <Button size="icon" type="button" onClick={() => zoomOut()} variant="ghost" aria-label="Zoom out">
                      <MinusIcon className="w-5 h-5" />
                    </Button>
                    <Button size="icon" type="button" onClick={() => resetTransform()} variant="ghost" aria-label="Reset zoom">
                      <RefreshCw className="w-5 h-5" />
                    </Button>
                  </div>
                  <TransformComponent>
                    <img
                      src={imgUrl}
                      alt="Generated plot enlarged"
                      className="max-w-full max-h-[80vh] rounded-lg object-contain select-none"
                      draggable={false}
                      style={{ display: 'block', margin: '0 auto' }}
                    />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
            <DialogClose className="absolute top-4 right-4" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}; 