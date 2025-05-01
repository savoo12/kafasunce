// Service for fetching weather data
// This would typically connect to a real weather API
// For now, we'll use mock data

export interface WeatherData {
  temperature: number;
  condition: string;
  isSunny: boolean;
  sunPosition?: {
    azimuth: number;
    altitude: number;
  };
  precipitation: number;
  humidity: number;
  windSpeed: number;
  date?: string; // Add optional date property for forecasts
}

export async function getWeatherForLocation(lng: number, lat: number): Promise<WeatherData> {
  // In a real implementation, this would call a weather API
  // For example:
  // const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${lat},${lng}`);
  // const data = await response.json();
  
  // For demonstration, we'll return mock data
  // In a production app, replace with an actual API call
  
  // Simple deterministic "randomness" based on coordinates
  const seed = (lng * 100 + lat * 100) % 100;
  const isSunny = seed > 30;
  const temperature = Math.floor(20 + (seed % 10));
  
  return {
    temperature,
    condition: isSunny ? 'Sunny' : 'Partly Cloudy',
    isSunny,
    precipitation: isSunny ? 0 : Math.floor(seed % 30),
    humidity: 40 + Math.floor(seed % 40),
    windSpeed: Math.floor(seed % 15),
    sunPosition: {
      azimuth: (seed % 360),
      altitude: 30 + (seed % 60)
    },
    date: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
  };
}

// Helper function to determine if a location is likely to be in the sun or shade
// based on time of day, building heights, and sun position
export function isLocationSunny(
  sunAzimuth: number, 
  sunAltitude: number,
  buildingHeights: number[] = []
): boolean {
  // In a real app, this would use 3D building data and sun calculations
  // For demonstration, we'll use a simplified approach
  
  // Assume sunny if sun is high enough and no tall buildings nearby
  if (sunAltitude > 45 && buildingHeights.every(h => h < 20)) {
    return true;
  }
  
  // More complex algorithm would check for shadows based on building positions
  // relative to the sun azimuth
  
  // For now, return a simplified calculation
  return sunAltitude > 30 && buildingHeights.length < 3;
} 