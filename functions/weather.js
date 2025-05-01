// Cloudflare Worker for fetching weather data

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Get lat/lng from query parameters
  const lat = url.searchParams.get('lat');
  const lng = url.searchParams.get('lng');
  
  if (!lat || !lng) {
    return new Response(JSON.stringify({ 
      error: 'Missing lat/lng parameters' 
    }), { 
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  try {
    // In a production app, this would fetch data from a weather API
    // For demo purposes, we'll generate deterministic mock data
    
    // Simple deterministic "randomness" based on coordinates
    const seed = (parseFloat(lng) * 100 + parseFloat(lat) * 100) % 100;
    const isSunny = seed > 30;
    const temperature = Math.floor(20 + (seed % 10));
    
    // Create weather data response
    const weatherData = {
      temperature,
      condition: isSunny ? 'Sunny' : 'Partly Cloudy',
      isSunny,
      precipitation: isSunny ? 0 : Math.floor(seed % 30),
      humidity: 40 + Math.floor(seed % 40),
      windSpeed: Math.floor(seed % 15),
      timestamp: new Date().toISOString(),
      sunPosition: {
        azimuth: (seed % 360),
        altitude: 30 + (seed % 60)
      }
    };
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Return the weather data
    return new Response(JSON.stringify(weatherData), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=300' // Cache for 5 minutes
      }
    });
    
  } catch (error) {
    // Log the error (will appear in Cloudflare dashboard)
    console.error('Weather API error:', error);
    
    // Return error response
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch weather data' 
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
} 