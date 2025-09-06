'use client';

import { useEffect, useState } from 'react';
import { useClientLogger } from '@avenire/logger/client';

export function ServiceWorkerRegistration() {
  const log = useClientLogger({ component: 'ServiceWorkerRegistration' });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });

          log.info('Service Worker registered successfully', { registration });

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, prompt user to refresh
                  if (confirm('New version available! Refresh to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });

          // Handle service worker messages
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'CACHE_UPDATED') {
              log.info('Cache updated', { payload: event.data.payload });
            }
          });

        } catch (error) {
          log.error('Service Worker registration failed', { error });
        }
      };

      registerSW();
    }
  }, []);

  return null;
}

// Hook for checking online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Component to show offline indicator
export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-500 text-yellow-900 px-4 py-2 rounded-lg shadow-lg">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-yellow-900 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium">You're offline</span>
      </div>
    </div>
  );
}
