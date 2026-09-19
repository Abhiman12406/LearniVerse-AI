/**
 * Dynamic API Gateway configuration for LearniVerse-AI.
 * Conforms to RENDER.md decoupled 3-tier architecture.
 *
 * In local dev (Vite proxy mode), VITE_API_URL is unset or empty, returning relative `""`
 * so Vite's dev proxy `/api` -> `http://127.0.0.1:8000` functions seamlessly.
 *
 * On Render static sites, VITE_API_URL is supplied via environment variable or .env.production
 * (default: `https://learniverse-backend-a4go.onrender.com`).
 * This helper normalizes protocol schemes and trims trailing slashes.
 */

export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;

  // If running locally in browser (localhost / 127.0.0.1), use relative path for local Vite proxy
  if (typeof window !== 'undefined') {
    const isLocal = window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1';
    if (isLocal && (!envUrl || envUrl.includes('onrender.com'))) {
      return '';
    }
  }

  if (!envUrl) {
    // If running in production in the browser on Render, default to the live backend instance
    if (typeof window !== 'undefined' && window.location?.hostname?.includes('onrender.com')) {
      return 'https://learniverse-backend-a4go.onrender.com';
    }
    return '';
  }

  let normalized = envUrl.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    if (normalized.startsWith('localhost') || normalized.startsWith('127.0.0.1')) {
      normalized = `http://${normalized}`;
    } else {
      normalized = `https://${normalized}`;
    }
  }

  return normalized.replace(/\/+$/, '');
}

/**
 * Resolves a full target URL for an API endpoint.
 *
 * @example
 * getApiUrl('/api/learner/profile')
 * // Returns: "https://learniverse-backend-a4go.onrender.com/api/learner/profile" (on Render)
 * // Returns: "/api/learner/profile" (in local dev Vite proxy)
 */
export function getApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${cleanEndpoint}` : cleanEndpoint;
}

