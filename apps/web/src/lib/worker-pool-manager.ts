// WorkerPoolManager for Pyodide WebWorkers (matplotlib)

const WORKER_SCRIPT_URL = '/matplotlib-worker.js';
const DEFAULT_POOL_SIZE = 3;
const PRELOAD_PACKAGES = ['matplotlib', 'numpy', 'pandas', 'scipy'];

export type WorkerHandle = {
  renderPlot: (code: string, theme: 'light' | 'dark') => Promise<{ dataUrl: string }>,
  terminate: () => void,
  _worker: Worker,
  _busy: boolean,
};

class WorkerPoolManager {
  private pool: WorkerHandle[] = [];
  private busyWorkers: Set<WorkerHandle> = new Set();
  private initialized = false;
  private poolSize: number;
  private warmingPromise: Promise<void> | null = null;

  constructor(poolSize = DEFAULT_POOL_SIZE) {
    this.poolSize = poolSize;
  }

  async warmPool(): Promise<void> {
    if (this.initialized) return;
    if (this.warmingPromise) return this.warmingPromise;

    this.warmingPromise = this._warmPool();
    return this.warmingPromise;
  }

  private async _warmPool(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    const promises = [];
    for (let i = 0; i < this.poolSize; i++) {
      promises.push(this.createWorker(true));
    }
    const workers = await Promise.all(promises);
    this.pool = workers;
  }

  private createWorker(preload = false): Promise<WorkerHandle> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(WORKER_SCRIPT_URL);
      let ready = false;
      const handle: WorkerHandle = {
        renderPlot: (code: string) => this.renderPlotWithWorker(handle, code),
        terminate: () => worker.terminate(),
        _worker: worker,
        _busy: false,
      };
      worker.onmessage = (e) => {
        const data = e.data;
        if (!ready && data.type === 'INITIALIZED') {
          ready = true;
          resolve(handle);
        }
      };
      worker.onerror = (err) => {
        if (!ready) reject(err);
      };
      // Send INITIALIZE message
      worker.postMessage({ type: 'INITIALIZE', packages: preload ? PRELOAD_PACKAGES : undefined });
    });
  }

  private renderPlotWithWorker(handle: WorkerHandle, code: string): Promise<{ dataUrl: string }> {
    return new Promise((resolve, reject) => {
      const worker = handle._worker;
      const requestId = Math.random().toString(36).slice(2);
      const onMessage = (e: MessageEvent) => {
        const data = e.data;
        if (data.requestId !== requestId) return;
        worker.removeEventListener('message', onMessage);
        handle._busy = false;
        if (data.success && data.dataUrl) {
          resolve({ dataUrl: data.dataUrl });
        } else {
          reject(new Error(data.error || 'Failed to render plot'));
        }
      };
      worker.addEventListener('message', onMessage);
      handle._busy = true;
      worker.postMessage({ type: 'RENDER_PLOT', code, requestId });
    });
  }

  async getAvailableWorker(): Promise<WorkerHandle> {
    await this.warmPool();
    // Find a free worker
    for (const handle of this.pool) {
      if (!handle._busy) {
        this.busyWorkers.add(handle);
        return handle;
      }
    }
    // All busy: spin up a cold worker
    const coldWorker = await this.createWorker(false);
    this.busyWorkers.add(coldWorker);
    return coldWorker;
  }

  releaseWorker(handle: WorkerHandle) {
    this.busyWorkers.delete(handle);
    // If not in pool, terminate (cold worker)
    if (!this.pool.includes(handle)) {
      handle.terminate();
    }
  }
}

// Singleton instance
let _manager: WorkerPoolManager | null = null;
export function getWorkerPoolManager() {
  if (!_manager) _manager = new WorkerPoolManager();
  return _manager;
}

// Pre-warm the pool immediately when this module is loaded
export function preWarmWorkerPool(): Promise<void> {
  const manager = getWorkerPoolManager();
  return manager.warmPool();
} 