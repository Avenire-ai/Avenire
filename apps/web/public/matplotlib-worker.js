// Matplotlib Web Worker
// Simplified version: loads core packages once, minimal package detection, fast rendering

let pyodideInstance = null;
let isInitializing = false;
let initPromise = null;
const loadedPackages = new Set();
const CORE_PACKAGES = ['matplotlib', 'numpy', 'pandas', 'scipy'];

// Initialize Pyodide and core packages
async function initializePyodide() {
  if (pyodideInstance) return pyodideInstance;
  if (isInitializing) return initPromise;
  isInitializing = true;
  initPromise = new Promise((resolve, reject) => {
    (async () => {
      try {
        importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js');
        pyodideInstance = await loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/'
        });
        await pyodideInstance.loadPackage(CORE_PACKAGES);
        CORE_PACKAGES.forEach(pkg => loadedPackages.add(pkg));
        isInitializing = false;
        resolve(pyodideInstance);
      } catch (error) {
        isInitializing = false;
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
async function processMatplotlibCode(code, requestId) {
  try {
    if (code.length > 4000) {
      throw new Error('Code is too large. Please simplify your plot.');
    }
    
    const pyodide = await initializePyodide();
    
    // Load any detected extra packages
    const extraPackages = detectExtraPackages(code);
    if (extraPackages.length > 0) {
      await pyodide.loadPackage(extraPackages);
      extraPackages.forEach(pkg => loadedPackages.add(pkg));
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
    await pyodide.runPythonAsync(pythonCode);
    
    const b64 = pyodide.globals.get('b64');
    if (!b64 || typeof b64 !== 'string' || b64.length < 10) {
      throw new Error('No image was generated. Please check your code for errors.');
    }
    
    const hash = await hashCode(code);
    return {
      success: true,
      dataUrl: `data:image/png;base64,${b64}`,
      hash: hash,
      requestId: requestId
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to render plot',
      requestId: requestId
    };
  }
}

// Handle messages from main thread
self.onmessage = async (e) => {
  const { type, code, requestId } = e.data;
  switch (type) {
    case 'RENDER_PLOT': {
      const result = await processMatplotlibCode(code, requestId);
      self.postMessage(result);
      break;
    }
    case 'INITIALIZE': {
      try {
        await initializePyodide();
        self.postMessage({ type: 'INITIALIZED', success: true });
      } catch (error) {
        self.postMessage({ type: 'INITIALIZED', success: false, error: error.message });
      }
      break;
    }
    default: {
      self.postMessage({ 
        success: false, 
        error: 'Unknown message type',
        requestId: requestId 
      });
    }
  }
}; 