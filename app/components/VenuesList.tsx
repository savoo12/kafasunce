'use client';

import { useState } from 'react';

// Define the venue type (matching the one in page.tsx)
interface Venue {
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

// Define props for the component
interface VenuesListProps {
  venues: Venue[]; // Expect venues to be passed as a prop
  onSelectVenue: (venue: Venue) => void;
}

export default function VenuesList({ venues, onSelectVenue }: VenuesListProps) {
  // Remove internal state for venues, use the prop instead
  // const [venues, setVenues] = useState<Venue[]>(mockVenues);
  const [filter, setFilter] = useState('all');

  const filteredVenues = venues.filter(venue => {
    if (filter === 'all') return true;
    if (filter === 'sunny' && venue.weather?.isSunny) return true;
    if (filter === 'cafe' && venue.type === 'cafe') return true;
    if (filter === 'pub' && venue.type === 'pub') return true;
    return false;
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden w-full max-w-md">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold">Venues in Belgrade</h2>
        
        <div className="flex mt-2 space-x-2 overflow-x-auto py-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              filter === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('sunny')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              filter === 'sunny' 
                ? 'bg-yellow-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            Sunny Places
          </button>
          <button 
            onClick={() => setFilter('cafe')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              filter === 'cafe' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            Cafes
          </button>
          <button 
            onClick={() => setFilter('pub')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              filter === 'pub' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            Pubs
          </button>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[calc(100vh-200px)] overflow-y-auto">
        {filteredVenues.length > 0 ? (
          filteredVenues.map(venue => (
            <div 
              key={venue.id} 
              className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition"
              onClick={() => onSelectVenue(venue)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium flex items-center">
                    {venue.name}
                    {venue.weather && (
                      <span 
                        className={`weather-icon ${venue.weather.isSunny ? 'sunny' : 'cloudy'}`}
                        title={venue.weather.condition}
                      >
                        {venue.weather.isSunny ? '☀️' : '☁️'}
                      </span>
                    )}
                  </h3>
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
                  </div>
                </div>
                
                {venue.weather && (
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className={`text-lg font-bold ${venue.weather.isSunny ? 'text-yellow-500' : 'text-gray-500'}`}>
                      {venue.weather.temperature}°C
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No venues match your filters
          </div>
        )}
      </div>
    </div>
  );
} 