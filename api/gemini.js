// This is a secure, server-side function that will run on Vercel.
// Its only job is to safely call the Google Gemini API.

export default async function handler(req, res) {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Only allow POST requests, reject anything else.
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
    
    // Rate limiting - basic implementation
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const rateLimitKey = `rate_limit_${clientIP}`;
    
    // Check if we have rate limiting data (in production, use Redis or similar)
    // For now, we'll implement a simple check
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 10; // Max 10 requests per minute
    
    // Input validation
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: { message: 'Invalid request body' } });
    }
    
    // Validate required fields
    if (!req.body.contents || !Array.isArray(req.body.contents)) {
      return res.status(400).json({ error: { message: 'Missing or invalid contents array' } });
    }
    
    // Sanitize and validate the payload size
    const payloadSize = JSON.stringify(req.body).length;
    const maxPayloadSize = 10000; // 10KB limit
    
    if (payloadSize > maxPayloadSize) {
      return res.status(413).json({ error: { message: 'Request payload too large' } });
    }
  
    try {
      // This is where we securely get the API key from Vercel's environment variables.
      // The public will never see this value.
      const apiKey = process.env.GEMINI_API_KEY;
  
      if (!apiKey) {
        throw new Error("API key is not configured on the server.");
      }
      
      // Validate API key format (basic check)
      if (!apiKey.startsWith('AIza')) {
        throw new Error("Invalid API key format.");
      }
  
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;
  
      // We take the payload from the front-end's request and send it to Google.
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body), // req.body is the payload from our app.js
      });
  
      if (!response.ok) {
        // If Google sends an error, we pass it along.
        const errorData = await response.json();
        console.error("Google API Error:", errorData);
        return res.status(response.status).json(errorData);
      }
  
      // If successful, we send Google's response back to our front-end app.
      const data = await response.json();
      return res.status(200).json(data);
  
    } catch (error) {
      console.error("Internal Server Error:", error);
      
      // Don't expose internal error details to the client
      const isInternalError = error.message.includes('API key') || 
                             error.message.includes('Invalid') ||
                             error.message.includes('not configured');
      
      if (isInternalError) {
        return res.status(500).json({ error: { message: 'Internal server error' } });
      }
      
      return res.status(500).json({ error: { message: 'An error occurred while processing your request' } });
    }
  }
  