'use client';

import React, { useState } from 'react';
import { useMapbox } from '../hooks/useMapbox';

export interface Venue {
  id: string;
  name: string;
  type: 'cafe' | 'pub' | 'restaurant';
  location: { lng: number; lat: number };
  address: string;
  rating: number;
  hasOutdoorSeating: boolean;
  weather?: {
    temperature: number;
    condition: string;
    isSunny: boolean;
  };
}

export interface CityWeather {
  temperature: number;
  condition: string;
  isSunny: boolean;
  precipitation: number;
  humidity: number;
  windSpeed: number;
}

interface HomeClientProps {
  initialVenues: Venue[];
  initialCityWeather: CityWeather;
}

// Define a typed GeoJSON Feature for venues
type VenueFeature = GeoJSON.Feature<GeoJSON.Point, {
  id: string;
  name: string;
  address: string;
  type: 'cafe' | 'pub' | 'restaurant';
  rating: number;
  hasOutdoorSeating: boolean;
}>;

export default function HomeClient({ initialVenues, initialCityWeather }: HomeClientProps) {
  const [venues] = useState<Venue[]>(initialVenues);
  const [currentWeather] = useState<CityWeather>(initialCityWeather);
  const [mapError, setMapError] = useState<string | null>(null);

  // Use the custom hook for map and venues layer
  const { mapContainerRef } = useMapbox(venues, setMapError);

  if (mapError) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-100">
        <p className="text-red-800">{mapError}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-grow relative">
        <div ref={mapContainerRef} className="absolute inset-0 map-container" />
      </div>
      <div className="p-4 bg-white dark:bg-slate-800">
        <h2 className="text-lg font-semibold">Venues Loaded: {venues.length}</h2>
        <p>Current Temp: {currentWeather.temperature}°C - {currentWeather.condition}</p>
      </div>
    </div>
  );
} 