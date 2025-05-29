import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/config/api';
import { fetchWithProtocolFallback } from '@/lib/utils/fetch';

export async function POST(request: NextRequest) {
  console.log("PDFLaTeX compiler endpoint called");
  const startTime = Date.now();
  
  try {
    // Get request body
    const body = await request.json();
    console.log("Request body:", body);
    
    // Extract user credits if provided
    const { userCredits } = body;
    
    // If user credits were provided, check if they're sufficient
    if (userCredits !== undefined && userCredits < 2) {
      console.error("Insufficient credits for compilation:", userCredits);
      return NextResponse.json({
        error: 'INSUFFICIENT_CREDITS',
        details: 'You need at least 2 credits to compile LaTeX documents.',
        duration: 0,
        success: false,
        status: 'failure'
      }, { status: 402 }); // 402 Payment Required
    }
    
    // Simple flag processing - just ensure it's an array of strings
    if (body.flags) {
      // If it's not an array, make it one
      if (!Array.isArray(body.flags)) {
        body.flags = typeof body.flags === 'string' ? [body.flags] : [];
      }
      
      // Validate and sanitize flags - reject malformed ones
      body.flags = body.flags
        .filter((flag: any) => typeof flag === 'string' && flag.trim())
        .map((flag: string) => flag.trim())
        .filter((flag: string) => {
          // Must start with a dash
          if (!flag.startsWith('-')) {
            console.warn(`Rejecting flag without dash prefix: ${flag}`);
            return false;
          }
          
          // Check for common malformed flags (typos or partial flags)
          const commonFlags = [
            '-interaction',
            '-file-line-error', 
            '-halt-on-error',
            '-shell-escape',
            '-synctex'
          ];
          
          for (const validFlag of commonFlags) {
            // If it starts with a fragment of a valid flag but isn't the full flag, it's likely malformed
            if (flag.startsWith(validFlag.substring(0, 5)) && 
                !flag.startsWith(validFlag) && 
                flag.length > 4) {
              console.warn(`Rejecting likely malformed flag: ${flag}`);
              return false;
            }
          }
          
          return true;
        });
      
      console.log("Processed flags (validated):", body.flags);
    }
    
    // Set the compiler explicitly to pdflatex
    const requestWithCompiler = {
      ...body,
      compiler: 'pdflatex'
    };
    console.log("Forwarding to main compile endpoint with compiler set to pdflatex");
    
    // Get the request URL for the main compile endpoint using our helper
    const mainCompileUrl = getApiUrl('/api/compile', request.url);
    console.log("Main compile URL:", mainCompileUrl);
    
    // Forward to main compile endpoint with explicit compiler using our enhanced fetch
    const compileResponse = await fetchWithProtocolFallback(mainCompileUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify(requestWithCompiler)
    });
    
    console.log("Received response from main compile endpoint with status:", compileResponse.status);
    
    // Convert the response to text first for logging
    const responseText = await compileResponse.text();
    console.log("Response text (first 200 chars):", responseText.substring(0, 200));
    
    // Try to parse the response as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      
      // Ensure duration is included in the response
      if (!responseData.duration) {
        responseData.duration = (Date.now() - startTime) / 1000;
      }
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      return NextResponse.json({ 
        error: "Failed to parse compile response", 
        details: responseText.substring(0, 500),
        duration: (Date.now() - startTime) / 1000,
        success: false
      }, { status: 500 });
    }
    
    // Return the response from the main compile endpoint
    return NextResponse.json(responseData, {
      status: compileResponse.status
    });
  } catch (error) {
    console.error("Error in pdflatex route:", error);
    return NextResponse.json({
      error: "PDFLaTeX compilation route error",
      details: error instanceof Error ? error.message : String(error),
      duration: (Date.now() - startTime) / 1000,
      success: false,
      status: 'failure'
    }, { status: 500 });
  }
} 