import { getWorkerPoolManager } from './worker-pool-manager';
import { getMatplotlibCache, setMatplotlibCache } from '../actions/actions';

// Helper to hash code using SHA-256
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function renderPlotOrchestrator({
  code,
  uploadFn,
  theme,
}: {
  code: string;
  uploadFn: (file: File) => Promise<string>;
  theme: 'light' | 'dark';
}): Promise<{ url: string } | { error: string }> {
  // Step 1: Check code size
  if (code.length > 4000) {
    return { error: 'Code is too large. Please simplify your plot.' };
  }

  // Step 2: Hash code
  const hash = await hashCode(code);

  // Step 3: Check backend cache first
  const cachedUrl = await getMatplotlibCache(hash);
  if (cachedUrl) {
    return { url: cachedUrl };
  }

  // Step 4: Render with worker
  const pool = getWorkerPoolManager();
  const worker = await pool.getAvailableWorker();

  try {
    const result = await worker.renderPlot(code, theme);
    pool.releaseWorker(worker);

    if (!result?.dataUrl) {
      return { error: 'Worker did not return a valid image' };
    }

    // Step 5: Convert data URL to blob and upload
    const response = await fetch(result.dataUrl);
    const blob = await response.blob();
    const file = new File([blob], 'plot.png', { type: 'image/png' });
    const uploadedUrl = await uploadFn(file);

    // Step 6: Set cache (don't double-check, just set it)
    await setMatplotlibCache(hash, uploadedUrl);

    return { url: uploadedUrl };
  } catch (err: any) {
    pool.releaseWorker(worker);
    return { error: err.message || 'Failed to render plot' };
  }
} 