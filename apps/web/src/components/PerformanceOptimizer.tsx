'use client';

import { useEffect, useRef, useState } from 'react';
import { createIntersectionObserver, preloadResource } from '../lib/performance';

interface PerformanceOptimizerProps {
  children: React.ReactNode;
  preloadResources?: Array<{ href: string; as: string }>;
  lazyLoad?: boolean;
}

export function PerformanceOptimizer({
  children,
  preloadResources = [],
  lazyLoad = false
}: PerformanceOptimizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Preload critical resources
    preloadResources.forEach(({ href, as }) => {
      preloadResource(href, as);
    });

    // Lazy loading with intersection observer
    if (lazyLoad && containerRef.current) {
      const observer = createIntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer?.disconnect();
          }
        });
      });

      if (observer) {
        observer.observe(containerRef.current);
      }

      return () => observer?.disconnect();
    }

    setIsVisible(true);
  }, [lazyLoad, preloadResources]);

  if (lazyLoad && !isVisible) {
    return (
      <div ref={containerRef} className="min-h-[200px] flex items-center justify-center">
        <div className="animate-pulse bg-gray-200 rounded-lg h-32 w-full max-w-md"></div>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
}

// Hook for performance monitoring
export function usePerformanceMonitor() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Mark initial load
      performance.mark('app-initial-load');

      // Monitor long tasks
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            console.warn('Long task detected:', entry);
          }
        });
      });

      observer.observe({ entryTypes: ['longtask'] });

      return () => observer.disconnect();
    }
  }, []);
}

// Component for optimizing images
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}

// Component for optimizing fonts
export function OptimizedFont({
  href,
  rel = 'stylesheet'
}: {
  href: string;
  rel?: string;
}) {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = href;
    link.rel = rel;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [href, rel]);

  return null;
}
