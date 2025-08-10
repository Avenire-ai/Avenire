import { useState, useEffect, useRef } from 'react';
import { renderPlotOrchestrator } from './plot-render-orchestrator';
import { useTheme } from 'next-themes';

export function useMatplotlibPlot({
  code,
  uploadFn,
}: {
  code: string;
  uploadFn: (file: File) => Promise<string>;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const uploadFnRef = useRef(uploadFn);
  const { theme } = useTheme();
  // Update the ref when uploadFn changes
  useEffect(() => {
    uploadFnRef.current = uploadFn;
  }, [uploadFn]);

  useEffect(() => {
    let cancelled = false;
    requestIdRef.current += 1;
    const thisRequest = requestIdRef.current;

    setLoading(true);
    setError(null);
    setImgUrl(null);

    renderPlotOrchestrator({ code, uploadFn: uploadFnRef.current, theme: theme as 'light' | 'dark' }).then(result => {
      if (cancelled || requestIdRef.current !== thisRequest) return;
      if ('url' in result) {
        setImgUrl(result.url);
        setError(null);
      } else {
        setImgUrl(null);
        setError(result.error || 'Unknown error');
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [code]); // Only depend on code, not uploadFn

  return { loading, error, imgUrl };
} 