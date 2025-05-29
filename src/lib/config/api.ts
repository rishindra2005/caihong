/**
 * API configuration for handling URL resolution across different environments
 * Helps with handling relative URLs and working with proxies like ngrok
 */

/**
 * Resolves an API path to a full URL based on the current request's origin
 * This handles both HTTP and HTTPS, as well as different domains (localhost, ngrok, etc.)
 * 
 * @param path - The API path (e.g., '/api/compile')
 * @param requestUrl - The current request URL
 * @returns The full API URL
 */
export function getApiUrl(path: string, requestUrl: string): string {
  try {
    const url = new URL(requestUrl);
    
    // Create the API URL using the origin from the request
    let apiUrl = new URL(path, url.origin);
    
    // Special case: If the target is localhost or 127.0.0.1 with a specific port,
    // force HTTP instead of HTTPS to avoid SSL certificate issues
    if (
      (apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1') && 
      apiUrl.port && 
      apiUrl.port !== '443' && 
      apiUrl.port !== '80'
    ) {
      // Handle localhost - use HTTP instead of HTTPS for local development
      apiUrl.protocol = 'http:';
      console.log(`Converting localhost URL to HTTP: ${apiUrl.toString()}`);
    }
    
    // For specific local development environment with port 8080
    if (apiUrl.port === '8080') {
      apiUrl.protocol = 'http:';
      console.log(`Converting port 8080 URL to HTTP: ${apiUrl.toString()}`);
    }
    
    return apiUrl.toString();
  } catch (error) {
    console.error("Error resolving API URL:", error);
    // Fallback to relative URL if there's an error
    return path;
  }
}

/**
 * Creates a relative URL for client-side requests
 * Use this for client components making fetch requests
 * 
 * @param path - The API path (e.g., '/api/compile')
 * @returns The relative API URL
 */
export function getClientApiUrl(path: string): string {
  // For client-side requests, just use relative URLs
  // This automatically adapts to whatever domain the app is hosted on
  return path.startsWith('/') ? path : `/${path}`;
} 