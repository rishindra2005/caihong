/**
 * Enhanced fetch utilities with retry logic and protocol fallback
 * Helps when dealing with mixed HTTP/HTTPS environments and network issues
 */

/**
 * Attempts to fetch a URL, automatically retrying with HTTP if HTTPS fails
 * This is particularly useful in development environments or when using ngrok
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Promise with the fetch response
 */
export async function fetchWithProtocolFallback(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // First try with the provided URL
  try {
    console.log(`Fetching URL: ${url}`);
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    
    // If the error is SSL-related and the URL is HTTPS, try HTTP instead
    if (
      url.startsWith('https:') &&
      error instanceof Error &&
      (
        error.message.includes('SSL') ||
        error.message.includes('certificate') ||
        error.message.includes('wrong version number') ||
        (error as any).code === 'ERR_SSL_WRONG_VERSION_NUMBER'
      )
    ) {
      const httpUrl = url.replace('https:', 'http:');
      console.log(`Retrying with HTTP URL: ${httpUrl}`);
      
      try {
        const response = await fetch(httpUrl, options);
        return response;
      } catch (retryError) {
        console.error(`Error on HTTP retry for ${httpUrl}:`, retryError);
        throw retryError; // Re-throw the retry error
      }
    }
    
    // For other errors, just re-throw
    throw error;
  }
}

/**
 * Enhanced fetch that handles common error cases and includes protocol fallback
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Promise with the fetch response
 */
export async function fetchWithErrorHandling(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    // Try the fetch with protocol fallback if needed
    const response = await fetchWithProtocolFallback(url, options);
    
    // Check if the response is ok (status in the range 200-299)
    if (!response.ok) {
      // Try to get more details from the response
      let errorDetails = `Status: ${response.status}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorJson = await response.json();
          errorDetails += ` - ${JSON.stringify(errorJson)}`;
        } else {
          const errorText = await response.text();
          if (errorText) {
            errorDetails += ` - ${errorText.substring(0, 100)}`;
            if (errorText.length > 100) errorDetails += '...';
          }
        }
      } catch {
        // Ignore errors in error handling
      }
      
      throw new Error(`Request failed: ${errorDetails}`);
    }
    
    return response;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
} 