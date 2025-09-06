// Matplotlib Web Worker
// Simplified version: loads core packages once, minimal package detection, fast rendering

const IS_DEV = self.location.hostname === 'localhost';

const logger = {
  info: (...args) => {
    if (IS_DEV) {
      console.info(...args);
    }
  },
  warn: (...args) => {
    if (IS_DEV) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    console.error(...args);
  }
};

let pyodideInstance = null;
let isInitializing = false;
let initPromise = null;
const loadedPackages = new Set();
const CORE_PACKAGES = ['requests', 'matplotlib', 'numpy', 'pandas', 'scipy'];

// Initialize Pyodide and core packages
async function initializePyodide() {
  if (pyodideInstance) {
    logger.info('[matplotlib-worker] Pyodide already initialized');
    return pyodideInstance;
  }
  if (isInitializing) {
    logger.info('[matplotlib-worker] Pyodide initialization already in progress');
    return initPromise;
  }
  isInitializing = true;
  logger.info('[matplotlib-worker] Starting Pyodide initialization...');
  initPromise = new Promise((resolve, reject) => {
    (async () => {
      try {
        importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js');
        logger.info('[matplotlib-worker] pyodide.js script loaded');
        pyodideInstance = await loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/'
        });
        logger.info('[matplotlib-worker] Pyodide loaded, loading core packages:', CORE_PACKAGES);
        await pyodideInstance.loadPackage(CORE_PACKAGES);
        CORE_PACKAGES.forEach(pkg => loadedPackages.add(pkg));
        isInitializing = false;
        logger.info('[matplotlib-worker] Core packages loaded');
        resolve(pyodideInstance);
      } catch (error) {
        isInitializing = false;
        logger.error('[matplotlib-worker] Pyodide initialization failed:', error);
        reject(error);
      }
    })();
  });
  return initPromise;
}

// Simple package detection - only check for common packages
function detectExtraPackages(code) {
  const commonPackages = ['seaborn', 'plotly', 'bokeh', 'altair', 'statsmodels', 'scikit-learn'];
  const detected = [];
  for (const pkg of commonPackages) {
    if (code.includes(`import ${pkg}`) || code.includes(`from ${pkg}`)) {
      detected.push(pkg);
    }
  }
  return detected.filter(pkg => !loadedPackages.has(pkg));
}

// Helper to hash code using SHA-256
async function hashCode(code) {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Process matplotlib code
async function processMatplotlibCode(code, requestId, theme) {
  try {
    logger.info('[matplotlib-worker] Received code to render (length):', code.length, 'RequestId:', requestId);
    if (code.length > 4000) {
      throw new Error('Code is too large. Please simplify your plot.');
    }
    
    const pyodide = await initializePyodide();
    
    // Load any detected extra packages
    const extraPackages = detectExtraPackages(code);
    if (extraPackages.length > 0) {
      logger.info('[matplotlib-worker] Loading extra packages:', extraPackages);
      await pyodide.loadPackage(extraPackages);
      extraPackages.forEach(pkg => loadedPackages.add(pkg));
      logger.info('[matplotlib-worker] Extra packages loaded:', extraPackages);
    }
    
    // Run the matplotlib code
    const pythonCode = `
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io

${code}
buf = io.BytesIO()
plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
buf.seek(0)
import base64
b64 = base64.b64encode(buf.read()).decode('utf-8')
plt.close()
`;
    logger.info('[matplotlib-worker] Running Python code in Pyodide...');
    await pyodide.runPythonAsync(pythonCode);
    
    const b64 = pyodide.globals.get('b64');
    if (!b64 || typeof b64 !== 'string' || b64.length < 10) {
      logger.error('[matplotlib-worker] No image was generated.');
      throw new Error('No image was generated. Please check your code for errors.');
    }
    
    const hash = await hashCode(code);
    logger.info('[matplotlib-worker] Plot rendered successfully. RequestId:', requestId);
    return {
      success: true,
      dataUrl: `data:image/png;base64,${b64}`,
      hash: hash,
      requestId: requestId
    };
  } catch (error) {
    logger.error('[matplotlib-worker] Error during plot rendering:', error);
    return {
      success: false,
      error: error.message || 'Failed to render plot',
      requestId: requestId
    };
  }
}

// Handle messages from main thread
self.onmessage = async (e) => {
  const { type, code, requestId, theme } = e.data;
  logger.info('[matplotlib-worker] Received message:', type, 'RequestId:', requestId);
  switch (type) {
    case 'RENDER_PLOT': {
      const result = await processMatplotlibCode(code, requestId, theme);
      self.postMessage(result);
      break;
    }
    case 'INITIALIZE': {
      try {
        await initializePyodide();
        self.postMessage({ type: 'INITIALIZED', success: true });
        logger.info('[matplotlib-worker] Worker initialized and ready.');
      } catch (error) {
        self.postMessage({ type: 'INITIALIZED', success: false, error: error.message });
        logger.error('[matplotlib-worker] Worker failed to initialize:', error);
      }
      break;
    }
    default: {
      logger.warn('[matplotlib-worker] Unknown message type:', type);
      self.postMessage({ 
        success: false, 
        error: 'Unknown message type',
        requestId: requestId 
      });
    }
  }
};