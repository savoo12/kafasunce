'use client';

import { useState, useEffect } from 'react';
import { WeatherData } from './WeatherService';

interface Venue {
  id: string;
  name: string;
  type: 'cafe' | 'pub' | 'restaurant';
  location: {
    lng: number;
    lat: number;
  };
  address: string;
  rating: number;
  hasOutdoorSeating: boolean;
  weather?: {
    temperature: number;
    condition: string;
    isSunny: boolean;
  };
}

interface RecommendationProps {
  venues: Venue[];
  currentWeather?: WeatherData;
  onSelectVenue: (venue: Venue) => void;
}

export default function VenueRecommendations({ 
  venues,
  currentWeather,
  onSelectVenue 
}: RecommendationProps) {
  const [recommendations, setRecommendations] = useState<Venue[]>([]);
  const [recommendationType, setRecommendationType] = useState<string>('weather');

  useEffect(() => {
    // Generate recommendations based on the current criteria
    if (venues.length === 0) return;
    
    let recommended: Venue[] = [];
    
    switch (recommendationType) {
      case 'weather':
        recommended = getWeatherBasedRecommendations(venues, currentWeather);
        break;
      case 'top-rated':
        recommended = getTopRatedVenues(venues);
        break;
      case 'outdoor':
        recommended = getOutdoorVenues(venues, currentWeather);
        break;
      default:
        recommended = getWeatherBasedRecommendations(venues, currentWeather);
    }
    
    setRecommendations(recommended.slice(0, 3)); // Limit to 3 recommendations
  }, [venues, currentWeather, recommendationType]);

  // Generate recommendations based on current weather
  const getWeatherBasedRecommendations = (venues: Venue[], weather?: WeatherData): Venue[] => {
    if (!weather) return getTopRatedVenues(venues);
    
    // If it's sunny, recommend venues with outdoor seating
    if (weather.isSunny && weather.temperature > 18) {
      const sunnyOutdoorVenues = venues.filter(
        venue => venue.hasOutdoorSeating && venue.weather?.isSunny
      );
      return sunnyOutdoorVenues.length > 0
        ? sunnyOutdoorVenues.sort((a, b) => b.rating - a.rating)
        : getTopRatedVenues(venues);
    }
    
    // If it's cold or rainy, recommend indoor venues
    if (weather.temperature < 12 || weather.precipitation > 0) {
      const indoorVenues = venues.filter(venue => !venue.hasOutdoorSeating);
      return indoorVenues.length > 0
        ? indoorVenues.sort((a, b) => b.rating - a.rating)
        : getTopRatedVenues(venues);
    }
    
    // Default to top rated
    return getTopRatedVenues(venues);
  };

  // Get top rated venues
  const getTopRatedVenues = (venues: Venue[]): Venue[] => {
    return [...venues].sort((a, b) => b.rating - a.rating);
  };

  // Get venues with outdoor seating
  const getOutdoorVenues = (venues: Venue[], weather?: WeatherData): Venue[] => {
    let outdoorVenues = venues.filter(venue => venue.hasOutdoorSeating);
    
    // If we have weather data, prioritize sunny spots
    if (weather && weather.isSunny) {
      outdoorVenues = outdoorVenues.sort((a, b) => {
        // Prioritize sunny spots, then by rating
        if (a.weather?.isSunny && !b.weather?.isSunny) return -1;
        if (!a.weather?.isSunny && b.weather?.isSunny) return 1;
        return b.rating - a.rating;
      });
    } else {
      // Otherwise sort by rating
      outdoorVenues = outdoorVenues.sort((a, b) => b.rating - a.rating);
    }
    
    return outdoorVenues;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden w-full mt-4">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold">Recommended For You</h2>
        
        <div className="flex mt-2 space-x-2 overflow-x-auto py-2">
          <button 
            onClick={() => setRecommendationType('weather')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              recommendationType === 'weather' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            Weather-based
          </button>
          <button 
            onClick={() => setRecommendationType('top-rated')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              recommendationType === 'top-rated' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            Top Rated
          </button>
          <button 
            onClick={() => setRecommendationType('outdoor')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              recommendationType === 'outdoor' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            Outdoor Seating
          </button>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {recommendations.length > 0 ? (
          recommendations.map(venue => (
            <div 
              key={venue.id} 
              className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition"
              onClick={() => onSelectVenue(venue)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{venue.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{venue.address}</p>
                  <div className="flex items-center mt-1">
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      {venue.type}
                    </span>
                    {venue.hasOutdoorSeating && (
                      <span className="ml-2 text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">
                        Outdoor Seating
                      </span>
                    )}
                    <span className="ml-2 text-xs px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100">
                      {venue.rating.toFixed(1)} ★
                    </span>
                  </div>
                </div>
                
                {venue.weather && (
                  <div className="text-right">
                    <div className={`text-lg font-bold ${venue.weather.isSunny ? 'text-yellow-500' : 'text-gray-500'}`}>
                      {venue.weather.temperature}°C
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{venue.weather.condition}</div>
                  </div>
                )}
              </div>
              
              {/* Recommendation reason */}
              <div className="mt-2 text-xs italic text-gray-500 dark:text-gray-400">
                {recommendationType === 'weather' && venue.weather?.isSunny && venue.hasOutdoorSeating && (
                  <p>Perfect for enjoying the sunny weather outdoors</p>
                )}
                {recommendationType === 'weather' && !venue.weather?.isSunny && !venue.hasOutdoorSeating && (
                  <p>Cozy indoor spot for the current weather</p>
                )}
                {recommendationType === 'top-rated' && (
                  <p>One of the highest rated venues in Belgrade</p>
                )}
                {recommendationType === 'outdoor' && venue.weather?.isSunny && (
                  <p>Currently sunny with outdoor seating</p>
                )}
                {recommendationType === 'outdoor' && !venue.weather?.isSunny && (
                  <p>Outdoor seating available</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No recommendations available
          </div>
        )}
      </div>
    </div>
  );
} 