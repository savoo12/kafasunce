'use client';

import { WeatherData } from '../components/WeatherService';

// Removed hardcoded key
// const WEATHER_API_KEY = '1758409198d598d5046d645f0bc7d0e3';

export async function fetchWeatherData(lat: number, lng: number): Promise<WeatherData> {
  try {
    // Fetch from our own API route
    const url = `/api/weather?lat=${lat}&lon=${lng}`;
    console.log('Fetching weather via proxy:', url);
    const response = await fetch(url);

    if (!response.ok) {
      let errorBody = 'Unknown API proxy error';
      try {
        errorBody = await response.text();
      } catch {}
      console.error(`Weather API proxy request failed: ${response.status} - ${response.statusText}`, errorBody);
      throw new Error(`Weather API proxy request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.main || !data.weather || !data.weather[0]) {
       console.error('Invalid data structure received from Weather API proxy:', data);
       throw new Error('Invalid data structure received from Weather API proxy');
    }

    const condition = data.weather[0].main;
    const weatherId = data.weather[0].id;

    return {
      temperature: Math.round(data.main.temp),
      condition: mapWeatherCondition(condition),
      isSunny: isSunnyCondition(condition, weatherId),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
      precipitation: data.rain ? data.rain['1h'] || 0 : 0,
      sunPosition: calculateSunPosition(data.coord.lat, data.coord.lon, data.dt)
    };
  } catch (error) {
    console.error('Error fetching or processing weather data via proxy:', error);
    // Fall back to mock data if API call fails
    console.warn('Falling back to mock weather data.')
    return getMockWeatherData(lat, lng);
  }
}

// Helper function to map OpenWeatherMap conditions to our app conditions
function mapWeatherCondition(condition: string): string {
  switch (condition.toLowerCase()) {
    case 'clear':
      return 'Sunny';
    case 'clouds':
      return 'Cloudy'; // Changed from Partly Cloudy for simplicity
    case 'rain':
    case 'drizzle':
      return 'Rainy';
    case 'thunderstorm':
      return 'Stormy';
    case 'snow':
      return 'Snowy';
    default:
      return condition; // Keep others like Mist, Fog, etc.
  }
}

// Determine if the weather condition is sunny
function isSunnyCondition(condition: string, weatherId: number): boolean {
  // Clear sky (800) only
  return condition.toLowerCase() === 'clear'; 
}

// Calculate sun position based on coordinates and time (simplified)
function calculateSunPosition(lat: number, lon: number, timestamp: number) {
  const date = new Date(timestamp * 1000);
  const hour = date.getHours();
  const altitude = hour >= 6 && hour <= 18 ? 90 - Math.abs(hour - 12) * 7.5 : 0;
  let azimuth = 0;
  if (hour >= 6 && hour <= 18) {
    azimuth = 90 + (hour - 6) * 15;
  } else if (hour > 18) {
    azimuth = 270 + (hour - 18) * 15;
  } else { 
    azimuth = 270 + (hour + 6) * 15;
  }
  return { azimuth, altitude };
}

// Fallback mock data generator
function getMockWeatherData(lng: number, lat: number): WeatherData {
  const seed = (lng * 100 + lat * 100) % 100;
  const isSunny = seed > 30;
  const temperature = Math.floor(20 + (seed % 10));
  return {
    temperature,
    condition: isSunny ? 'Sunny' : 'Cloudy',
    isSunny,
    precipitation: isSunny ? 0 : Math.floor(seed % 30),
    humidity: 40 + Math.floor(seed % 40),
    windSpeed: Math.floor(seed % 15),
    sunPosition: {
      azimuth: (seed % 360),
      altitude: 30 + (seed % 60)
    }
  };
} 