/**
 * Get the primary frontend URL from FRONTEND_URL environment variable.
 * FRONTEND_URL can contain multiple URLs separated by comma for CORS,
 * but for link generation we should only use the first (primary) URL.
 */
export function getPrimaryFrontendUrl(): string {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  // Split by comma and get the first URL, trimming any whitespace
  return frontendUrl.split(',')[0].trim();
}
