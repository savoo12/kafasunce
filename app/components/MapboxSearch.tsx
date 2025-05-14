'use client';

import { useEffect, useRef } from 'react';
import mapboxgl, { Map as MapboxMap } from 'mapbox-gl';

// Use the public Mapbox Search token from environment
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_SEARCH_TOKEN!;

// Define window augmentation for TypeScript
declare global {
  interface Window {
    mapboxsearch: {
      MapboxSearchBox: any;
    }
  }
}

// Define a type for the venue
interface Venue {
  id: string;
  name: string;
  type: 'cafe' | 'pub' | 'restaurant';
  location: { lng: number; lat: number };
  address: string;
  rating: number;
  hasOutdoorSeating: boolean;
}

interface MapboxSearchProps {
  mapRef: React.RefObject<MapboxMap | null>;
  onSelectVenue: (venue: Venue) => void;
}

export default function MapboxSearch({ mapRef, onSelectVenue }: MapboxSearchProps) {
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const searchBoxInstance = useRef<any>(null);

  useEffect(() => {
    function initializeSearch() {
      if (!MAPBOX_ACCESS_TOKEN) {
        console.error('Mapbox Search token is missing. Set NEXT_PUBLIC_MAPBOX_SEARCH_TOKEN in your env.');
        return;
      }
      if (!window.mapboxsearch) {
        console.error('Mapbox Search JS not loaded');
        return;
      }
      if (!mapRef.current || !searchBoxRef.current || searchBoxInstance.current) return;
      try {
        const searchBox = new window.mapboxsearch.MapboxSearchBox();
        searchBox.accessToken = MAPBOX_ACCESS_TOKEN;
        searchBox.options = {
          proximity: [20.46, 44.81],
          countries: ['RS'],
          language: 'en',
          limit: 5
        };
        searchBox.marker = false;
        searchBox.mapboxgl = mapboxgl;

        const searchBoxEl = searchBox.onAdd(mapRef.current);
        searchBoxRef.current.innerHTML = '';
        searchBoxRef.current.appendChild(searchBoxEl);

        searchBoxInstance.current = searchBox;
        searchBox.addEventListener('retrieve', (event: any) => {
          const response = event.detail;
          if (!response?.features || response.features.length === 0) return;
          const f = response.features[0];
          const coords = f.geometry?.coordinates;
          if (!coords || coords.length < 2) return;
          const venue: Venue = {
            id: f.id || Math.random().toString(36).substring(2, 9),
            name: f.properties?.name || 'Unknown Venue',
            type: determineVenueType(f.properties?.category || ''),
            location: { lng: coords[0], lat: coords[1] },
            address: f.properties?.address || '',
            rating: 4.5,
            hasOutdoorSeating: false
          };
          onSelectVenue(venue);
        });
      } catch (err) {
        console.error('Failed to initialize Mapbox SearchBox:', err);
      }
    }
    // Initialize immediately if script loaded, otherwise wait for event
    if (window.mapboxsearch) {
      initializeSearch();
    } else {
      window.addEventListener('mapbox-search-loaded', initializeSearch);
    }
    return () => {
      window.removeEventListener('mapbox-search-loaded', initializeSearch);
      if (searchBoxInstance.current) {
        try { searchBoxInstance.current.onRemove(); } catch (e) { console.error('Error removing search box:', e); }
        searchBoxInstance.current = null;
      }
    };
  }, [mapRef, onSelectVenue]);
  
  // Helper function to determine venue type
  const determineVenueType = (category: string): 'cafe' | 'pub' | 'restaurant' => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('cafe') || lowerCategory.includes('coffee')) {
      return 'cafe';
    } else if (lowerCategory.includes('pub') || lowerCategory.includes('bar')) {
      return 'pub';
    } else {
      return 'restaurant';
    }
  };

  return (
    // Use responsive Tailwind classes for positioning
    <div className="absolute z-10 w-[calc(100%-2rem)] md:w-auto left-4 right-4 md:left-4 md:right-auto top-auto bottom-4 md:top-4 md:bottom-auto max-w-lg mx-auto md:mx-0">
      <div ref={searchBoxRef} className="w-full"></div>
    </div>
  );
}