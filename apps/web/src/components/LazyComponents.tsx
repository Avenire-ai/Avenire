import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load heavy components
export const LazyExcalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => ({ default: mod.Excalidraw })),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-64">Loading Excalidraw...</div>,
  }
);


export const LazyDesmosCalculator = dynamic(
  () => import('desmos-react').then((mod) => ({ default: mod.GraphingCalculator })),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-64">Loading calculator...</div>,
  }
);

export const LazyReactSyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then((mod) => ({ default: mod.Prism })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 h-4 rounded"></div>,
  }
);

// Wrapper component for lazy loading with error boundary
export function LazyComponentWrapper({
  children,
  fallback = <div className="flex items-center justify-center h-32">Loading...</div>
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}
