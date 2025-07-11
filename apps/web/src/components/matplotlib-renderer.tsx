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
          <img
            src={imgUrl}
            alt="Generated plot enlarged"
            className="max-w-full max-h-full rounded-lg object-contain"
          />
          <DialogClose className="absolute top-4 right-4" />
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}; 