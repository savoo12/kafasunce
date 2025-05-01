import { type NextRequest, NextResponse } from 'next/server';

// Get the API key from the server-side environment variable
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lon'); // OpenWeatherMap uses 'lon' 

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing latitude or longitude' }, { status: 400 });
  }

  if (!WEATHER_API_KEY) {
    console.error('WEATHER_API_KEY environment variable not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${WEATHER_API_KEY}`;

  try {
    console.log(`Fetching weather from OpenWeatherMap for: ${lat}, ${lng}`);
    const response = await fetch(apiUrl, {
      // Optional: Add caching headers if needed via Cloudflare settings later
      // next: { revalidate: 600 } // Example: Revalidate every 10 minutes
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenWeatherMap API error: ${response.status}`, errorText);
      return NextResponse.json({ error: `Failed to fetch weather: ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    
    // Basic validation of expected data
    if (!data || !data.main || !data.weather || !data.weather[0]) {
      console.error('Unexpected data structure from OpenWeatherMap:', data);
      return NextResponse.json({ error: 'Invalid data received from weather service' }, { status: 502 }); // Bad Gateway
    }

    console.log(`Successfully fetched weather for: ${lat}, ${lng}`);
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching weather via API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 