import dynamic from 'next/dynamic';
import { Suspense, Component } from 'react';

// Lazy load heavy third-party components with optimized loading states
export const LazyExcalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => ({ default: mod.Excalidraw })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading Excalidraw...</p>
        </div>
      </div>
    ),
  }
);

export const LazyDesmosCalculator = dynamic(
  () => import('desmos-react').then((mod) => ({ default: mod.GraphingCalculator })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading calculator...</p>
        </div>
      </div>
    ),
  }
);

export const LazyReactSyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then((mod) => ({ default: mod.Prism })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-muted/20 h-4 rounded w-full"></div>
    ),
  }
);

// Lazy load matplotlib renderer
export const LazyMatplotlibRenderer = dynamic(
  () => import('./matplotlib-renderer').then((mod) => ({ default: mod.MatplotlibRenderer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-32 bg-muted/20 rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <p className="text-xs text-muted-foreground">Loading plot...</p>
        </div>
      </div>
    ),
  }
);

// Lazy load mermaid components
export const LazyMermaid = dynamic(
  () => import('./mermaid').then((mod) => ({ default: mod.MermaidDiagram })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-32 bg-muted/20 rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <p className="text-xs text-muted-foreground">Loading diagram...</p>
        </div>
      </div>
    ),
  }
) as any;

// Wrapper component for lazy loading with error boundary
export function LazyComponentWrapper({
  children,
  fallback = (
    <div className="flex items-center justify-center h-32">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
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

// Error boundary for lazy components
export class LazyErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-32 bg-destructive/10 rounded-lg">
          <p className="text-destructive text-sm">Failed to load component</p>
        </div>
      );
    }

    return this.props.children;
  }
}